async function request(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // response wasn't JSON - keep the status line
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

const json = (body) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const api = {
  search: (source, q) => request(`/api/search/${source}?q=${encodeURIComponent(q)}`),
  trending: (source) => request(`/api/trending/${source}`),

  getFavorites: () => request('/api/favorites'),
  setFavorite: (itemId, isFavorite, userRating) =>
    request(`/api/favorites/${itemId}`, { method: 'PUT', ...json({ isFavorite, userRating }) }),

  getRecommendations: (source) =>
    request(`/api/recommendations${source ? `?source=${source}` : ''}`),

  getLists: () => request('/api/lists'),
  createList: (name) => request('/api/lists', { method: 'POST', ...json({ name }) }),
  renameList: (listId, name) => request(`/api/lists/${listId}`, { method: 'PATCH', ...json({ name }) }),
  deleteList: (listId) => request(`/api/lists/${listId}`, { method: 'DELETE' }),
  getList: (listId) => request(`/api/lists/${listId}`),
  addItemToList: (listId, itemId) =>
    request(`/api/lists/${listId}/items`, { method: 'POST', ...json({ itemId }) }),
  removeItemFromList: (listId, itemId) =>
    request(`/api/lists/${listId}/items/${itemId}`, { method: 'DELETE' }),
};
