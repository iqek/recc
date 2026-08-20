import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { initSchema } from './db.js';

import { searchRouter } from './routes/search.js';
import { listsRouter } from './routes/lists.js';
import { favoritesRouter } from './routes/favorites.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { trendingRouter } from './routes/trending.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.json());

app.use('/api/search', searchRouter);
app.use('/api/lists', listsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/trending', trendingRouter);

app.use(express.static(publicDir));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});

await initSchema();
app.listen(config.port, () => {
  console.log(`recc is running at http://localhost:${config.port}`);
});
