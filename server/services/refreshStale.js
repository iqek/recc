import { upsertItem } from '../repo.js';
import { sourceClients } from './sources.js';

const STALE_MS = 14 * 24 * 60 * 60 * 1000;

// Fire-and-forget: re-searches a stale item's own title and re-caches it if the same external_id
// still turns up. Not awaited by callers - refreshing shouldn't slow down the response it's on.
export function refreshIfStale(item) {
  if (Date.now() - new Date(item.cached_at).getTime() < STALE_MS) return;

  sourceClients[item.source]
    .search(item.title, 5)
    .then((results) => {
      const match = results.find((r) => r.externalId === item.external_id);
      if (match) return upsertItem(match);
    })
    .catch((err) => console.warn(`[refresh] failed to refresh item ${item.id}:`, err.message));
}
