import { Router } from 'express';
import {
  getFavorites,
  getItemWithTags,
  getUserItem,
  setFavorite,
  getListIdsForItem,
  toApiItem,
} from '../repo.js';
import { refreshIfStale } from '../services/refreshStale.js';

export const favoritesRouter = Router();

favoritesRouter.get('/', async (req, res, next) => {
  try {
    const favorites = await getFavorites(req.user.id);
    favorites.forEach(refreshIfStale);
    const items = await Promise.all(
      favorites.map(async (row) => toApiItem(row, { listIds: await getListIdsForItem(req.user.id, row.id) }))
    );
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.put('/:itemId', async (req, res, next) => {
  try {
    const itemId = Number(req.params.itemId);
    const item = await getItemWithTags(req.user.id, itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const { isFavorite, userRating } = req.body;
    if (userRating !== undefined && userRating !== null) {
      const n = Number(userRating);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: 'userRating must be an integer 1-5.' });
      }
    }

    await setFavorite(req.user.id, itemId, Boolean(isFavorite), userRating ?? null);

    const [userItem, listIds] = await Promise.all([
      getUserItem(req.user.id, itemId),
      getListIdsForItem(req.user.id, itemId),
    ]);
    res.json({ item: toApiItem(item, { favorite: userItem ?? {}, listIds }) });
  } catch (err) {
    next(err);
  }
});
