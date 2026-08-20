import { getFreshItems, upsertItem } from '../repo.js';
import { sourceClients } from './sources.js';

// Trending doesn't change minute to minute, so don't hit the live API every page visit.
const TTL_MS = 30 * 60 * 1000;
const MIN_FRESH = 10;
const FETCH_COUNT = 15;

export async function ensureTrendingCached(source) {
  const since = new Date(Date.now() - TTL_MS).toISOString();
  const fresh = await getFreshItems(source, FETCH_COUNT, since);
  if (fresh.length >= MIN_FRESH) return fresh;

  try {
    const results = await sourceClients[source].trending(FETCH_COUNT);
    for (const item of results) await upsertItem(item);
  } catch (err) {
    console.warn(`[trending] live fetch for ${source} failed:`, err.message);
    return fresh; // whatever was already cached, even if thin or stale
  }
  return getFreshItems(source, FETCH_COUNT, since);
}
