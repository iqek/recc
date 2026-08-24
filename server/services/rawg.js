import { createQueue, fetchJsonWithRetry } from '../lib/httpQueue.js';
import { config } from '../config.js';

// RAWG. Free tier: 20k req/month, key required.
const BASE_URL = 'https://api.rawg.io/api';
const queue = createQueue(150);

// RAWG's `tags` are crowd-sourced and often non-English; drop non-Latin ones
const isLatinText = (str) => /^[\x00-\x7F]*$/.test(str);

function normalize(game) {
  const genreTags = (game.genres ?? []).map((g) => ({ value: g.name, type: 'genre' }));
  const themeTags = (game.tags ?? [])
    .filter((t) => isLatinText(t.name))
    .slice(0, 10)
    .map((t) => ({ value: t.name, type: 'theme' }));

  return {
    source: 'game',
    externalId: String(game.id),
    title: game.name,
    imageUrl: game.background_image ?? null,
    description: null,
    creator: null,
    year: game.released ? Number(game.released.slice(0, 4)) : null,
    rating: game.rating ? game.rating * 2 : null,
    popularity: game.added ?? null,
    url: `https://rawg.io/games/${game.slug}`,
    raw: game,
    tags: [...genreTags, ...themeTags],
  };
}

function requireKey() {
  if (!config.rawgApiKey) {
    throw new Error('RAWG_API_KEY is not set. Get a free key at https://rawg.io/apidocs and add it to .env');
  }
}

export async function searchGames(query, limit = 15, page = 1) {
  requireKey();
  const url = `${BASE_URL}/games?key=${config.rawgApiKey}&search=${encodeURIComponent(query)}&page_size=${limit}&page=${page}`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.results ?? []).map(normalize);
}

export async function trendingGames(limit = 15) {
  requireKey();
  // no trending endpoint - "recently added to libraries" is our proxy
  const url = `${BASE_URL}/games?key=${config.rawgApiKey}&ordering=-added&page_size=${limit}`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.results ?? []).map(normalize);
}
