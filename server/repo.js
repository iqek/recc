import { query } from './db.js';

// ---------- users / sessions ----------

export async function createUser(username, passwordHash) {
  const { rows } = await query(
    `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username`,
    [username, passwordHash]
  );
  return rows[0];
}

export async function getUserByUsername(username) {
  const { rows } = await query(`SELECT * FROM users WHERE username = $1`, [username]);
  return rows[0] ?? null;
}

export async function createSession(token, userId, days) {
  await query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
    [token, userId, days]
  );
}

export async function getSessionUser(token) {
  const { rows } = await query(
    `SELECT u.id, u.username FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > now()`,
    [token]
  );
  return rows[0] ?? null;
}

export async function deleteSession(token) {
  await query(`DELETE FROM sessions WHERE token = $1`, [token]);
}

// ---------- items / tags (shared catalog, not user-scoped) ----------

export async function upsertItem(item) {
  const { rows } = await query(
    `INSERT INTO items (source, external_id, title, image_url, description, creator, year, rating, popularity, url, raw_json, cached_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
     ON CONFLICT (source, external_id) DO UPDATE SET
       title = excluded.title,
       image_url = excluded.image_url,
       description = excluded.description,
       creator = excluded.creator,
       year = excluded.year,
       rating = excluded.rating,
       popularity = excluded.popularity,
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
      item.popularity ?? null,
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

/** Plain item + tags, scoped to one user's favorite/rating state. */
export async function getItemWithTags(userId, itemId) {
  const { rows } = await query(
    `SELECT i.*, u.is_favorite, u.user_rating, u.favorited_at
     FROM items i
     LEFT JOIN user_items u ON u.item_id = i.id AND u.user_id = $2
     WHERE i.id = $1`,
    [itemId, userId]
  );
  if (!rows[0]) return null;
  const [withTags] = await attachTags(rows);
  return withTags;
}

/** Shared catalog items - no user_items join, since these get cached across all users (see trendingCache.js). */
export async function getAllCachedItems(source) {
  const { rows } = await query(`SELECT * FROM items WHERE source = $1`, [source]);
  return attachTags(rows);
}

export async function getItemsByIds(ids) {
  if (ids.length === 0) return [];
  const { rows } = await query(`SELECT * FROM items WHERE id = ANY($1)`, [ids]);
  return attachTags(rows);
}

/** Favorite/rating state for a set of items, for one user - map itemId -> row. */
export async function getUserItemsForItems(userId, itemIds) {
  if (itemIds.length === 0) return new Map();
  const { rows } = await query(
    `SELECT * FROM user_items WHERE user_id = $1 AND item_id = ANY($2)`,
    [userId, itemIds]
  );
  return new Map(rows.map((r) => [r.item_id, r]));
}

// ---------- favorites / ratings (per item, per user, independent of lists) ----------

export async function getUserItem(userId, itemId) {
  const { rows } = await query(`SELECT * FROM user_items WHERE user_id = $1 AND item_id = $2`, [userId, itemId]);
  return rows[0] ?? null;
}

export async function setFavorite(userId, itemId, isFavorite, userRating) {
  await query(
    `INSERT INTO user_items (user_id, item_id, is_favorite, user_rating, favorited_at)
     VALUES ($1, $2, $3, $4, CASE WHEN $3 THEN now() ELSE NULL END)
     ON CONFLICT (user_id, item_id) DO UPDATE SET
       is_favorite = $3,
       user_rating = COALESCE($4, user_items.user_rating),
       favorited_at = CASE WHEN $3 THEN now() ELSE NULL END`,
    [userId, itemId, isFavorite, userRating ?? null]
  );
  return getUserItem(userId, itemId);
}

export async function getFavorites(userId) {
  const { rows } = await query(
    `SELECT i.*, u.is_favorite, u.user_rating, u.favorited_at
     FROM user_items u
     JOIN items i ON i.id = u.item_id
     WHERE u.user_id = $1 AND u.is_favorite = true
     ORDER BY u.favorited_at DESC`,
    [userId]
  );
  return attachTags(rows);
}

// ---------- lists (arbitrary, user-created, mixed-media) ----------

export async function getLists(userId) {
  const { rows } = await query(
    `SELECT l.id, l.name, l.created_at, COUNT(li.item_id)::int AS item_count
     FROM lists l
     LEFT JOIN list_items li ON li.list_id = l.id
     WHERE l.user_id = $1
     GROUP BY l.id
     ORDER BY l.created_at ASC`,
    [userId]
  );
  return rows;
}

export async function createList(userId, name) {
  const { rows } = await query(
    `INSERT INTO lists (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at`,
    [userId, name]
  );
  return rows[0];
}

/** Returns null if the list doesn't exist or isn't owned by this user. */
export async function getListById(userId, listId) {
  const { rows } = await query(`SELECT * FROM lists WHERE id = $1 AND user_id = $2`, [listId, userId]);
  return rows[0] ?? null;
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

export async function getListItems(userId, listId) {
  const { rows } = await query(
    `SELECT i.*, li.added_at, u.is_favorite, u.user_rating, u.favorited_at
     FROM list_items li
     JOIN items i ON i.id = li.item_id
     LEFT JOIN user_items u ON u.item_id = i.id AND u.user_id = $1
     WHERE li.list_id = $2
     ORDER BY li.added_at DESC`,
    [userId, listId]
  );
  return attachTags(rows);
}

// Favorited or listed anywhere - what recommendations should never suggest back (by id or franchise)
export async function getUserEngagedItems(userId) {
  const { rows } = await query(
    `SELECT DISTINCT i.id, i.title FROM items i WHERE i.id IN (
       SELECT item_id FROM user_items WHERE user_id = $1 AND is_favorite = true
       UNION
       SELECT li.item_id FROM list_items li JOIN lists l ON l.id = li.list_id WHERE l.user_id = $1
     )`,
    [userId]
  );
  return rows;
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

/** Which of this user's own lists contain this item - for the "add to list" picker. */
export async function getListIdsForItem(userId, itemId) {
  const { rows } = await query(
    `SELECT li.list_id FROM list_items li
     JOIN lists l ON l.id = li.list_id
     WHERE li.item_id = $1 AND l.user_id = $2`,
    [itemId, userId]
  );
  return rows.map((r) => r.list_id);
}

// ---------- API shaping ----------

// Shapes an item row for the API; extra.favorite overrides row's favorite fields for shared-catalog items
export function toApiItem(row, extra = {}) {
  const favorite = extra.favorite ?? row;
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
    isFavorite: !!favorite.is_favorite,
    userRating: favorite.user_rating ?? null,
    favoritedAt: favorite.favorited_at ?? null,
    listIds: extra.listIds ?? [],
  };
}
