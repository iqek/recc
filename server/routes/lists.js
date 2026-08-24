import { Router } from 'express';
import {
  getLists,
  createList,
  renameList,
  deleteList,
  getListById,
  getListItems,
  addItemToList,
  removeItemFromList,
  getItemWithTags,
  getListIdsForItem,
  toApiItem,
} from '../repo.js';
import { assertValidSource, SOURCES } from '../services/sources.js';
import { buildRecommendationsResponse } from './recommendations.js';

export const listsRouter = Router();

listsRouter.get('/', async (req, res, next) => {
  try {
    res.json({ lists: await getLists(req.user.id) });
  } catch (err) {
    next(err);
  }
});

listsRouter.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name ?? '').trim();
    if (!name) return res.status(400).json({ error: 'List name is required.' });
    const list = await createList(req.user.id, name);
    res.status(201).json({ list });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A list with that name already exists.' });
    next(err);
  }
});

listsRouter.patch('/:id', async (req, res, next) => {
  try {
    const name = String(req.body.name ?? '').trim();
    if (!name) return res.status(400).json({ error: 'List name is required.' });
    const owned = await getListById(req.user.id, Number(req.params.id));
    if (!owned) return res.status(404).json({ error: 'List not found.' });

    const list = await renameList(owned.id, name);
    res.json({ list });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A list with that name already exists.' });
    next(err);
  }
});

listsRouter.delete('/:id', async (req, res, next) => {
  try {
    const owned = await getListById(req.user.id, Number(req.params.id));
    if (!owned) return res.status(404).json({ error: 'List not found.' });

    await deleteList(owned.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

listsRouter.get('/:id', async (req, res, next) => {
  try {
    const list = await getListById(req.user.id, Number(req.params.id));
    if (!list) return res.status(404).json({ error: 'List not found.' });

    const rows = await getListItems(req.user.id, list.id);
    const items = await Promise.all(
      rows.map(async (row) => toApiItem(row, { listIds: await getListIdsForItem(req.user.id, row.id) }))
    );
    res.json({ list, items });
  } catch (err) {
    next(err);
  }
});

listsRouter.get('/:id/recommendations', async (req, res, next) => {
  try {
    const list = await getListById(req.user.id, Number(req.params.id));
    if (!list) return res.status(404).json({ error: 'List not found.' });

    const requested = req.query.source ? [String(req.query.source)] : SOURCES;
    requested.forEach(assertValidSource);

    const items = await getListItems(req.user.id, list.id);
    res.json(await buildRecommendationsResponse(req.user.id, items, requested));
  } catch (err) {
    next(err);
  }
});

listsRouter.post('/:id/items', async (req, res, next) => {
  try {
    const itemId = Number(req.body.itemId);
    const [list, item] = await Promise.all([
      getListById(req.user.id, Number(req.params.id)),
      getItemWithTags(req.user.id, itemId),
    ]);
    if (!list) return res.status(404).json({ error: 'List not found.' });
    if (!item) return res.status(404).json({ error: 'Item not found - search for it first.' });

    await addItemToList(list.id, itemId);
    res.status(201).json({ listIds: await getListIdsForItem(req.user.id, itemId) });
  } catch (err) {
    next(err);
  }
});

listsRouter.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    const itemId = Number(req.params.itemId);
    const list = await getListById(req.user.id, Number(req.params.id));
    if (!list) return res.status(404).json({ error: 'List not found.' });

    await removeItemFromList(list.id, itemId);
    res.json({ listIds: await getListIdsForItem(req.user.id, itemId) });
  } catch (err) {
    next(err);
  }
});
