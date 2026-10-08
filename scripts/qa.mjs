import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:3001';
await fs.mkdir('qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const result={origin,viewports:[],interactions:[],accessibility:[],errors:[]};
const context=await browser.newContext();
const page=await context.newPage();
page.on('pageerror',e=>result.errors.push(e.message));
const keyPages=['/','/careers','/resources','/about/team','/contact','/careers/clinical-data-biostatistics-intern','/services/quality-system'];
for(const width of [360,390,768,1024,1440,1920]){
 await page.setViewportSize({width,height:1000});
 for(const path of keyPages){
  const response=await page.goto(origin+path,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await Promise.all([...document.images].map(async img=>{img.loading='eager';try{await img.decode()}catch{}}))});
  const state=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,brokenImages:[...document.images].filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.getAttribute('src')),h1:document.querySelectorAll('h1').length,overflows:[...document.querySelectorAll('main *')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left< -2)&&!x.closest('[aria-hidden="true"]')}).slice(0,8).map(x=>x.className)}));
  result.viewports.push({width,path,status:response.status(),...state});
  if([390,1440].includes(width)&&['/','/careers','/resources','/about/team'].includes(path)){await page.screenshot({path:`qa/${path==='/'?'home':path.slice(1).replaceAll('/','-')}-${width}.png`,fullPage:true});await page.screenshot({path:`qa/${path==='/'?'home':path.slice(1).replaceAll('/','-')}-${width}-viewport.png`});}
 }
 console.log('Viewport checked',width);
}
await page.setViewportSize({width:1440,height:1000});
for(const path of ['/','/careers','/resources','/about/team','/contact']){
 await page.goto(origin+path,{waitUntil:'networkidle'});
 await page.waitForTimeout(2400);
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 result.accessibility.push({path,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})).slice(0,15)}))});
}
async function check(label,fn){try{await fn();result.interactions.push({label,passed:true})}catch(e){result.interactions.push({label,passed:false,error:e.message})}}
await check('Career track filters retain four roles per track',async()=>{await page.goto(origin+'/careers');await page.getByRole('button',{name:'AI & Digital Health',exact:true}).click();if(await page.locator('.job-row').count()!==4)throw Error('Wrong AI count');await page.getByRole('button',{name:'Healthcare & MedTech',exact:true}).click();if(await page.locator('.job-row').count()!==4)throw Error('Wrong healthcare count')});
await check('Resources search, empty state, reset, topic filter and load more',async()=>{await page.goto(origin+'/resources');await page.getByLabel('Search resources',{exact:true}).fill('nonsense-no-results');await page.getByText('No matching resources.').waitFor();await page.getByRole('button',{name:'Clear all filters'}).click();await page.getByRole('button',{name:'Load more perspectives'}).click();if(await page.locator('.resource-card').count()!==18)throw Error('Pagination failed');await page.getByLabel('Explore by topic').selectOption('IVD');if(await page.locator('.resource-card').count()<4)throw Error('Topic filter failed')});
await check('Desktop submenu opens via keyboard and closes with Escape',async()=>{await page.goto(origin);const b=page.getByRole('button',{name:'Services submenu'});await b.focus();await page.keyboard.press('Enter');await page.locator('.nav-dropdown').waitFor();await page.keyboard.press('Escape');if(await page.locator('.nav-dropdown').count())throw Error('Escape did not close')});
await check('Header search preserves query and returns career results',async()=>{await page.getByRole('button',{name:'Open search'}).click();await page.getByLabel('Search the website',{exact:true}).fill('biostatistics');await page.locator('.search-panel').getByRole('button',{name:'Search',exact:true}).click();await page.waitForURL('**/search?q=biostatistics');if(await page.locator('.search-result').count()<2)throw Error('No expected search results')});
await check('Mobile menu routes and collapses',async()=>{await page.setViewportSize({width:390,height:850});await page.goto(origin);await page.getByRole('button',{name:'Open menu'}).click();await page.locator('.main-nav').getByRole('link',{name:'Careers',exact:true}).click();await page.waitForURL('**/careers');if(await page.getByRole('button',{name:'Open menu'}).getAttribute('aria-expanded')!=='false')throw Error('Menu remains open')});
await check('Contact failure is truthful and preserves input',async()=>{await page.goto(origin+'/contact');await page.getByLabel('Subject').selectOption('Clinical Trials');await page.getByLabel('Your name').fill('Local QA fixture');await page.getByLabel('Email address',{exact:true}).fill('fixture@example.test');await page.getByLabel('How can we help?').fill('Local QA: no message must be sent to any recipient.');await page.getByRole('button',{name:'Send inquiry'}).click();await page.locator('.contact-form .form-status').filter({hasText:'not connected'}).waitFor();if(!(await page.getByLabel('How can we help?').inputValue()).includes('Local QA'))throw Error('Input lost')});
await check('Newsletter rejects disconnected delivery without success',async()=>{await page.locator('#newsletter-email').fill('fixture@example.test');await page.getByRole('button',{name:'Subscribe',exact:true}).click();await page.locator('.newsletter .form-status').filter({hasText:'not been added'}).waitFor()});
await check('Reduced motion keeps content visible and stops decorative animation',async()=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto(origin);const state=await page.locator('.brand-orbit').evaluate(el=>getComputedStyle(el).animationName);if(state!=='none')throw Error('Animation persists');await page.locator('h1').waitFor({state:'visible'})});
 await fs.writeFile('qa/browser-report.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({viewports:result.viewports.length,overflow:result.viewports.filter(x=>x.scrollWidth>x.width),broken:result.viewports.filter(x=>x.brokenImages.length),axe:result.accessibility.map(x=>({path:x.path,violations:x.violations.length})),interactions:result.interactions,errors:result.errors},null,2));
await browser.close();
if(result.errors.length||result.viewports.some(x=>x.status!==200||x.scrollWidth>x.width||x.brokenImages.length||x.h1!==1)||result.interactions.some(x=>!x.passed)||result.accessibility.some(x=>x.violations.length))process.exitCode=1;
