/** routes: [{ pattern: '#/lists/:id', view: (root, params) => {} }, ...] */
export function createRouter(routes, root, navSelector) {
  const compiled = routes.map(({ pattern, view }) => ({
    regex: new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$'),
    keys: [...pattern.matchAll(/:([^/]+)/g)].map((m) => m[1]),
    view,
  }));

  function match(hash) {
    for (const route of compiled) {
      const m = hash.match(route.regex);
      if (!m) continue;
      const params = {};
      route.keys.forEach((key, i) => (params[key] = decodeURIComponent(m[i + 1])));
      return { view: route.view, params };
    }
    return null;
  }

  // lets a view detect it was navigated away from before its first render
  let renderId = 0;

  async function renderRoute() {
    const hash = location.hash || '#/';
    const found = match(hash) ?? { view: compiled[0].view, params: {} };
    const id = ++renderId;
    const isCurrent = () => id === renderId;

    document.body.classList.toggle('auth-screen', hash === '#/login');

    const prefix = (h) => h.split('/').slice(0, 2).join('/');
    document.querySelectorAll(`${navSelector} a`).forEach((link) => {
      link.classList.toggle('active', prefix(hash) === prefix(link.getAttribute('href')));
    });

    root.innerHTML = '';
    await found.view(root, found.params, isCurrent);
  }

  window.addEventListener('hashchange', renderRoute);
  return { start: renderRoute };
}
