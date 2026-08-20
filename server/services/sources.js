import { searchAnime, trendingAnime, searchManga, trendingManga } from './jikan.js';
import { searchGames, trendingGames } from './rawg.js';
import { searchBooks, trendingBooks } from './googleBooks.js';
import { searchMovies, trendingMovies } from './tmdb.js';
import { searchVisualNovels, trendingVisualNovels } from './vndb.js';

export const SOURCES = ['anime', 'manga', 'movie', 'game', 'book', 'visual_novel'];

export const sourceClients = {
  anime: { search: searchAnime, trending: trendingAnime },
  manga: { search: searchManga, trending: trendingManga },
  movie: { search: searchMovies, trending: trendingMovies },
  game: { search: searchGames, trending: trendingGames },
  book: { search: searchBooks, trending: trendingBooks },
  visual_novel: { search: searchVisualNovels, trending: trendingVisualNovels },
};

export function assertValidSource(source) {
  if (!SOURCES.includes(source)) {
    const err = new Error(`Unknown source "${source}". Expected one of: ${SOURCES.join(', ')}`);
    err.status = 400;
    throw err;
  }
}
