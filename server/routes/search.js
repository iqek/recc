import { Router } from 'express';
import { sourceClients, assertValidSource } from '../services/sources.js';
import { upsertItem, getItemWithTags, getListIdsForItem, toApiItem } from '../repo.js';

export const searchRouter = Router();

searchRouter.get('/:source', async (req, res, next) => {
  try {
    const { source } = req.params;
    assertValidSource(source);
    const q = String(req.query.q ?? '').trim();
    if (!q) return res.json({ items: [] });
    const page = Math.max(1, Number(req.query.page) || 1);

    const results = await sourceClients[source].search(q, 15, page);
    const items = await Promise.all(
      results.map(async (normalized) => {
        const id = await upsertItem(normalized);
        const [item, listIds] = await Promise.all([
          getItemWithTags(req.user.id, id),
          getListIdsForItem(req.user.id, id),
        ]);
        return toApiItem(item, { listIds });
      })
    );
    res.json({ items });
  } catch (err) {
    next(err);
  }
});
