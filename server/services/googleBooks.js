import { createQueue, fetchJsonWithRetry } from '../lib/httpQueue.js';
import { config } from '../config.js';

// Google Books. Works without a key at ~1k req/day per IP. No trending endpoint, so we fake one.
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const queue = createQueue(150);
const TRENDING_SUBJECTS = ['subject:fiction', 'subject:fantasy', 'subject:mystery'];

function normalize(volume) {
  const info = volume.volumeInfo ?? {};
  const categoryTags = (info.categories ?? []).map((c) => ({ value: c, type: 'genre' }));
  const authors = info.authors ?? [];

  return {
    source: 'book',
    externalId: volume.id,
    title: info.title ?? 'Untitled',
    imageUrl: info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null,
    description: info.description ?? null,
    creator: authors.join(', ') || null,
    year: info.publishedDate ? Number(info.publishedDate.slice(0, 4)) || null : null,
    rating: info.averageRating ? info.averageRating * 2 : null,
    url: info.infoLink ?? null,
    raw: volume,
    tags: [
      ...categoryTags,
      ...authors.map((a) => ({ value: a, type: 'creator' })),
    ],
  };
}

function keyParam() {
  return config.googleBooksApiKey ? `&key=${config.googleBooksApiKey}` : '';
}

export async function searchBooks(query, limit = 15) {
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=${limit}${keyParam()}`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.items ?? []).map(normalize);
}

export async function trendingBooks(limit = 15) {
  const subject = TRENDING_SUBJECTS[Math.floor(Math.random() * TRENDING_SUBJECTS.length)];
  const url = `${BASE_URL}?q=${encodeURIComponent(subject)}&orderBy=newest&maxResults=${limit}${keyParam()}`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.items ?? []).map(normalize);
}
