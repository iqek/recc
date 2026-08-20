export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

export const SOURCE_LABEL = {
  anime: 'Anime',
  manga: 'Manga',
  movie: 'Movie',
  game: 'Game',
  book: 'Book',
  visual_novel: 'Visual Novel',
};

function ratingStars(itemId, userRating) {
  const stars = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<button type="button" data-action="rate" data-item-id="${itemId}" data-value="${n}"
          class="${n <= (userRating ?? 0) ? 'filled' : ''}" title="${n} star${n > 1 ? 's' : ''}">&#9733;</button>`
    )
    .join('');
  return `<div class="stars">${stars}</div>`;
}

function tagList(tags, limit = 6) {
  return `<div class="tag-list">${tags
    .slice(0, limit)
    .map((t) => `<span class="tag ${t.type}">${escapeHtml(t.value)}</span>`)
    .join('')}</div>`;
}

function listPicker(item, lists) {
  const memberIds = new Set(item.listIds ?? []);
  const options = lists.length
    ? lists
        .map(
          (l) => `
      <label>
        <input type="checkbox" data-action="toggle-list" data-item-id="${item.id}" data-list-id="${l.id}"
          ${memberIds.has(l.id) ? 'checked' : ''}>
        ${escapeHtml(l.name)}
      </label>`
        )
        .join('')
    : '<span class="subtle">No lists yet.</span>';

  return `
    <details class="list-picker">
      <summary>Lists (${memberIds.size})</summary>
      <div class="list-picker-menu">
        ${options}
        <div class="list-picker-new">
          <input type="text" placeholder="New list" data-new-list-input data-item-id="${item.id}" />
          <button type="button" class="btn" data-action="create-list-and-add" data-item-id="${item.id}">+</button>
        </div>
      </div>
    </details>
  `;
}

/**
 * @param {object} item - API item shape
 * @param {object} opts
 * @param {boolean} opts.showListPicker - show the "add to list(s)" control (needs opts.lists)
 * @param {object[]} opts.lists - all lists, for the picker
 * @param {boolean} opts.showFavorite - show favorite toggle star button
 * @param {boolean} opts.showRating - show 1-5 rating stars
 * @param {object|null} opts.recommendation - { score, because, becauseOf, fallback }
 */
export function itemCard(item, opts = {}) {
  const media = item.imageUrl
    ? `<div class="card-media" style="background-image:url('${escapeHtml(item.imageUrl)}')"></div>`
    : `<div class="card-media">${escapeHtml(item.title)}</div>`;

  const meta = [item.year, item.creator, item.rating ? `${item.rating.toFixed(1)}/10` : null]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' &middot; ');

  const actions = [];
  if (opts.showListPicker) actions.push(listPicker(item, opts.lists ?? []));
  if (opts.showFavorite) {
    actions.push(
      `<button class="btn btn-fav ${item.isFavorite ? 'is-fav' : ''}" data-action="favorite" data-item-id="${item.id}">
        ${item.isFavorite ? '&#9829; Favorited' : '&#9825; Favorite'}
      </button>`
    );
  }
  let ratingBlock = '';
  if (opts.showRating && item.isFavorite) {
    ratingBlock = ratingStars(item.id, item.userRating);
  }

  let explanationBlock = '';
  if (opts.recommendation) {
    const { score, because, becauseOf, fallback } = opts.recommendation;
    if (fallback) {
      explanationBlock = `<div class="explanation">Trending pick - no personalized match yet.</div>`;
    } else {
      const pct = Math.max(0, Math.min(100, Math.round((score ?? 0) * 100)));
      const becauseText = becauseOf
        ? `Because you liked <strong>${escapeHtml(becauseOf.title)}</strong>${
            because?.length ? ` &mdash; shares ${because.map(escapeHtml).join(', ')}` : ''
          }`
        : 'Matches your favorites profile';
      explanationBlock = `
        <div class="match-meter"><div class="match-meter-fill" style="width:${pct}%"></div></div>
        <div class="explanation">${becauseText} (${pct}% match)</div>
      `;
    }
  }

  return `
    <div class="card" data-item-id="${item.id}">
      ${media}
      <div class="card-body">
        <span class="badge ${item.source}">${SOURCE_LABEL[item.source] ?? item.source}</span>
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        ${meta ? `<div class="card-meta">${meta}</div>` : ''}
        ${tagList(item.tags ?? [])}
        ${ratingBlock}
        <div class="card-actions">${actions.join('')}</div>
        ${explanationBlock}
      </div>
    </div>
  `;
}

export function grid(items, opts) {
  if (!items.length) {
    return `<div class="empty-state">Nothing here yet.</div>`;
  }
  return `<div class="grid">${items.map((item) => itemCard(item, opts)).join('')}</div>`;
}
