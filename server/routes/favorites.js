import { Router } from 'express';
import {
  getFavorites,
  getItemWithTags,
  getUserItem,
  setFavorite,
  getListIdsForItem,
  toApiItem,
} from '../repo.js';

export const favoritesRouter = Router();

favoritesRouter.get('/', async (req, res, next) => {
  try {
    const favorites = await getFavorites();
    const items = await Promise.all(
      favorites.map(async (row) => toApiItem(row, { listIds: await getListIdsForItem(row.id) }))
    );
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.put('/:itemId', async (req, res, next) => {
  try {
    const itemId = Number(req.params.itemId);
    const item = await getItemWithTags(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const { isFavorite, userRating } = req.body;
    if (userRating !== undefined && userRating !== null) {
      const n = Number(userRating);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: 'userRating must be an integer 1-5.' });
      }
    }

    await setFavorite(itemId, Boolean(isFavorite), userRating ?? null);

    const [userItem, listIds] = await Promise.all([getUserItem(itemId), getListIdsForItem(itemId)]);
    res.json({ item: toApiItem({ ...item, ...userItem }, { listIds }) });
  } catch (err) {
    next(err);
  }
});
