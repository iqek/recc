import { test } from 'node:test';
import assert from 'node:assert/strict';
import { franchiseKey, capPerKey, capPerFranchise } from '../server/recommender/franchise.js';

test('franchiseKey groups a title and its sequel/subtitle variants together', () => {
  const key = franchiseKey('Steins;Gate');
  assert.equal(franchiseKey('Steins;Gate 0'), key);
  assert.equal(franchiseKey('Steins;Gate: Hiyoku Renri no Darling'), key);
});

test('franchiseKey drops stopwords before taking the first two words', () => {
  assert.equal(franchiseKey('The Legend of Zelda'), franchiseKey('Legend Zelda'));
});

test('capPerKey drops items past the max for a given key, keeping order', () => {
  const items = ['a', 'a', 'a', 'b'];
  assert.deepEqual(capPerKey(items, (x) => x, 2), ['a', 'a', 'b']);
});

test('capPerKey never drops items whose key is falsy (e.g. unknown creator)', () => {
  const items = [null, null, null];
  assert.deepEqual(capPerKey(items, (x) => x, 1), items);
});

test('capPerFranchise caps same-franchise spam while leaving unrelated titles alone', () => {
  const titles = [
    'Steins;Gate',
    'Steins;Gate 0',
    'Steins;Gate: Hiyoku Renri no Darling',
    'Muv-Luv',
  ];
  const result = capPerFranchise(titles, (t) => t, 2);
  assert.deepEqual(result, ['Steins;Gate', 'Steins;Gate 0', 'Muv-Luv']);
});
