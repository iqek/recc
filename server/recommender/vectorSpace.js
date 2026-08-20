// Turns items into "bag of tags" vectors, TF-IDF style: common tags score low, rare tags score high.

// Sharing the same author/studio matters more than sharing a broad genre - multiplies on top of IDF.
const TYPE_WEIGHT = { genre: 1.0, theme: 1.3, creator: 1.6 };

export function tagKey(tag) {
  return `${tag.tagType ?? tag.type}:${tag.tag ?? tag.value}`.toLowerCase();
}

/** Document frequency + smoothed IDF over a corpus of items (each with a `.tags` array). */
export function buildIdf(corpus) {
  const df = new Map();
  for (const item of corpus) {
    const seen = new Set(item.tags.map(tagKey));
    for (const key of seen) df.set(key, (df.get(key) ?? 0) + 1);
  }
  const n = corpus.length;
  const idf = new Map();
  for (const [key, freq] of df) {
    idf.set(key, Math.log((n + 1) / (freq + 1)) + 1);
  }
  return idf;
}

/** Sparse vector for one item, as a Map<tagKey, weight>. */
export function vectorize(item, idf) {
  const vec = new Map();
  for (const tag of item.tags) {
    const key = tagKey(tag);
    const type = tag.tagType ?? tag.type;
    const weight = (idf.get(key) ?? 1) * (TYPE_WEIGHT[type] ?? 1);
    vec.set(key, weight);
  }
  return vec;
}
