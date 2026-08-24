import { upsertItem, getItemsByIds } from '../repo.js';
import { sourceClients } from './sources.js';

// In-memory on purpose: must only ever hold real trending() results, never search results
const TTL_MS = 30 * 60 * 1000;
const FETCH_COUNT = 15;
const cache = new Map();

export async function ensureTrendingCached(source) {
  const cached = cache.get(source);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.items;

  try {
    const results = await sourceClients[source].trending(FETCH_COUNT);
    const ids = [];
    for (const item of results) ids.push(await upsertItem(item));
    const items = await getItemsByIds(ids);
    cache.set(source, { items, fetchedAt: Date.now() });
    return items;
  } catch (err) {
    console.warn(`[trending] live fetch for ${source} failed:`, err.message);
    return cached?.items ?? [];
  }
}
