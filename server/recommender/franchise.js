// Groups titles like "Steins;Gate", "Steins;Gate 0", "Steins;Gate: Hiyoku Renri no Darling" under
// one franchise key (their first couple of distinctive words) so recommendations don't get flooded
// by one series' spinoffs and sequels at the expense of everything else.
const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'to', 'no', 'x', 'and', 'vs', 'edition']);

export function franchiseKey(title) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return words.slice(0, 2).join(' ');
}

/** Keeps items in their existing order, dropping any past `maxPerFranchise` for the same key. */
export function capPerFranchise(items, keyOf, maxPerFranchise = 2) {
  const seen = new Map();
  return items.filter((item) => {
    const key = franchiseKey(keyOf(item));
    const count = seen.get(key) ?? 0;
    if (key && count >= maxPerFranchise) return false;
    seen.set(key, count + 1);
    return true;
  });
}
