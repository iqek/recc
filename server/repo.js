import { query } from './db.js';

// ---------- items / tags ----------

export async function upsertItem(item) {
  const { rows } = await query(
    `INSERT INTO items (source, external_id, title, image_url, description, creator, year, rating, url, raw_json, cached_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
     ON CONFLICT (source, external_id) DO UPDATE SET
       title = excluded.title,
       image_url = excluded.image_url,
       description = excluded.description,
       creator = excluded.creator,
       year = excluded.year,
       rating = excluded.rating,
       url = excluded.url,
       raw_json = excluded.raw_json,
       cached_at = now()
     RETURNING id`,
    [
      item.source,
      item.externalId,
      item.title,
      item.imageUrl ?? null,
      item.description ?? null,
      item.creator ?? null,
      item.year ?? null,
      item.rating ?? null,
      item.url ?? null,
      item.raw ? JSON.stringify(item.raw) : null,
    ]
  );
  const itemId = rows[0].id;

  await query(`DELETE FROM item_tags WHERE item_id = $1`, [itemId]);
  const tags = item.tags ?? [];
  if (tags.length) {
    const values = tags.map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(', ');
    const params = [itemId, ...tags.flatMap((t) => [t.value, t.type])];
    await query(
      `INSERT INTO item_tags (item_id, tag, tag_type) VALUES ${values} ON CONFLICT DO NOTHING`,
      params
    );
  }
  return itemId;
}

async function attachTags(rows) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { rows: tagRows } = await query(
    `SELECT item_id, tag, tag_type AS "tagType" FROM item_tags WHERE item_id = ANY($1)`,
    [ids]
  );
  const byItem = new Map();
  for (const t of tagRows) {
    if (!byItem.has(t.item_id)) byItem.set(t.item_id, []);
    byItem.get(t.item_id).push({ tag: t.tag, tagType: t.tagType });
  }
  return rows.map((r) => ({ ...r, tags: byItem.get(r.id) ?? [] }));
}

export async function getItemWithTags(itemId) {
  const { rows } = await query(
    `SELECT i.*, u.is_favorite, u.user_rating, u.favorited_at
     FROM items i
     LEFT JOIN user_items u ON u.item_id = i.id
     WHERE i.id = $1`,
    [itemId]
  );
  if (!rows[0]) return null;
  const [withTags] = await attachTags(rows);
  return withTags;
}

export async function getAllCachedItems(source) {
  const { rows } = await query(`SELECT * FROM items WHERE source = $1`, [source]);
  return attachTags(rows);
}

/** Items of a source cached more recently than sinceIso, newest first. */
export async function getFreshItems(source, limit, sinceIso) {
  const { rows } = await query(
    `SELECT i.*, u.is_favorite, u.user_rating, u.favorited_at
     FROM items i
     LEFT JOIN user_items u ON u.item_id = i.id
     WHERE i.source = $1 AND i.cached_at > $2
     ORDER BY i.cached_at DESC
     LIMIT $3`,
    [source, sinceIso, limit]
  );
  return attachTags(rows);
}

// ---------- favorites / ratings (per item, independent of lists) ----------

export async function getUserItem(itemId) {
  const { rows } = await query(`SELECT * FROM user_items WHERE item_id = $1`, [itemId]);
  return rows[0] ?? null;
}

export async function setFavorite(itemId, isFavorite, userRating) {
  await query(
    `INSERT INTO user_items (item_id, is_favorite, user_rating, favorited_at)
     VALUES ($1, $2, $3, CASE WHEN $2 THEN now() ELSE NULL END)
     ON CONFLICT (item_id) DO UPDATE SET
       is_favorite = $2,
       user_rating = COALESCE($3, user_items.user_rating),
       favorited_at = CASE WHEN $2 THEN now() ELSE NULL END`,
    [itemId, isFavorite, userRating ?? null]
  );
  return getUserItem(itemId);
}

export async function getFavorites() {
  const { rows } = await query(
    `SELECT i.*, u.is_favorite, u.user_rating, u.favorited_at
     FROM user_items u
     JOIN items i ON i.id = u.item_id
     WHERE u.is_favorite = true
     ORDER BY u.favorited_at DESC`
  );
  return attachTags(rows);
}

// ---------- lists (arbitrary, user-created, mixed-media) ----------

export async function getLists() {
  const { rows } = await query(
    `SELECT l.id, l.name, l.created_at, COUNT(li.item_id)::int AS item_count
     FROM lists l
     LEFT JOIN list_items li ON li.list_id = l.id
     GROUP BY l.id
     ORDER BY l.created_at ASC`
  );
  return rows;
}

export async function createList(name) {
  const { rows } = await query(
    `INSERT INTO lists (name) VALUES ($1) RETURNING id, name, created_at`,
    [name]
  );
  return rows[0];
}

export async function renameList(listId, name) {
  const { rows } = await query(
    `UPDATE lists SET name = $2 WHERE id = $1 RETURNING id, name, created_at`,
    [listId, name]
  );
  return rows[0] ?? null;
}

export async function deleteList(listId) {
  await query(`DELETE FROM lists WHERE id = $1`, [listId]);
}

export async function getListById(listId) {
  const { rows } = await query(`SELECT * FROM lists WHERE id = $1`, [listId]);
  return rows[0] ?? null;
}

export async function getListItems(listId) {
  const { rows } = await query(
    `SELECT i.*, li.added_at, u.is_favorite, u.user_rating, u.favorited_at
     FROM list_items li
     JOIN items i ON i.id = li.item_id
     LEFT JOIN user_items u ON u.item_id = i.id
     WHERE li.list_id = $1
     ORDER BY li.added_at DESC`,
    [listId]
  );
  return attachTags(rows);
}

export async function addItemToList(listId, itemId) {
  await query(
    `INSERT INTO list_items (list_id, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [listId, itemId]
  );
}

export async function removeItemFromList(listId, itemId) {
  await query(`DELETE FROM list_items WHERE list_id = $1 AND item_id = $2`, [listId, itemId]);
}

export async function getListIdsForItem(itemId) {
  const { rows } = await query(`SELECT list_id FROM list_items WHERE item_id = $1`, [itemId]);
  return rows.map((r) => r.list_id);
}

// ---------- API shaping ----------

/** Shape any item row (plain, or joined with user_items/list_items) for the API. */
export function toApiItem(row, extra = {}) {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    imageUrl: row.image_url,
    description: row.description,
    creator: row.creator,
    year: row.year,
    rating: row.rating,
    url: row.url,
    tags: row.tags.map((t) => ({ value: t.tag, type: t.tagType })),
    isFavorite: !!row.is_favorite,
    userRating: row.user_rating ?? null,
    favoritedAt: row.favorited_at ?? null,
    listIds: extra.listIds ?? [],
  };
}
