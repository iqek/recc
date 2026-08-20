/** Cosine similarity between two sparse vectors (Map<key, weight>). */
export function cosineSimilarity(a, b) {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [key, weight] of small) {
    const other = large.get(key);
    if (other) dot += weight * other;
  }
  if (dot === 0) return 0;
  return dot / (magnitude(a) * magnitude(b));
}

export function magnitude(vec) {
  let sumSquares = 0;
  for (const weight of vec.values()) sumSquares += weight * weight;
  return Math.sqrt(sumSquares) || 1;
}

/** Weighted centroid of several vectors: sum(weight_i * vec_i). */
export function centroid(vectors, weights) {
  const result = new Map();
  vectors.forEach((vec, i) => {
    const w = weights[i];
    for (const [key, value] of vec) {
      result.set(key, (result.get(key) ?? 0) + value * w);
    }
  });
  return result;
}

/** Shared keys between two vectors, sorted by combined weight - used to explain a match. */
export function sharedKeys(a, b, limit = 3) {
  const shared = [];
  for (const [key, weight] of a) {
    if (b.has(key)) shared.push([key, weight + b.get(key)]);
  }
  return shared.sort((x, y) => y[1] - x[1]).slice(0, limit).map(([key]) => key);
}
