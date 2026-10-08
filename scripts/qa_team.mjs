import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:3002';
const label=process.env.QA_LABEL||'local';
const dir='qa/team-restore';
const site=JSON.parse(await fs.readFile('content/site.json','utf8'));
const people=site.team.filter(x=>x.id!=='TEAM-JEFF');
const retired=['jeff-wu','emma-whitmore','daniel-reed','maya-brooks','marcus-bennett'];
const result={origin,layouts:[],checks:[],accessibility:[],errors:[],nonReadRequests:[]};
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
const page=await context.newPage();
page.on('pageerror',e=>result.errors.push(e.message));
await context.route('**/*',async route=>{if(!['GET','HEAD'].includes(route.request().method())){result.nonReadRequests.push(route.request().url());await route.abort()}else await route.continue()});
async function ready(){await page.evaluate(async()=>Promise.all([...document.images].map(async img=>{img.loading='eager';try{await img.decode()}catch{}})))}
async function check(name,fn){await fn();result.checks.push(name);console.log('PASS',name)}
try{
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1100});
  for(const path of ['/','/about/team',...people.map(x=>'/about/team/'+x.slug)]){
   const r=await page.goto(origin+path,{waitUntil:'networkidle'});assert.equal(r.status(),200);await ready();
   const view=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,broken:[...document.images].filter(x=>!x.naturalWidth).map(x=>x.src)}));
   assert.equal(view.scrollWidth,width);assert.equal(view.h1,1);assert.equal(view.broken.length,0);result.layouts.push({path,...view});
   if(path==='/about/team')await page.locator('.team-grid').screenshot({path:`${dir}/${label}-team-${width}.png`,style:'.site-header,.motion-controls{visibility:hidden}'});
  }
 }
 await check('Five original members in the original order, with initials and no portraits or example labels',async()=>{
  await page.goto(origin+'/about/team');assert.deepEqual(await page.locator('.team-card h2').allTextContents(),people.map(x=>x.name));assert.deepEqual(await page.locator('.team-card .team-card-portrait>span').allTextContents(),people.map(x=>x.initials));assert.equal(await page.locator('.team-card img,.team-example-badge').count(),0);
  assert.deepEqual(await page.locator('.team-card .metadata').allTextContents(),people.map(x=>x.role));
 });
 await check('All five profile biographies and roles match the preserved original source',async()=>{
  for(const person of people){await page.goto(origin+'/about/team/'+person.slug);assert.equal(await page.locator('h1').innerText(),person.name);assert.equal(await page.locator('.profile-hero .lead').innerText(),person.role);assert.equal(await page.locator('.profile-hero img').count(),0);assert.ok(await page.evaluate(html=>{const div=document.createElement('div');div.innerHTML=html;const norm=x=>x.replace(/\s+/g,' ').trim();return norm(div.textContent)===norm(document.querySelector('.profile-body .prose').textContent)},person.html));assert.ok(!(await page.title()).match(/Fictional Example|Historical Record/))}
 });
 await check('Jeff and all four fictional profile routes have been removed',async()=>{
  for(const slug of retired){const r=await page.goto(origin+'/about/team/'+slug);assert.equal(r.status(),404)}
 });
 await check('Homepage, search and sitemap use the restored five-person team',async()=>{
  await page.goto(origin+'/');assert.deepEqual(await page.locator('.team-mini h3').allTextContents(),people.slice(0,3).map(x=>x.name));assert.equal(await page.locator('.team-mini img,.team-example-badge').count(),0);
  await page.goto(origin+'/search?q=Jennifer');assert.ok(await page.locator('main a[href="/about/team/jennifer-stanford"]').isVisible());assert.ok(!/historical team record/i.test(await page.locator('main').innerText()));
  const sitemap=await page.evaluate(async()=>await (await fetch('/sitemap.xml')).text());for(const person of people)assert.ok(sitemap.includes('/about/team/'+person.slug));for(const slug of retired)assert.ok(!sitemap.includes('/about/team/'+slug));
  for(const name of ['Jeff','Emma','Daniel','Maya','Marcus']){await page.goto(origin+'/search?q='+name);for(const slug of retired)assert.equal(await page.locator(`main a[href="/about/team/${slug}"]`).count(),0)}
 });
 for(const path of ['/about/team','/about/team/homer-wu','/about/team/jennifer-stanford']){
  await page.goto(origin+path,{waitUntil:'networkidle'});const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();result.accessibility.push({path,violations:a.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)}))});assert.equal(a.violations.length,0);
 }
 assert.equal(result.errors.length,0);assert.equal(result.nonReadRequests.length,0);result.summary={layouts:result.layouts.length,checks:result.checks.length,axePages:result.accessibility.length,errors:0,nonReadRequests:0};console.log(JSON.stringify(result.summary,null,2));
}finally{await fs.writeFile(`${dir}/${label}-report.json`,JSON.stringify(result,null,2));await browser.close()}
