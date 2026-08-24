import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tagKey, buildIdf, vectorize } from '../server/recommender/vectorSpace.js';

test('tagKey normalizes both db-shape and raw-shape tags the same way', () => {
  assert.equal(tagKey({ tagType: 'genre', tag: 'Action' }), 'genre:action');
  assert.equal(tagKey({ type: 'genre', value: 'Action' }), 'genre:action');
});

test('buildIdf scores a common tag lower than a rare tag', () => {
  const corpus = [
    { tags: [{ type: 'genre', value: 'Action' }] },
    { tags: [{ type: 'genre', value: 'Action' }] },
    { tags: [{ type: 'genre', value: 'Action' }, { type: 'theme', value: 'Isekai' }] },
  ];
  const idf = buildIdf(corpus);
  assert.ok(idf.get('genre:action') < idf.get('theme:isekai'), 'common tag should score lower than rare tag');
});

test('vectorize weights creator tags higher than genre tags at equal rarity', () => {
  const corpus = [
    { tags: [{ type: 'genre', value: 'Action' }, { type: 'creator', value: 'Studio X' }] },
  ];
  const idf = buildIdf(corpus);
  const vec = vectorize(corpus[0], idf);
  assert.ok(vec.get('creator:studio x') > vec.get('genre:action'), 'creator should outweigh genre at the same rarity');
});
