import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cosineSimilarity, centroid, sharedKeys } from '../server/recommender/similarity.js';

test('cosineSimilarity is 1 for identical vectors', () => {
  const a = new Map([['x', 2], ['y', 3]]);
  assert.ok(Math.abs(cosineSimilarity(a, a) - 1) < 1e-9);
});

test('cosineSimilarity is 0 for vectors with no shared keys', () => {
  const a = new Map([['x', 1]]);
  const b = new Map([['y', 1]]);
  assert.equal(cosineSimilarity(a, b), 0);
});

test('centroid is the weighted average of the input vectors', () => {
  const vectors = [new Map([['x', 2]]), new Map([['x', 4]])];
  const result = centroid(vectors, [1, 1]);
  assert.equal(result.get('x'), 6);
});

test('sharedKeys returns only common keys, sorted by combined weight, capped at the limit', () => {
  const a = new Map([['strong', 5], ['weak', 1], ['onlyA', 9]]);
  const b = new Map([['strong', 5], ['weak', 1], ['onlyB', 9]]);
  assert.deepEqual(sharedKeys(a, b, 1), ['strong']);
  assert.deepEqual(sharedKeys(a, b, 5), ['strong', 'weak']);
});
