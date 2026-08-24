import { api } from '../api.js';
import { grid, escapeHtml, recommendationSection } from '../render.js';
import { bindItemActions } from '../actions.js';

export async function listsIndexView(root, params, isCurrent) {
  let lists = [];
  try {
    lists = (await api.getLists()).lists;
  } catch (err) {
    if (isCurrent()) root.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    return;
  }
  if (!isCurrent()) return;

  render();

  function render() {
    root.innerHTML = `
      <h2 class="page-title">Lists</h2>
      <div class="panel">
        <div class="search-bar" style="margin-bottom:0">
          <input type="text" id="new-list-name" placeholder="New list name..." />
          <button class="btn btn-primary" id="create-list-btn">Create list</button>
        </div>
      </div>
      <div id="list-rows">
        ${
          lists.length
            ? lists.map((l) => listRow(l)).join('')
            : `<div class="empty-state">No lists yet - make one above.</div>`
        }
      </div>
    `;

    root.querySelector('#create-list-btn').addEventListener('click', createList);
    root.querySelector('#new-list-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') createList();
    });
    root.querySelectorAll('[data-rename]').forEach((btn) =>
      btn.addEventListener('click', () => renameList(Number(btn.dataset.rename)))
    );
    root.querySelectorAll('[data-delete]').forEach((btn) =>
      btn.addEventListener('click', () => removeList(Number(btn.dataset.delete)))
    );
  }

  function listRow(l) {
    return `
      <div class="list-row">
        <a href="#/lists/${l.id}">${escapeHtml(l.name)} <span class="subtle">(${l.item_count})</span></a>
        <div class="card-actions">
          <button class="btn" data-rename="${l.id}">Rename</button>
          <button class="btn btn-danger" data-delete="${l.id}">Delete</button>
        </div>
      </div>
    `;
  }

  async function createList() {
    const input = root.querySelector('#new-list-name');
    const name = input.value.trim();
    if (!name) return;
    try {
      const { list } = await api.createList(name);
      lists = [...lists, { ...list, item_count: 0 }];
      render();
    } catch (err) {
      alert(err.message);
    }
  }

  async function renameList(listId) {
    const current = lists.find((l) => l.id === listId);
    const name = window.prompt('Rename list', current?.name ?? '');
    if (!name || !name.trim()) return;
    try {
      await api.renameList(listId, name.trim());
      lists = lists.map((l) => (l.id === listId ? { ...l, name: name.trim() } : l));
      render();
    } catch (err) {
      alert(err.message);
    }
  }

  async function removeList(listId) {
    const current = lists.find((l) => l.id === listId);
    if (!window.confirm(`Delete "${current?.name}"? This only removes the list, not the items in it.`)) return;
    try {
      await api.deleteList(listId);
      lists = lists.filter((l) => l.id !== listId);
      render();
    } catch (err) {
      alert(err.message);
    }
  }
}

export async function listDetailView(root, params, isCurrent) {
  const listId = Number(params.id);
  let list;
  let items = [];
  let lists = [];
  let tab = 'items';
  let recs = null;
  let recsError = '';

  try {
    [{ list, items }, { lists }] = await Promise.all([api.getList(listId), api.getLists()]);
  } catch (err) {
    if (isCurrent()) root.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    return;
  }
  if (!isCurrent()) return;

  bindItemActions(root, patchItem);
  render();

  function render() {
    root.innerHTML = `
      <p class="subtle"><a href="#/lists">&larr; All lists</a></p>
      <h2 class="page-title">${escapeHtml(list.name)}</h2>
      <div class="tabs">
        <button data-tab="items" class="${tab === 'items' ? 'active' : ''}">Items (${items.length})</button>
        <button data-tab="recs" class="${tab === 'recs' ? 'active' : ''}">Recommendations</button>
      </div>
      <div id="tab-content"></div>
    `;
    root.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    renderTabContent();
  }

  function renderTabContent() {
    const content = root.querySelector('#tab-content');
    if (tab === 'items') {
      content.innerHTML = grid(items, { showListPicker: true, lists, showFavorite: true, showRating: true });
    } else if (recsError) {
      content.innerHTML = `<div class="empty-state">${escapeHtml(recsError)}</div>`;
    } else if (recs) {
      content.innerHTML = Object.entries(recs)
        .map(([source, section]) => recommendationSection(source, section, lists))
        .join('');
    } else {
      content.innerHTML = `<div class="empty-state">Building recommendations...</div>`;
    }
  }

  async function switchTab(next) {
    tab = next;
    render();
    if (tab === 'recs' && !recs && !recsError) {
      try {
        recs = await api.getListRecommendations(listId);
      } catch (err) {
        recsError = err.message;
      }
      renderTabContent();
    }
  }

  function patchItem(patch) {
    if (patch.newList) lists = [...lists, patch.newList];
    if (patch.listIds && !patch.listIds.includes(listId)) {
      items = items.filter((i) => i.id !== patch.id);
    } else {
      items = items.map((i) => (i.id === patch.id ? { ...i, ...patch } : i));
    }
    if (recs) {
      for (const section of Object.values(recs)) {
        section.items = section.items.map((i) => (i.id === patch.id ? { ...i, ...patch } : i));
      }
    }
    renderTabContent();
  }
}
