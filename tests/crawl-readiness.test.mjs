import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sitemapEntries} from '../lib/sitemap.mjs';
import robots from '../app/robots.ts';

test('sitemap includes the confirmed founder, deduplicates routes and excludes search', () => {
  const updates = {sharedStructuredDataUpdated: '2026-10-09', pages: {'/careers': '2026-10-12', '/about': '2026-10-01'}};
  const data = sitemapEntries(['/', '/', '/about', '/careers', '/search', '/about/team/jeff-wu'], 'https://example.test', updates);
  assert.deepEqual(data, [
    {url: 'https://example.test/', lastModified: '2026-10-09'},
    {url: 'https://example.test/about', lastModified: '2026-10-09'},
    {url: 'https://example.test/careers', lastModified: '2026-10-12'},
    {url: 'https://example.test/about/team/jeff-wu', lastModified: '2026-10-09'},
  ]);
});

test('review robots has no bot-specific allow override and the public llms file does not enable crawling', () => {
  const previous = process.env.SITE_INDEXABLE;
  try {
    for (const value of [undefined, 'false', 'TRUE']) {
      if (value === undefined) delete process.env.SITE_INDEXABLE;
      else process.env.SITE_INDEXABLE = value;
      assert.deepEqual(robots().rules, {userAgent: '*', disallow: '/'});
    }
  } finally {
    if (previous === undefined) delete process.env.SITE_INDEXABLE;
    else process.env.SITE_INDEXABLE = previous;
  }
  for (const path of ['app/llms.txt/route.ts', 'public/robots.txt', 'app/robots.txt']) {
    assert.equal(fs.existsSync(new URL('../' + path, import.meta.url)), false, path);
  }
});
