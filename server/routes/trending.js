import { Router } from 'express';
import { assertValidSource } from '../services/sources.js';
import { ensureTrendingCached } from '../services/trendingCache.js';
import { getListIdsForItem, getUserItemsForItems, toApiItem } from '../repo.js';

export const trendingRouter = Router();

trendingRouter.get('/:source', async (req, res, next) => {
  try {
    const { source } = req.params;
    assertValidSource(source);
    const rows = await ensureTrendingCached(source);
    const favorites = await getUserItemsForItems(req.user.id, rows.map((r) => r.id));
    const items = await Promise.all(
      rows.map(async (row) =>
        toApiItem(row, { favorite: favorites.get(row.id) ?? {}, listIds: await getListIdsForItem(req.user.id, row.id) })
      )
    );
    res.json({ items });
  } catch (err) {
    next(err);
  }
});
