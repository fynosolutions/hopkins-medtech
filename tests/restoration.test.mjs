import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const site=read('content/site.json'),archive=read('content/archive.json'),protectedContent=read('qa/content-repair/protected-content.json');
test('the existing new articles, eight roles, six people and laboratory content remain unchanged',()=>{
 assert.deepEqual(read('content/research.json'),protectedContent.research);
 assert.deepEqual(read('content/insights.json'),protectedContent.insights);
 assert.deepEqual(site.jobs,protectedContent.jobs);assert.deepEqual(site.team,protectedContent.team);
 assert.deepEqual(site.pendingLinkedin,protectedContent.pendingLinkedin);
 assert.deepEqual(site.services.find(x=>x.slug==='laboratory-services'),protectedContent.laboratoryService);
 for(const name of ['motion.tsx','carousels.tsx'])assert.equal(fs.readFileSync(new URL('../components/'+name,import.meta.url),'utf8'),fs.readFileSync(new URL('../qa/content-repair/before/components/'+name,import.meta.url),'utf8'));
});
test('every original image has a readable archive entry and an unchanged downloadable original',()=>{
 const baseline=read('qa/content-audit/coverage.json').images,additional=read('qa/content-audit/extra-coverage.json').assets.filter(x=>x.width);
 const expected=new Set([...baseline,...additional].map(x=>x.sha256));
 assert.equal(expected.size,76);assert.equal(archive.images.length,76);
 assert.deepEqual(new Set(archive.images.map(x=>x.sha256)),expected);
 for(const image of archive.images){const bytes=fs.readFileSync(new URL('../public'+image.original,import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),image.sha256);assert.ok(fs.existsSync(new URL('../public'+image.src,import.meta.url)));}
});
test('all discovered source records are published, with test and historical statements identified',()=>{
 assert.equal(archive.records.length,138);assert.equal(new Set(archive.records.map(x=>x.route)).size,138);
 const before=read('qa/content-repair/before/content-manifest.json').filter(x=>x.id.startsWith('HMC-'));
 const discovered=read('qa/content-audit/extra-resources.json').extraArticles;
 for(const source of [...before,...discovered])assert.ok(archive.records.some(x=>x.sourceUrl===source.sourceUrl),source.sourceUrl);
 assert.match(archive.records.find(x=>x.id==='news-1').html,/more than 50 customers/);
 assert.equal(archive.records.find(x=>x.id==='news-47').category,'Test record');
 assert.match(archive.records.find(x=>x.id==='news-47').html,/12313/);
});
test('industry links and historical article sequences have real destinations',()=>{
 for(const industry of site.industries)for(const section of industry.sections){assert.ok(!section.html.includes('submissions.aspx?'));if(section.title==='Preclinical Research')assert.match(section.html,/href="\/services\/preclinical-research"/);}
 assert.equal(site.historical.reduce((n,x)=>n+x.adjacent.length,0),10);
 const routes=new Set(site.historical.map(x=>x.route));
 for(const resource of site.historical){assert.ok(resource.originalThumbnail);for(const link of resource.adjacent)assert.ok(routes.has(link.href));}
});
