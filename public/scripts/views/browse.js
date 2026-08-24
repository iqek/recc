import { api } from '../api.js';
import { grid, escapeHtml, SOURCE_LABEL } from '../render.js';
import { bindItemActions } from '../actions.js';

const ALL_SOURCES = ['anime', 'manga', 'movie', 'game', 'book', 'visual_novel'];
const PAGE_SIZE = 15;

export async function browseView(root, params, isCurrent) {
  const source = params.source;
  if (!ALL_SOURCES.includes(source)) {
    root.innerHTML = `<div class="empty-state">Unknown category.</div>`;
    return;
  }

  let query = '';
  let results = [];
  let message = 'Search to get started.';
  let page = 1;
  let hasMore = false;
  let lists = [];

  try {
    lists = (await api.getLists()).lists;
  } catch {
    // non-fatal - the list picker just shows "no lists yet" until this loads
  }
  if (!isCurrent()) return;

  bindItemActions(root, patchItem);
  render();

  function render() {
    root.innerHTML = `
      <div class="source-pills">
        ${ALL_SOURCES.map(
          (s) => `<a href="#/browse/${s}" class="${s === source ? 'active' : ''}">${SOURCE_LABEL[s]}</a>`
        ).join('')}
      </div>
      <h2 class="page-title">${SOURCE_LABEL[source]}</h2>
      <div class="search-bar">
        <input type="text" id="search-input" placeholder="Search ${SOURCE_LABEL[source].toLowerCase()}..." value="${escapeHtml(query)}" />
        <button class="btn btn-primary" id="search-btn">Search</button>
      </div>
      <div id="results"></div>
      <div id="load-more-wrap" style="text-align:center;margin-top:16px;"></div>
    `;
    renderResults();
    root.querySelector('#search-btn').addEventListener('click', () => doSearch());
    root.querySelector('#search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }

  function renderResults() {
    root.querySelector('#results').innerHTML = results.length
      ? grid(results, { showListPicker: true, lists, showFavorite: true })
      : `<div class="empty-state">${escapeHtml(message)}</div>`;

    const wrap = root.querySelector('#load-more-wrap');
    wrap.innerHTML = hasMore ? `<button class="btn" id="load-more-btn">Load more</button>` : '';
    if (hasMore) wrap.querySelector('#load-more-btn').addEventListener('click', loadMore);
  }

  async function doSearch() {
    query = root.querySelector('#search-input').value.trim();
    if (!query) return;
    page = 1;
    message = 'Searching...';
    results = [];
    hasMore = false;
    renderResults();
    try {
      const res = await api.search(source, query, page);
      results = res.items;
      hasMore = res.items.length >= PAGE_SIZE;
      message = 'No results.';
    } catch (err) {
      message = err.message;
    }
    renderResults();
  }

  async function loadMore() {
    const btn = root.querySelector('#load-more-btn');
    if (btn) btn.disabled = true;
    try {
      const res = await api.search(source, query, page + 1);
      page += 1;
      const existingIds = new Set(results.map((i) => i.id));
      results = [...results, ...res.items.filter((i) => !existingIds.has(i.id))];
      hasMore = res.items.length >= PAGE_SIZE;
    } catch (err) {
      hasMore = false;
      alert(err.message);
    }
    renderResults();
  }

  function patchItem(patch) {
    if (patch.newList) lists = [...lists, patch.newList];
    results = results.map((i) => (i.id === patch.id ? { ...i, ...patch } : i));
    renderResults();
  }
}
