import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3000,
  rawgApiKey: process.env.RAWG_API_KEY || '',
  googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY || '',
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || 'postgres://recc:recc@localhost:5432/recc',
};
