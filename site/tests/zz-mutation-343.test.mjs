// Deliberately failing test for the #343 mutation run. Reverted before review.
import assert from 'node:assert/strict';
import test from 'node:test';

test('#343 mutation: a red suite must stop the image build', () => {
  assert.fail('deliberate failure: if a sha-* image is published for this commit, the gate does not work');
});
