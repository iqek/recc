// Groups sequel/spinoff titles under one franchise key so they don't flood recommendations
const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'to', 'no', 'x', 'and', 'vs', 'edition']);

export function franchiseKey(title) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return words.slice(0, 2).join(' ');
}

/** Keeps items in order, dropping any past `max` occurrences of the same key */
export function capPerKey(items, keyOf, max) {
  const seen = new Map();
  return items.filter((item) => {
    const key = keyOf(item);
    const count = seen.get(key) ?? 0;
    if (key && count >= max) return false;
    seen.set(key, count + 1);
    return true;
  });
}

export function capPerFranchise(items, keyOf, max = 2) {
  return capPerKey(items, (item) => franchiseKey(keyOf(item)), max);
}
