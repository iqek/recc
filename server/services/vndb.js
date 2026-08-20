import { createQueue, fetchJsonWithRetry } from '../lib/httpQueue.js';

// VNDB (Kana API). No key needed. Not content-filtered - includes adult titles, see README.
const BASE_URL = 'https://api.vndb.org/kana/vn';
const FIELDS = 'title,image.url,released,rating,tags.name,tags.category,developers.name,description';
const queue = createQueue(350);

function stripBbcode(text) {
  return text ? text.replace(/\[\/?[a-z]+(=[^\]]*)?\]/gi, '').trim() : null;
}

function normalize(vn) {
  // drop VNDB's own sexual-content tags rather than score on them
  const contentTags = (vn.tags ?? []).filter((t) => t.category !== 'ero');
  const developers = (vn.developers ?? []).map((d) => d.name);

  return {
    source: 'visual_novel',
    externalId: vn.id,
    title: vn.title,
    imageUrl: vn.image?.url ?? null,
    description: stripBbcode(vn.description),
    creator: developers.join(', ') || null,
    year: vn.released ? Number(vn.released.slice(0, 4)) || null : null,
    rating: vn.rating ? vn.rating / 10 : null,
    url: `https://vndb.org/${vn.id}`,
    raw: vn,
    tags: [
      // "cont" is VNDB's closest thing to genre - map it to 'genre' so cross-media matches work
      ...contentTags.slice(0, 10).map((t) => ({ value: t.name, type: t.category === 'cont' ? 'genre' : 'theme' })),
      ...developers.map((d) => ({ value: d, type: 'creator' })),
    ],
  };
}

async function post(body) {
  return queue.enqueue(() =>
    fetchJsonWithRetry(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

export async function searchVisualNovels(query, limit = 15) {
  const data = await post({ filters: ['search', '=', query], results: limit, fields: FIELDS });
  return (data.results ?? []).map(normalize);
}

export async function trendingVisualNovels(limit = 15) {
  // No trending endpoint - well-rated-with-many-votes is our stand-in for "popular now".
  const data = await post({
    filters: ['rating', '>=', 70],
    sort: 'votecount',
    reverse: true,
    results: limit,
    fields: FIELDS,
  });
  return (data.results ?? []).map(normalize);
}
