import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mmrRerank } from '../server/recommender/mmr.js';

// A: highest score. B: near-duplicate of A. C: lower score, completely different vector.
const A = { id: 'A', score: 1.0, vector: new Map([['x', 1]]) };
const B = { id: 'B', score: 0.9, vector: new Map([['x', 1]]) };
const C = { id: 'C', score: 0.5, vector: new Map([['y', 1]]) };
const vectorOf = (c) => c.vector;

test('lambda=1 (pure relevance) ignores redundancy and just ranks by score', () => {
  const result = mmrRerank([A, B, C], vectorOf, 2, 1);
  assert.deepEqual(result.map((r) => r.id), ['A', 'B']);
});

test('a lower lambda prefers a distinct item over a near-duplicate of what is already picked', () => {
  const result = mmrRerank([A, B, C], vectorOf, 2, 0.5);
  assert.deepEqual(result.map((r) => r.id), ['A', 'C']);
});

test('never returns more than the requested count or the pool size', () => {
  assert.equal(mmrRerank([A, B, C], vectorOf, 2).length, 2);
  assert.equal(mmrRerank([A], vectorOf, 5).length, 1);
});
