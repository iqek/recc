import { api } from '../api.js';
import { grid, escapeHtml, SOURCE_LABEL } from '../render.js';
import { bindItemActions } from '../actions.js';

const SOURCES = ['anime', 'manga', 'movie', 'game', 'book', 'visual_novel'];

export async function homeView(root, params, isCurrent) {
  root.innerHTML = `<div class="empty-state">Loading...</div>`;

  let favoritesCount = 0;
  let lists = [];
  const trending = Object.fromEntries(SOURCES.map((s) => [s, []]));

  try {
    const [favRes, listsRes] = await Promise.all([api.getFavorites(), api.getLists()]);
    favoritesCount = favRes.items.length;
    lists = listsRes.lists;
  } catch {
    // non-fatal - panel below just won't know favorite/list counts yet
  }

  await Promise.all(
    SOURCES.map(async (source) => {
      try {
        trending[source] = (await api.trending(source)).items.slice(0, 6);
      } catch (err) {
        trending[source] = { error: err.message };
      }
    })
  );

  if (!isCurrent()) return; // user navigated away while trending fetches were still in flight

  bindItemActions(root, patchItem);
  render();

  function render() {
    root.innerHTML = `
      <div class="panel">
        <h1 style="font-size:20px;margin:0 0 10px;">welcome to recc.</h1>
        <div class="source-pills">
          ${SOURCES.map((s) => `<a href="#/browse/${s}">${SOURCE_LABEL[s]}</a>`).join('')}
        </div>
        ${
          favoritesCount === 0
            ? `<div class="notice">You haven't favorited anything yet, so <a href="#/recommendations">Recommendations</a> is showing trending picks. Favorite a few things to personalize it.</div>`
            : `<p class="subtle">You have ${favoritesCount} favorite${favoritesCount === 1 ? '' : 's'} across ${lists.length} list${lists.length === 1 ? '' : 's'}. Check your <a href="#/recommendations">Recommendations</a>.</p>`
        }
      </div>
      ${SOURCES.map((source) => trendingSection(source)).join('')}
    `;
  }

  function trendingSection(source) {
    const data = trending[source];
    return `
      <h2 class="section-title">Trending: ${SOURCE_LABEL[source]}</h2>
      ${
        Array.isArray(data)
          ? grid(data, { showListPicker: true, lists, showFavorite: true })
          : `<div class="empty-state">${escapeHtml(data.error)}</div>`
      }
    `;
  }

  function patchItem(patch) {
    if (patch.newList) lists = [...lists, patch.newList];
    for (const source of Object.keys(trending)) {
      if (Array.isArray(trending[source])) {
        trending[source] = trending[source].map((i) => (i.id === patch.id ? { ...i, ...patch } : i));
      }
    }
    render();
  }
}
