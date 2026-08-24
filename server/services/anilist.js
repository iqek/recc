import { createQueue, fetchJsonWithRetry } from '../lib/httpQueue.js';

// AniList (GraphQL), used for both anime and manga. No key needed. Rate limit is currently 30 req/min.
const URL = 'https://graphql.anilist.co';
const queue = createQueue(2100);

// tags has no server-side sort/limit args, so we sort by rank ourselves after fetching
const MEDIA_FIELDS = `
  id
  title { romaji english }
  description
  coverImage { large }
  startDate { year }
  averageScore
  popularity
  siteUrl
  genres
  tags { name rank }
  studios(isMain: true) { nodes { name } }
`;

const SEARCH_QUERY = `
  query ($search: String, $type: MediaType, $perPage: Int, $page: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: $type, isAdult: false, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
    }
  }
`;

const TRENDING_QUERY = `
  query ($type: MediaType, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(type: $type, isAdult: false, sort: TRENDING_DESC) { ${MEDIA_FIELDS} }
    }
  }
`;

function stripHtml(text) {
  return text ? text.replace(/<[^>]+>/g, '').trim() : null;
}

function normalize(media, source) {
  const genreTags = (media.genres ?? []).map((g) => ({ value: g, type: 'genre' }));
  const themeTags = (media.tags ?? [])
    .slice()
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 10)
    .map((t) => ({ value: t.name, type: 'theme' }));
  const studios = (media.studios?.nodes ?? []).map((s) => s.name);

  return {
    source,
    externalId: String(media.id),
    title: media.title.english || media.title.romaji,
    imageUrl: media.coverImage?.large ?? null,
    description: stripHtml(media.description),
    creator: studios.join(', ') || null,
    year: media.startDate?.year ?? null,
    rating: media.averageScore ? media.averageScore / 10 : null,
    popularity: media.popularity ?? null,
    url: media.siteUrl ?? null,
    raw: media,
    tags: [...genreTags, ...themeTags, ...studios.map((s) => ({ value: s, type: 'creator' }))],
  };
}

async function post(query, variables) {
  const json = await queue.enqueue(() =>
    fetchJsonWithRetry(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  );
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'AniList query failed');
  return json.data.Page.media;
}

export async function searchAnime(query, limit = 15, page = 1) {
  const media = await post(SEARCH_QUERY, { search: query, type: 'ANIME', perPage: limit, page });
  return media.map((m) => normalize(m, 'anime'));
}

export async function trendingAnime(limit = 15) {
  const media = await post(TRENDING_QUERY, { type: 'ANIME', perPage: limit });
  return media.map((m) => normalize(m, 'anime'));
}

export async function searchManga(query, limit = 15, page = 1) {
  const media = await post(SEARCH_QUERY, { search: query, type: 'MANGA', perPage: limit, page });
  return media.map((m) => normalize(m, 'manga'));
}

export async function trendingManga(limit = 15) {
  const media = await post(TRENDING_QUERY, { type: 'MANGA', perPage: limit });
  return media.map((m) => normalize(m, 'manga'));
}
