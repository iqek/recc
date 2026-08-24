import { api } from '../api.js';
import { grid, escapeHtml, SOURCE_LABEL } from '../render.js';
import { bindItemActions } from '../actions.js';

const SOURCES = ['anime', 'manga', 'movie', 'game', 'book', 'visual_novel'];

export async function favoritesView(root, params, isCurrent) {
  let filter = 'all';
  let items = [];
  let lists = [];

  try {
    [{ items }, { lists }] = await Promise.all([api.getFavorites(), api.getLists()]);
  } catch (err) {
    if (isCurrent()) root.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    return;
  }
  if (!isCurrent()) return;

  bindItemActions(root, patchItem);
  render();

  function render() {
    root.innerHTML = `
      <h2 class="page-title">Favorites</h2>
      <div class="tabs">
        <button data-filter="all" class="${filter === 'all' ? 'active' : ''}">All (${items.length})</button>
        ${SOURCES.map((s) => {
          const count = items.filter((i) => i.source === s).length;
          return `<button data-filter="${s}" class="${filter === s ? 'active' : ''}">${SOURCE_LABEL[s]} (${count})</button>`;
        }).join('')}
      </div>
      <div id="fav-content"></div>
    `;

    root.querySelectorAll('[data-filter]').forEach((btn) =>
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        render();
      })
    );

    renderContent();
  }

  function renderContent() {
    const shown = filter === 'all' ? items : items.filter((i) => i.source === filter);
    root.querySelector('#fav-content').innerHTML = grid(shown, {
      showListPicker: true,
      lists,
      showFavorite: true,
      showRating: true,
    });
  }

  function patchItem(patch) {
    if (patch.newList) lists = [...lists, patch.newList];
    if (patch.isFavorite === false) {
      items = items.filter((i) => i.id !== patch.id);
      render();
    } else {
      items = items.map((i) => (i.id === patch.id ? { ...i, ...patch } : i));
      renderContent();
    }
  }
}
