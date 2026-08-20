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

export const listsRouter = Router();

listsRouter.get('/', async (req, res, next) => {
  try {
    res.json({ lists: await getLists() });
  } catch (err) {
    next(err);
  }
});

listsRouter.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name ?? '').trim();
    if (!name) return res.status(400).json({ error: 'List name is required.' });
    const list = await createList(name);
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
    const list = await renameList(Number(req.params.id), name);
    if (!list) return res.status(404).json({ error: 'List not found.' });
    res.json({ list });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A list with that name already exists.' });
    next(err);
  }
});

listsRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteList(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

listsRouter.get('/:id', async (req, res, next) => {
  try {
    const listId = Number(req.params.id);
    const list = await getListById(listId);
    if (!list) return res.status(404).json({ error: 'List not found.' });

    const rows = await getListItems(listId);
    const items = await Promise.all(
      rows.map(async (row) => toApiItem(row, { listIds: await getListIdsForItem(row.id) }))
    );
    res.json({ list, items });
  } catch (err) {
    next(err);
  }
});

listsRouter.post('/:id/items', async (req, res, next) => {
  try {
    const listId = Number(req.params.id);
    const itemId = Number(req.body.itemId);
    const [list, item] = await Promise.all([getListById(listId), getItemWithTags(itemId)]);
    if (!list) return res.status(404).json({ error: 'List not found.' });
    if (!item) return res.status(404).json({ error: 'Item not found - search for it first.' });

    await addItemToList(listId, itemId);
    res.status(201).json({ listIds: await getListIdsForItem(itemId) });
  } catch (err) {
    next(err);
  }
});

listsRouter.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    const listId = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    await removeItemFromList(listId, itemId);
    res.json({ listIds: await getListIdsForItem(itemId) });
  } catch (err) {
    next(err);
  }
});
