async function request(path, options) {
  const res = await fetch(path, options);
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    if (location.hash !== '#/login') location.hash = '#/login';
    throw new Error('Not logged in.');
  }
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
  getMe: () => request('/api/auth/me'),
  login: (username, password) => request('/api/auth/login', { method: 'POST', ...json({ username, password }) }),
  register: (username, password) => request('/api/auth/register', { method: 'POST', ...json({ username, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  search: (source, q, page = 1) => request(`/api/search/${source}?q=${encodeURIComponent(q)}&page=${page}`),
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
  getListRecommendations: (listId) => request(`/api/lists/${listId}/recommendations`),
  addItemToList: (listId, itemId) =>
    request(`/api/lists/${listId}/items`, { method: 'POST', ...json({ itemId }) }),
  removeItemFromList: (listId, itemId) =>
    request(`/api/lists/${listId}/items/${itemId}`, { method: 'DELETE' }),
};
