import { createQueue, fetchJsonWithRetry } from '../lib/httpQueue.js';
import { config } from '../config.js';

// TMDB. Requires a free API key. Skips director (needs an extra call per movie), same as RAWG.
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';
const queue = createQueue(150);

let genreMapPromise = null;

function requireKey() {
  if (!config.tmdbApiKey) {
    throw new Error('TMDB_API_KEY is not set. Get a free key at https://www.themoviedb.org/settings/api and add it to .env');
  }
}

async function getGenreMap() {
  if (!genreMapPromise) {
    genreMapPromise = queue
      .enqueue(() => fetchJsonWithRetry(`${BASE_URL}/genre/movie/list?api_key=${config.tmdbApiKey}`))
      .then((data) => new Map((data.genres ?? []).map((g) => [g.id, g.name])));
  }
  return genreMapPromise;
}

async function normalize(movie) {
  const genreMap = await getGenreMap();
  const genreTags = (movie.genre_ids ?? [])
    .map((id) => genreMap.get(id))
    .filter(Boolean)
    .map((name) => ({ value: name, type: 'genre' }));

  return {
    source: 'movie',
    externalId: String(movie.id),
    title: movie.title,
    imageUrl: movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : null,
    description: movie.overview ?? null,
    creator: null,
    year: movie.release_date ? Number(movie.release_date.slice(0, 4)) || null : null,
    rating: movie.vote_average ?? null,
    popularity: movie.vote_count ?? null,
    url: `https://www.themoviedb.org/movie/${movie.id}`,
    raw: movie,
    tags: genreTags,
  };
}

export async function searchMovies(query, limit = 15, page = 1) {
  requireKey();
  const url = `${BASE_URL}/search/movie?api_key=${config.tmdbApiKey}&query=${encodeURIComponent(query)}&page=${page}`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return Promise.all((data.results ?? []).slice(0, limit).map(normalize));
}

export async function trendingMovies(limit = 15) {
  requireKey();
  const url = `${BASE_URL}/trending/movie/week?api_key=${config.tmdbApiKey}`;
  const data = await queue.enqueue(() => fetchJsonWithRetry(url));
  return Promise.all((data.results ?? []).slice(0, limit).map(normalize));
}
