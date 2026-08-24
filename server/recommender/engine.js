import { getAllCachedItems, getFavorites } from '../repo.js';
import { ensureTrendingCached } from '../services/trendingCache.js';
import { buildIdf, vectorize, tagKey } from './vectorSpace.js';
import { cosineSimilarity, centroid, sharedKeys } from './similarity.js';
import { mmrRerank } from './mmr.js';
import { capPerFranchise } from './franchise.js';

const SCORE_POOL_SIZE = 30; // how many top-scored candidates go into MMR re-ranking
const RESULT_COUNT = 10;
const MAX_PER_FRANCHISE = 2; // how many entries of the same series can appear in one result list

// Drops the bottom slice of a pool by popularity (obscure/unofficial spam) - only when the pool is
// big enough that cutting it won't just gut it, and never against items with no popularity data at all
function filterByPopularity(items) {
  const known = items.filter((i) => i.popularity != null);
  if (known.length < 15) return items;
  const sorted = [...known].sort((a, b) => b.popularity - a.popularity);
  const cutoff = sorted[Math.floor(sorted.length * 0.5)].popularity;
  return items.filter((i) => i.popularity == null || i.popularity >= cutoff);
}

/**
 * Build a ranked, explained recommendation list for one media source.
 *
 * 1. Candidates = cached items, minus favorites (topped up via ensureTrendingCached).
 * 2. Cold start (no favorites): just return trending, no scoring.
 * 3. Build IDF tag vectors, a taste profile from favorites, score by cosine similarity.
 * 4. Re-rank with MMR so results aren't ten near-duplicates.
 * 5. Attach the best-matching favorite + shared tags to each pick, for the "because you liked X" UI.
 */
export async function getRecommendations(source) {
  const favorites = await getFavorites();
  const favoritedIds = new Set(favorites.map((f) => f.id));

  await ensureTrendingCached(source);
  const rawCandidates = (await getAllCachedItems(source)).filter((item) => !favoritedIds.has(item.id));
  const candidates = filterByPopularity(rawCandidates);

  if (favorites.length === 0) {
    return trendingFallback(source, candidates, 'trending',
      'Favorite a few things to get picks tailored to your taste. Showing what is trending for now.');
  }
  if (candidates.length === 0) {
    return { source, fallback: 'empty', message: `No ${source} items cached yet - search for a few first.`, items: [] };
  }

  const corpus = dedupeById([...candidates, ...favorites]);
  const idf = buildIdf(corpus);

  const favoriteVectors = favorites.map((f) => vectorize(f, idf));
  const favoriteWeights = favorites.map((f) => (f.user_rating ?? 4) / 5);
  const profile = centroid(favoriteVectors, favoriteWeights);

  const vectorCache = new Map();
  const vectorOf = (item) => {
    if (!vectorCache.has(item.id)) vectorCache.set(item.id, vectorize(item, idf));
    return vectorCache.get(item.id);
  };

  const rankedByScore = candidates
    .map((item) => ({ item, score: cosineSimilarity(profile, vectorOf(item)) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  // cap same-franchise spam before slicing, so a flood of one series' sequels doesn't crowd out everything else
  const scored = capPerFranchise(rankedByScore, (c) => c.item.title, MAX_PER_FRANCHISE).slice(0, SCORE_POOL_SIZE);

  if (scored.length === 0) {
    return trendingFallback(source, candidates, 'no-overlap',
      `Nothing cached yet shares tags with your favorites. Showing top-rated ${source} instead.`);
  }

  const reranked = mmrRerank(scored, (c) => vectorOf(c.item), Math.min(RESULT_COUNT, scored.length));

  const items = reranked.map(({ item, score }) => {
    const itemVec = vectorOf(item);
    let bestFavorite = null;
    let bestFavoriteVec = null;
    let bestSim = -Infinity;
    favorites.forEach((fav, i) => {
      const sim = cosineSimilarity(favoriteVectors[i], itemVec);
      if (sim > bestSim) {
        bestSim = sim;
        bestFavorite = fav;
        bestFavoriteVec = favoriteVectors[i];
      }
    });
    const because = bestFavorite
      ? sharedKeys(bestFavoriteVec, itemVec).map((key) => labelFor(item, key) ?? labelFor(bestFavorite, key))
      : [];

    return {
      item,
      score,
      because,
      matchedFavorite: bestFavorite ? { id: bestFavorite.id, title: bestFavorite.title } : null,
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
      .map((item) => ({ item, score: null, because: [], matchedFavorite: null })),
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
