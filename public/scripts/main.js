import { createRouter } from './router.js';
import { homeView } from './views/home.js';
import { browseView } from './views/browse.js';
import { listsIndexView, listDetailView } from './views/lists.js';
import { favoritesView } from './views/favorites.js';
import { recommendationsView } from './views/recommendations.js';

const routes = [
  { pattern: '#/', view: homeView },
  { pattern: '#/browse/:source', view: browseView },
  { pattern: '#/lists', view: listsIndexView },
  { pattern: '#/lists/:id', view: listDetailView },
  { pattern: '#/favorites', view: favoritesView },
  { pattern: '#/recommendations', view: recommendationsView },
];

const router = createRouter(routes, document.getElementById('app'), '#main-nav');
router.start();
