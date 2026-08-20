import { cosineSimilarity } from './similarity.js';

// Maximal Marginal Relevance (Carbonell & Goldstein, 1998): balances relevance against redundancy with past picks.
// lambda near 1 = pure relevance, near 0 = prioritizes variety.
export function mmrRerank(scored, vectorOf, count, lambda = 0.75) {
  const pool = [...scored];
  const selected = [];

  while (pool.length && selected.length < count) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    pool.forEach((candidate, i) => {
      const redundancy = selected.length
        ? Math.max(...selected.map((s) => cosineSimilarity(vectorOf(candidate), vectorOf(s))))
        : 0;
      const mmrScore = lambda * candidate.score - (1 - lambda) * redundancy;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    });

    selected.push(pool[bestIndex]);
    pool.splice(bestIndex, 1);
  }

  return selected;
}
