import { api } from './api.js';

// Removes any handler we attached before, so views sharing #app don't stack stale listeners
export function bindItemActions(container, onAction) {
  if (container._reccActionHandler) {
    container.removeEventListener('click', container._reccActionHandler);
  }

  const handler = async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const itemId = Number(target.dataset.itemId);
    const action = target.dataset.action;

    try {
      if (action === 'favorite') {
        const { item } = await api.setFavorite(itemId, !target.classList.contains('is-fav'));
        onAction?.(item);
      } else if (action === 'rate') {
        const { item } = await api.setFavorite(itemId, true, Number(target.dataset.value));
        onAction?.(item);
      } else if (action === 'toggle-list') {
        const listId = Number(target.dataset.listId);
        const { listIds } = target.checked
          ? await api.addItemToList(listId, itemId)
          : await api.removeItemFromList(listId, itemId);
        onAction?.({ id: itemId, listIds });
      } else if (action === 'create-list-and-add') {
        const input = target.closest('.list-picker-new').querySelector('[data-new-list-input]');
        const name = input.value.trim();
        if (!name) return;
        const { list } = await api.createList(name);
        const { listIds } = await api.addItemToList(list.id, itemId);
        onAction?.({ id: itemId, listIds, newList: list });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  container._reccActionHandler = handler;
  container.addEventListener('click', handler);
}
