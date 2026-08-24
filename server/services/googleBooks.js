import { createQueue, fetchJsonWithRetry } from '../lib/httpQueue.js';
import { config } from '../config.js';

// Google Books. Works without a key at ~1k req/day per IP. No trending endpoint, so we fake one.
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const queue = createQueue(150);
const TRENDING_SUBJECTS = ['subject:fiction', 'subject:fantasy', 'subject:mystery'];

// no "is textbook" field exists, so this is a heuristic, not a guarantee
const TEXTBOOK_PATTERN = /\b(textbooks?|workbook|study guide|solutions? manual|student edition|lecture notes?|instructor'?s? (guide|manual))\b/i;
const TEXTBOOK_CATEGORIES = new Set(['study aids', 'education']);

function isLikelyTextbook(info) {
  if (TEXTBOOK_PATTERN.test(`${info.title ?? ''} ${info.subtitle ?? ''}`)) return true;
  return (info.categories ?? []).some((c) => TEXTBOOK_CATEGORIES.has(c.toLowerCase()));
}

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
    popularity: info.ratingsCount ?? null,
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

export async function searchBooks(query, limit = 15, page = 1) {
  const startIndex = (page - 1) * limit;
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=${limit}&startIndex=${startIndex}${keyParam()}`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.items ?? []).filter((v) => !isLikelyTextbook(v.volumeInfo ?? {})).map(normalize);
}

export async function trendingBooks(limit = 15) {
  const subject = TRENDING_SUBJECTS[Math.floor(Math.random() * TRENDING_SUBJECTS.length)];
  const url = `${BASE_URL}?q=${encodeURIComponent(subject)}&orderBy=newest&maxResults=${limit}${keyParam()}`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return (data.items ?? []).filter((v) => !isLikelyTextbook(v.volumeInfo ?? {})).map(normalize);
}
