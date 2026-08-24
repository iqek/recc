import { getAllCachedItems } from '../repo.js';
import { ensureTrendingCached } from '../services/trendingCache.js';
import { buildIdf, vectorize, tagKey } from './vectorSpace.js';
import { cosineSimilarity, centroid, sharedKeys } from './similarity.js';
import { mmrRerank } from './mmr.js';
import { capPerFranchise, capPerKey, franchiseKey } from './franchise.js';

const SCORE_POOL_SIZE = 30; // how many top-scored candidates go into MMR re-ranking
const RESULT_COUNT = 10;
const MAX_PER_FRANCHISE = 2; // how many entries of the same series can appear in one result list
const MAX_PER_CREATOR = 3; // how many entries by the same author/studio/developer can appear

// Drops the least-popular slice of a pool (obscure/unofficial spam), only when the pool is large enough
function filterByPopularity(items) {
  const known = items.filter((i) => i.popularity != null);
  if (known.length < 15) return items;
  const sorted = [...known].sort((a, b) => b.popularity - a.popularity);
  const cutoff = sorted[Math.floor(sorted.length * 0.5)].popularity;
  return items.filter((i) => i.popularity == null || i.popularity >= cutoff);
}

/**
 * Scores cached candidates against a taste profile built from `profileItems` - your favorites for
 * the main Recommendations page, or one list's items for that list's own recommendations tab.
 * `engagedItems` (everything favorited or listed anywhere) keeps those, and sequels/seasons of
 * them, from being suggested back - a same-franchise entry isn't really a "discovery."
 */
export async function getRecommendations(profileItems, engagedItems, source) {
  const engagedIds = new Set(engagedItems.map((i) => i.id));
  const engagedFranchises = new Set(engagedItems.map((i) => franchiseKey(i.title)).filter(Boolean));

  await ensureTrendingCached(source);
  const rawCandidates = (await getAllCachedItems(source)).filter(
    (item) => !engagedIds.has(item.id) && !engagedFranchises.has(franchiseKey(item.title))
  );
  const candidates = filterByPopularity(rawCandidates);

  if (profileItems.length === 0) {
    return trendingFallback(source, candidates, 'trending',
      'Favorite a few things to get picks tailored to your taste. Showing what is trending for now.');
  }
  if (candidates.length === 0) {
    return { source, fallback: 'empty', message: `No ${source} items cached yet - search for a few first.`, items: [] };
  }

  const corpus = dedupeById([...candidates, ...profileItems]);
  const idf = buildIdf(corpus);

  const profileVectors = profileItems.map((f) => vectorize(f, idf));
  const profileWeights = profileItems.map((f) => (f.user_rating ?? 4) / 5);
  const profile = centroid(profileVectors, profileWeights);

  const vectorCache = new Map();
  const vectorOf = (item) => {
    if (!vectorCache.has(item.id)) vectorCache.set(item.id, vectorize(item, idf));
    return vectorCache.get(item.id);
  };

  const rankedByScore = candidates
    .map((item) => ({ item, score: cosineSimilarity(profile, vectorOf(item)) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  // cap same-franchise and same-creator spam before slicing, so no one series or author crowds out everything else
  const capped = capPerKey(
    capPerFranchise(rankedByScore, (c) => c.item.title, MAX_PER_FRANCHISE),
    (c) => c.item.creator?.toLowerCase() ?? null,
    MAX_PER_CREATOR
  );
  const scored = capped.slice(0, SCORE_POOL_SIZE);

  if (scored.length === 0) {
    return trendingFallback(source, candidates, 'no-overlap',
      `Nothing cached yet shares tags with these, instead here's top-rated ${source}.`);
  }

  const reranked = mmrRerank(scored, (c) => vectorOf(c.item), Math.min(RESULT_COUNT, scored.length));

  const items = reranked.map(({ item, score }) => {
    const itemVec = vectorOf(item);
    let bestMatch = null;
    let bestMatchVec = null;
    let bestSim = -Infinity;
    profileItems.forEach((profileItem, i) => {
      const sim = cosineSimilarity(profileVectors[i], itemVec);
      if (sim > bestSim) {
        bestSim = sim;
        bestMatch = profileItem;
        bestMatchVec = profileVectors[i];
      }
    });
    const because = bestMatch
      ? sharedKeys(bestMatchVec, itemVec).map((key) => labelFor(item, key) ?? labelFor(bestMatch, key))
      : [];

    return {
      item,
      score,
      because,
      matchedItem: bestMatch ? { id: bestMatch.id, title: bestMatch.title } : null,
    };
  });

  return { source, fallback: null, message: null, items };
}

function trendingFallback(source, candidates, fallback, message) {
  return {
    source,
    fallback,
    message,
    items: capPerFranchise(
      candidates.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
      (item) => item.title,
      MAX_PER_FRANCHISE
    )
      .slice(0, RESULT_COUNT)
      .map((item) => ({ item, score: null, because: [], matchedItem: null })),
  };
}

function labelFor(item, key) {
  const tag = item.tags.find((t) => tagKey(t) === key);
  return tag ? tag.tag ?? tag.value : null;
}

function dedupeById(items) {
  const map = new Map();
  for (const item of items) map.set(item.id, item);
  return [...map.values()];
}
