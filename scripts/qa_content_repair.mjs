import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:3002',label=process.env.QA_LABEL||'local';
const dir='qa/content-repair';const archive=JSON.parse(await fs.readFile('content/archive.json','utf8'));const legacy=JSON.parse(await fs.readFile('content/legacy-ui.json','utf8'));
const result={origin,layouts:[],checks:[],accessibility:[],errors:[],images:[],interactiveImages:[]};
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
async function check(name,fn){try{await fn();result.checks.push({name,passed:true});console.log('PASS',name)}catch(e){result.checks.push({name,passed:false,error:e.message});console.log('FAIL',name,e.message)}}
async function loadImages(){await page.evaluate(async()=>Promise.all([...document.images].map(async i=>{i.loading='eager';try{await i.decode()}catch{}})))}
try{
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  for(const route of ['/','/services','/services/projects',...legacy.disciplines.map(x=>x.route),'/resources','/archive','/archive/media','/archive/records/hmc-03','/archive/records/news-1','/archive/records/news-47']){
   await page.goto(origin+route,{waitUntil:'networkidle'});await loadImages();
   result.layouts.push({route,width,...await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,brokenImages:[...document.images].filter(x=>!x.naturalWidth).map(x=>x.getAttribute('src'))}))});
   if(['/','/archive/media','/services/projects','/resources'].includes(route))await page.screenshot({path:`${dir}/${label}-${route==='/'?'home':route.slice(1).replaceAll('/','-')}-${width}.png`});
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await check('All four original brand images can be reached with controls',async()=>{
  await page.goto(origin);const track=page.locator('.brand-image-track');await track.scrollIntoViewIfNeeded();await loadImages();assert.equal(await track.locator('figure').count(),4);
  for(let i=0;i<4;i++){await page.getByRole('button',{name:`Show brand image ${i+1}`,exact:true}).click();await page.waitForTimeout(120);const left=await track.evaluate(x=>x.scrollLeft),width=await track.evaluate(x=>x.clientWidth);assert.ok(Math.abs(left-i*width)<3);assert.equal(await page.getByRole('button',{name:`Show brand image ${i+1}`,exact:true}).getAttribute('aria-pressed'),'true')}
  await page.screenshot({path:`${dir}/${label}-restored-brand-images.png`});
 });
 await check('Original filters work alongside the unchanged new resource library',async()=>{
  await page.goto(origin+'/resources');assert.equal(await page.locator('.resource-card').count(),9);assert.equal(await page.locator('.original-resource-card').count(),6);
  await page.getByLabel('Original topic',{exact:true}).selectOption('CBD');assert.equal(await page.locator('.original-resource-card').count(),1);assert.equal(await page.locator('.resource-card').count(),9);
  await page.getByLabel('Original resource type',{exact:true}).selectOption('Case Studies');await page.getByText('No archived resources in this category.').waitFor();await page.getByRole('button',{name:'Clear original filters'}).click();assert.equal(await page.locator('.original-resource-card').count(),6);
  await page.getByLabel('Original resource type',{exact:true}).selectOption('Blogs');assert.equal(await page.locator('.original-resource-card').count(),5);
  await page.getByRole('button',{name:'Company Insights',exact:true}).click();assert.equal(await page.locator('.resource-card').count(),7);assert.equal(await page.locator('.original-resource-card').count(),5);
 });
 await check('Old filtered URLs initialize the original topic selection',async()=>{
  await page.goto(origin+'/News.aspx?ClassID=102&leixing=CBD');await page.waitForFunction(()=>document.querySelector('.legacy-filters select')?.value==='CBD');assert.equal(await page.locator('.original-resource-card').count(),1);assert.ok(page.url().endsWith('#original-resources'));
 });
 await check('Original article previous and next navigation works',async()=>{
  await page.goto(origin+'/resources/historical-intended-use-validation');assert.equal(await page.locator('.original-article-nav a').count(),2);await page.locator('.original-article-nav a').filter({hasText:'Next'}).click();await page.waitForURL('**/resources/historical-cbd-otc');
 });
 await check('Both repaired preclinical links open the correct service',async()=>{
  for(const slug of ['biopharma','pharmaceuticals']){await page.goto(origin+'/industries/'+slug);const dd=page.locator('details').filter({has:page.locator('summary',{hasText:'Preclinical Research'})});if(!await dd.evaluate(e=>e.open))await dd.locator('summary').click();assert.equal(await dd.locator('a').getAttribute('href'),'/services/preclinical-research');await dd.locator('a').click();await page.waitForURL('**/services/preclinical-research')}
 });
 await check('All 76 unique original images load and are visible in the published collection',async()=>{
  await page.goto(origin+'/archive/media');await loadImages();assert.equal(await page.locator('.archive-image-grid figure').count(),76);
  for(const item of archive.images){const im=page.locator(`#${item.id} img`);const info=await im.evaluate(e=>({src:e.getAttribute('src'),naturalWidth:e.naturalWidth,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));assert.ok(info.naturalWidth>0&&info.width>0&&info.height>0);assert.ok(await im.isVisible());result.images.push({id:item.id,...info})}
 });
 await check('Original test placeholders and dated customer counts remain in the archive',async()=>{
  await page.goto(origin+'/archive/records/news-47');assert.match(await page.locator('.archive-original').innerText(),/12313/);assert.match(await page.locator('.note').innerText(),/test placeholder/);
  await page.goto(origin+'/');assert.ok(!(await page.locator('main').innerText()).includes('12313'));
  await page.goto(origin+'/services/projects');assert.ok(!(await page.locator('main').innerText()).includes('more than 50 customers'));await page.getByRole('link',{name:'Read the historical project overview'}).click();await page.waitForURL('**/archive/records/news-1');assert.match(await page.locator('.archive-original').innerText(),/more than 50 customers/);
 });
 await check('Original navigation artwork is visible when each menu opens',async()=>{
  await page.goto(origin);
  for(const name of ['Services','Industries','About']){await page.getByRole('button',{name:`${name} submenu`,exact:true}).click();const img=page.locator('.nav-original-image');await img.evaluate(async e=>e.decode());assert.ok(await img.isVisible());assert.equal(await img.getAttribute('src'),legacy.photos.nav[name]);result.interactiveImages.push({src:await img.getAttribute('src'),route:'/',control:`${name} submenu`});await page.getByRole('button',{name:`${name} submenu`,exact:true}).click()}
 });
 await check('Original source text is searchable without replacing current search results',async()=>{
  await page.goto(origin+'/search?q=12313');await page.locator('.original-search-results summary').click();assert.ok(await page.locator('.original-search-results a[href="/archive/records/news-47"]').isVisible());
 });
 for(const route of ['/archive','/archive/media','/archive/records/hmc-03','/archive/records/news-1','/services/projects','/services/disciplines/clinical','/resources']){
  await page.goto(origin+route,{waitUntil:'networkidle'});await loadImages();const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();result.accessibility.push({route,violations:a.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>({target:n.target,message:n.failureSummary}))}))});
 }
 result.summary={layouts:result.layouts.length,layoutFailures:result.layouts.filter(x=>x.width<x.scrollWidth||x.h1!==1||x.brokenImages.length).length,checks:result.checks.length,passed:result.checks.filter(x=>x.passed).length,uniqueOriginalImagesVisible:result.images.length,axePages:result.accessibility.length,axeViolations:result.accessibility.reduce((n,x)=>n+x.violations.length,0),errors:result.errors.length};
}finally{await fs.writeFile(`${dir}/${label}-browser.json`,JSON.stringify(result,null,2));await browser.close()}
console.log(JSON.stringify(result.summary,null,2));
const bad=result.layouts.filter(x=>x.width<x.scrollWidth||x.h1!==1||x.brokenImages.length);if(bad.length)console.log(JSON.stringify(bad,null,2));
if(result.accessibility.some(x=>x.violations.length))console.log(JSON.stringify(result.accessibility.filter(x=>x.violations.length),null,2));
if(result.checks.some(x=>!x.passed)||bad.length||result.accessibility.some(x=>x.violations.length)||result.errors.length)process.exitCode=1;
