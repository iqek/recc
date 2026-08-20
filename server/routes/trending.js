import { Router } from 'express';
import { assertValidSource } from '../services/sources.js';
import { ensureTrendingCached } from '../services/trendingCache.js';
import { getListIdsForItem, toApiItem } from '../repo.js';

export const trendingRouter = Router();

trendingRouter.get('/:source', async (req, res, next) => {
  try {
    const { source } = req.params;
    assertValidSource(source);
    const rows = await ensureTrendingCached(source);
    const items = await Promise.all(
      rows.map(async (row) => toApiItem(row, { listIds: await getListIdsForItem(row.id) }))
    );
    res.json({ items });
  } catch (err) {
    next(err);
  }
});
