import test from 'node:test';
import assert from 'node:assert/strict';
import {explainTerms, normalizeBodyHeadings} from '../lib/readable-content.mjs';
test('term expansion preserves links and avoids duplicate definitions', () => {
  assert.equal(explainTerms('<p>good clinical practice (GCP), GCP</p>'), '<p>good clinical practice (GCP), GCP</p>');
  assert.equal(explainTerms('<a href="/FDA">FDA</a> and FDA'), '<a href="/FDA">US Food and Drug Administration (FDA)</a> and FDA');
});
test('embedded headings cannot introduce extra h1 or jump levels', () => {
  assert.equal(normalizeBodyHeadings('<h1>A</h1><h4>B</h4><h2>C</h2>'), '<h2>A</h2><h3>B</h3><h2>C</h2>');
});
