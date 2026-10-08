import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const origin=process.env.QA_ORIGIN||'http://127.0.0.1:3002';
const label=process.env.QA_LABEL||'local';
const examples=JSON.parse(await fs.readFile('content/team-examples.json','utf8'));
const names=['Jeff Wu','Homer Wu, Ph.D.',...examples.map(x=>x.name)];
const slugs=['jeff-wu','homer-wu',...examples.map(x=>x.slug)];
const historical=['jennifer-stanford','wendy-zhou','andrew-wayland','qian-cheng'];
const result={origin,layouts:[],checks:[],accessibility:[],errors:[],portraits:[]};
if(process.env.QA_RESUME==='1'){const prior=JSON.parse(await fs.readFile(`qa/team-update/${label}-report.json`,'utf8'));assert.equal(prior.origin,origin);Object.assign(result,prior)}
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
const page=await context.newPage();
page.on('pageerror',error=>result.errors.push(error.message));
async function ready(){await page.evaluate(async()=>Promise.all([...document.images].map(async img=>{img.loading='eager';try{await img.decode()}catch{}})))}
async function check(name,fn){if(result.checks.includes(name))return;await fn();result.checks.push(name);console.log('PASS',name)}
try{
 if(!result.layouts.length)for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1100});
  for(const route of ['/','/about/team',...slugs.map(x=>'/about/team/'+x)]){
   const response=await page.goto(origin+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);await ready();
   const data=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,brokenImages:[...document.images].filter(x=>!x.naturalWidth).map(x=>x.currentSrc)}));
   assert.equal(data.scrollWidth,width);assert.equal(data.h1,1);assert.equal(data.brokenImages.length,0);result.layouts.push({route,...data});
   if(route==='/about/team')await page.locator('.team-grid').screenshot({path:`qa/team-update/${label}-team-${width}.png`,style:'.site-header,.motion-controls{visibility:hidden}'});
  }
 }
 await check('Six correct team cards, six photographs, and exactly four fictional badges',async()=>{
  await page.goto(origin+'/about/team');await ready();assert.deepEqual(await page.locator('.team-card h2').allTextContents(),names);
  assert.equal(await page.locator('.team-card .has-team-photo img').count(),6);assert.equal(await page.locator('.team-card .team-example-badge').count(),4);
  for(const slug of slugs){const card=page.locator(`[data-profile="${slug}"]`);const img=card.locator('img');assert.ok(await img.isVisible());assert.match(await img.getAttribute('src'),new RegExp(slug));result.portraits.push({slug,alt:await img.getAttribute('alt'),src:await img.getAttribute('src')});}
  for(const slug of ['jeff-wu','homer-wu'])assert.equal(await page.locator(`[data-profile="${slug}"] .team-example-badge`).count(),0);
 });
 await check('Fictional profile pages identify the portrait and biography as examples',async()=>{
  for(const person of examples){await page.goto(origin+'/about/team/'+person.slug);assert.match(await page.title(),/Fictional Example/);assert.match(await page.locator('.profile-body').innerText(),/do not describe an HMC employee/);assert.match(await page.locator('.profile-body h2').innerText(),/Example responsibilities/);assert.equal(await page.getByRole('link',{name:'View on LinkedIn'}).count(),0)}
 });
 await check('Jeff photo notice is updated and his unconfirmed title remains unfilled',async()=>{
  await page.goto(origin+'/about/team/jeff-wu');assert.match(await page.locator('.profile-body').innerText(),/photograph was supplied/);assert.equal(await page.locator('.profile-hero .lead').count(),0);assert.ok(await page.getByRole('link',{name:'View on LinkedIn'}).isVisible());
 });
 await check('Four original biographies remain accessible as historical records',async()=>{
  for(const slug of historical){const response=await page.goto(origin+'/about/team/'+slug);assert.equal(response.status(),200);assert.match(await page.title(),/Historical Record/);assert.match(await page.locator('.profile-body .note').innerText(),/historical record/);assert.ok((await page.locator('.profile-body .prose').innerText()).length>20)}
  await page.goto(origin+'/archive/records/hmc-38');for(const name of ['Jennifer Stanford','Wendy Zhou','Andrew Wayland','Qian Cheng'])assert.match(await page.locator('main').innerText(),new RegExp(name));
 });
 await check('Homepage preview and search distinguish fictional and historical people',async()=>{
  await page.goto(origin+'/');assert.equal(await page.locator('.team-mini img').count(),3);assert.equal(await page.locator('.team-mini .team-example-badge').count(),1);
  await page.goto(origin+'/search?q=Emma');assert.match(await page.locator('main').innerText(),/fictional example/);
  await page.goto(origin+'/search?q=Jennifer');assert.match(await page.locator('main').innerText(),/Historical team record/i);
 });
 await check('Published Jeff and Homer files are byte-identical to the supplied photographs',async()=>{
  await page.goto(origin+'/about/team');
  for(const slug of ['jeff-wu','homer-wu']){const file='/media/team/'+slug+'-supplied.png';const response=await page.evaluate(async path=>{const r=await fetch(path);return {status:r.status,bytes:Array.from(new Uint8Array(await r.arrayBuffer()))}},file);assert.equal(response.status,200);const bytes=Buffer.from(response.bytes);const local=await fs.readFile('public'+file);assert.deepEqual(bytes,local);result.portraits.find(x=>x.slug===slug).sha256=crypto.createHash('sha256').update(bytes).digest('hex')}
 });
 for(const route of ['/about/team','/about/team/jeff-wu','/about/team/emma-whitmore']){
  if(result.accessibility.some(x=>x.route===route&&!x.violations.length))continue;
  await page.goto(origin+route,{waitUntil:'networkidle'});await ready();const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();result.accessibility.push({route,violations:report.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)}))});assert.equal(report.violations.length,0);
 }
 assert.equal(result.errors.length,0);
 result.summary={layouts:result.layouts.length,checks:result.checks.length,portraits:result.portraits.length,axePages:result.accessibility.length,errors:result.errors.length};console.log(JSON.stringify(result.summary,null,2));
}finally{await fs.writeFile(`qa/team-update/${label}-report.json`,JSON.stringify(result,null,2));await browser.close()}
