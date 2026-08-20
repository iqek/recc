import { api } from '../api.js';
import { escapeHtml, itemCard, SOURCE_LABEL } from '../render.js';
import { bindItemActions } from '../actions.js';

export async function recommendationsView(root, params, isCurrent) {
  root.innerHTML = `<div class="empty-state">Building recommendations...</div>`;

  let data;
  let lists = [];
  try {
    [data, { lists }] = await Promise.all([api.getRecommendations(), api.getLists()]);
  } catch (err) {
    if (isCurrent()) root.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    return;
  }
  if (!isCurrent()) return;

  bindItemActions(root, patchItem);
  render();

  function render() {
    root.innerHTML = `
      <h2 class="page-title">Recommendations</h2>
      <p class="subtle">
        Built from your Favorites list using tag/genre similarity (not machine learning) -
        see the README for how the scoring works.
      </p>
      ${Object.entries(data)
        .map(([source, section]) => sectionHtml(source, section))
        .join('')}
    `;
  }

  function sectionHtml(source, section) {
    const cards = section.items
      .map((item) =>
        itemCard(item, {
          showListPicker: true,
          lists,
          showFavorite: true,
          recommendation: {
            score: item.score,
            because: item.because,
            becauseOf: item.becauseOf,
            fallback: section.fallback,
          },
        })
      )
      .join('');

    return `
      <h3 class="section-title">${SOURCE_LABEL[source]}</h3>
      ${section.fallback ? `<div class="trending-flag">${escapeHtml(section.fallback)}</div>` : ''}
      ${section.message ? `<div class="notice">${escapeHtml(section.message)}</div>` : ''}
      ${section.items.length ? `<div class="grid">${cards}</div>` : `<div class="empty-state">Nothing to recommend yet.</div>`}
    `;
  }

  function patchItem(patch) {
    if (patch.newList) lists = [...lists, patch.newList];
    for (const section of Object.values(data)) {
      section.items = section.items.map((i) => (i.id === patch.id ? { ...i, ...patch } : i));
    }
    render();
  }
}
