import { createQueue, fetchJsonWithRetry } from '../lib/httpQueue.js';

// Jikan (unofficial MyAnimeList API), used for anime and manga. No key, but rate-limited and occasionally down.
const BASE_URL = 'https://api.jikan.moe/v4';
const queue = createQueue(400);

function normalize(entry, { source, creatorField, year }) {
  const genreTags = (entry.genres ?? []).map((g) => ({ value: g.name, type: 'genre' }));
  const themeTags = [...(entry.themes ?? []), ...(entry.demographics ?? [])].map((t) => ({
    value: t.name,
    type: 'theme',
  }));
  const creators = (entry[creatorField] ?? []).map((c) => c.name);

  return {
    source,
    externalId: String(entry.mal_id),
    title: entry.title,
    imageUrl: entry.images?.jpg?.large_image_url ?? entry.images?.jpg?.image_url ?? null,
    description: entry.synopsis ?? null,
    creator: creators.join(', ') || null,
    year,
    rating: entry.score ?? null,
    url: entry.url ?? null,
    raw: entry,
    tags: [...genreTags, ...themeTags, ...creators.map((c) => ({ value: c, type: 'creator' }))],
  };
}

export async function searchAnime(query, limit = 15) {
  const url = `${BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.data ?? []).map((a) =>
    normalize(a, { source: 'anime', creatorField: 'studios', year: a.year ?? a.aired?.prop?.from?.year ?? null })
  );
}

export async function trendingAnime(limit = 15) {
  const url = `${BASE_URL}/top/anime?limit=${limit}&filter=bypopularity`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.data ?? []).map((a) =>
    normalize(a, { source: 'anime', creatorField: 'studios', year: a.year ?? a.aired?.prop?.from?.year ?? null })
  );
}

export async function searchManga(query, limit = 15) {
  const url = `${BASE_URL}/manga?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.data ?? []).map((m) =>
    normalize(m, { source: 'manga', creatorField: 'authors', year: m.published?.prop?.from?.year ?? null })
  );
}

export async function trendingManga(limit = 15) {
  const url = `${BASE_URL}/top/manga?limit=${limit}&filter=bypopularity`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.data ?? []).map((m) =>
    normalize(m, { source: 'manga', creatorField: 'authors', year: m.published?.prop?.from?.year ?? null })
  );
}
