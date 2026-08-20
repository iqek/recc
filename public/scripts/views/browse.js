import { api } from '../api.js';
import { grid, escapeHtml, SOURCE_LABEL } from '../render.js';
import { bindItemActions } from '../actions.js';

const ALL_SOURCES = ['anime', 'manga', 'movie', 'game', 'book', 'visual_novel'];

export async function browseView(root, params, isCurrent) {
  const source = params.source;
  if (!ALL_SOURCES.includes(source)) {
    root.innerHTML = `<div class="empty-state">Unknown category.</div>`;
    return;
  }

  let query = '';
  let results = [];
  let message = 'Search to get started.';
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
    `;
    renderResults();
    root.querySelector('#search-btn').addEventListener('click', doSearch);
    root.querySelector('#search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }

  function renderResults() {
    root.querySelector('#results').innerHTML = results.length
      ? grid(results, { showListPicker: true, lists, showFavorite: true })
      : `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  async function doSearch() {
    query = root.querySelector('#search-input').value.trim();
    if (!query) return;
    message = 'Searching...';
    results = [];
    renderResults();
    try {
      const res = await api.search(source, query);
      results = res.items;
      message = 'No results.';
    } catch (err) {
      message = err.message;
    }
    renderResults();
  }

  function patchItem(patch) {
    if (patch.newList) lists = [...lists, patch.newList];
    results = results.map((i) => (i.id === patch.id ? { ...i, ...patch } : i));
    renderResults();
  }
}
