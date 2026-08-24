import { api } from '../api.js';
import { escapeHtml, recommendationSection } from '../render.js';
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
      ${Object.entries(data)
        .map(([source, section]) => recommendationSection(source, section, lists))
        .join('')}
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
