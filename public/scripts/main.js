import { api } from './api.js';
import { createRouter } from './router.js';
import { authView } from './views/auth.js';
import { homeView } from './views/home.js';
import { browseView } from './views/browse.js';
import { listsIndexView, listDetailView } from './views/lists.js';
import { favoritesView } from './views/favorites.js';
import { recommendationsView } from './views/recommendations.js';

const routes = [
  { pattern: '#/login', view: authView },
  { pattern: '#/', view: homeView },
  { pattern: '#/browse/:source', view: browseView },
  { pattern: '#/lists', view: listsIndexView },
  { pattern: '#/lists/:id', view: listDetailView },
  { pattern: '#/favorites', view: favoritesView },
  { pattern: '#/recommendations', view: recommendationsView },
];

const router = createRouter(routes, document.getElementById('app'), '#main-nav');

const { user } = await api.getMe().catch(() => ({ user: null }));
if (user) {
  document.getElementById('username-label').textContent = user.username;
  if (location.hash === '#/login') location.hash = '#/';
} else if (location.hash !== '#/login') {
  location.hash = '#/login';
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout().catch(() => {});
  location.hash = '#/login';
  location.reload();
});

router.start();
