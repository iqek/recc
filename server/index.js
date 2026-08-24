import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { initSchema, query } from './db.js';

import { searchRouter } from './routes/search.js';
import { listsRouter } from './routes/lists.js';
import { favoritesRouter } from './routes/favorites.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { trendingRouter } from './routes/trending.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.json());

// liveness: is the process itself still responding? no DB check - a DB blip shouldn't get the app container killed
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));

// readiness: can this pod actually serve requests right now? DB down -> pull it out of rotation, don't restart it
app.get('/readyz', async (req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

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

// Postgres isn't guaranteed to be ready the instant this container starts (e.g. it's also mid-restart) - retry instead of crashing
async function connectWithRetry(attempts = 10, delayMs = 2000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await initSchema();
    } catch (err) {
      if (i === attempts) throw err;
      console.warn(`[startup] database not ready yet (attempt ${i}/${attempts}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

await connectWithRetry();
app.listen(config.port, () => {
  console.log(`recc is running at http://localhost:${config.port}`);
});
