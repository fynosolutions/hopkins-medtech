import {chromium} from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:3101';
const output = 'qa/issue-1';
fs.mkdirSync(output + '/after', {recursive: true});
const site = JSON.parse(fs.readFileSync('content/site.json', 'utf8'));
const browser = await chromium.launch();
const errors = [];
const results = [];
const paths = ['/', '/careers', '/resources', '/about/team', '/about/team/homer-wu', '/services/quality-system', '/services/laboratory-services', ...site.jobs.map(job => '/careers/' + job.slug)];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({viewport: {width, height: 1000}, reducedMotion: 'reduce'});
    page.on('pageerror', error => errors.push(error.message));
    for (const path of paths) {
      const response = await page.goto(origin + path, {waitUntil: 'networkidle'});
      assert.equal(response.status(), 200, path);
      const data = await page.evaluate(() => ({
        title: document.title,
        h1: [...document.querySelectorAll('h1')].map(node => node.textContent.trim()),
        description: document.querySelector('meta[name="description"]')?.content,
        robots: document.querySelector('meta[name="robots"]')?.content,
        schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(node => JSON.parse(node.textContent)),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        missingAlt: [...document.images].filter(img => !img.hasAttribute('alt')).map(img => img.src),
        footer: document.querySelector('footer').innerText,
      }));
      assert.equal(data.h1.length, 1, path);
      assert.match(data.robots, /noindex/, path);
      assert.equal(data.overflow, false, `${width}: ${path}`);
      assert.deepEqual(data.missingAlt, [], path);
      assert.match(data.footer, /Hopkins MedTech Group LLC/);
      assert.equal(data.schemas.filter(x => x['@type'] === 'Organization').length, 1);
      if (path === '/' && width === 1440) {
        const topEdges = await page.locator('.home-service-grid .service-card').evaluateAll(cards => cards.map(card => Math.round(card.getBoundingClientRect().top)));
        assert.equal(new Set(topEdges).size, 1, 'The four desktop service cards should share a row');
      }
      if (path.startsWith('/careers')) {
        assert.equal(data.title, data.h1[0] + ' | Hopkins MedTech');
        assert.match(data.description, /educational partner/i);
        assert.match(data.description, /New York office/);
        assert.ok(!data.schemas.some(x => x['@type'] === 'JobPosting'));
        if (path !== '/careers') assert.equal(await page.locator('.job-document > section').count(), 15);
      }
      if (path === '/careers') assert.equal(await page.locator('.fact-table tbody tr').count(), 6);
      if (path === '/resources') {
        assert.equal(await page.locator('#company-updates li').count(), 7);
        assert.equal(await page.locator('#documented-partnerships article').count(), 2);
        assert.equal(await page.locator('#public-record li').count(), 8);
      }
      results.push({path, width, ...data});
      if (paths.indexOf(path) <= 7) {
        const name = path === '/' ? 'home' : path.slice(1).replaceAll('/', '-');
        await page.screenshot({path: `${output}/after/${name}-${width}.png`, fullPage: true});
      }
    }
    await page.close();
  }
  const page = await browser.newPage({javaScriptEnabled: false});
  for (const path of ['/careers', '/resources']) {
    await page.goto(origin + path);
    assert.ok((await page.locator('main').innerText()).length > 1000);
    if (path === '/careers') assert.equal(await page.locator('.fact-table tbody tr').count(), 6);
    else assert.equal(await page.locator('#company-updates li').count(), 7);
  }
  const robots = await (await page.request.get(origin + '/robots.txt')).text();
  assert.match(robots, /Disallow: \/\s/);
  assert.ok(!robots.includes('Allow: /'));
  const sitemap = await (await page.request.get(origin + '/sitemap.xml')).text();
  assert.ok(!sitemap.includes('jeff-wu'));
  assert.equal((sitemap.match(/<lastmod>/g) || []).length, (sitemap.match(/<loc>/g) || []).length);
  assert.match(sitemap, /<lastmod>2026-10-09<\/lastmod>/);
  for (const path of ['/llms.txt', '/about/team/jeff-wu']) assert.equal((await page.request.get(origin + path)).status(), 404, path);
  await page.goto(origin + '/search?q=Jeff%20Wu');
  assert.equal(await page.locator('a[href="/about/team/jeff-wu"]').count(), 0);
  assert.deepEqual(errors, []);
  fs.writeFileSync(output + '/browser-report.json', JSON.stringify({origin, passed: true, errors, noJavaScriptChecked: true, robots, sitemapUrls: (sitemap.match(/<loc>/g) || []).length, pages: results}, null, 2));
  console.log(JSON.stringify({passed: true, viewports: results.length, errors, sitemapUrls: (sitemap.match(/<loc>/g) || []).length}));
} finally {
  await browser.close();
}
