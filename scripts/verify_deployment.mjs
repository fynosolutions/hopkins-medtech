import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const origin='https://hopkins-medtech.vercel.app';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const report={origin,pages:[],accessibility:[],api:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
try{
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  for(const path of ['/','/careers','/resources','/about/team','/resources/ivdr-transition-and-eudamed-dates','/resources/skin-tone-labels-and-metrics','/careers/clinical-data-biostatistics-intern']){
   const r=await page.goto(origin+path,{waitUntil:'networkidle',timeout:30000});
   const data=await page.evaluate(()=>({title:document.title,h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.src),canonical:document.querySelector('link[rel="canonical"]')?.getAttribute('href'),robots:document.querySelector('meta[name="robots"]')?.getAttribute('content')}));
   report.pages.push({path,width,status:r.status(),...data});
   if(path==='/')await page.screenshot({path:`qa/deployed-home-${width}.png`,fullPage:true});
   if(width===390&&path.startsWith('/resources/')){
    const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    report.accessibility.push({path,violations:a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});
   }
  }
  console.log('Deployed pages checked at',width);
  await fs.writeFile('qa/deployment-browser.json',JSON.stringify(report,null,2));
 }
 await page.goto(origin+'/resources');await page.getByRole('button',{name:'Company Insights',exact:true}).click();
 if(await page.locator('.resource-card').count()!==7)throw Error('Company filter count');
 await page.getByRole('button',{name:'Science',exact:true}).click();
 if(await page.locator('.resource-card').count()!==4)throw Error('Science filter count');
 for(const path of ['/api/contact','/api/newsletter']){
  // Empty bodies must fail validation before any possible transport call.
  const response=await page.evaluate(async path=>{const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});return {status:r.status,body:await r.json()}},path);
  report.api.push({path,...response});
 }
 await fs.writeFile('qa/deployment-browser.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({pages:report.pages.length,bad:report.pages.filter(x=>x.status!==200||x.overflow||x.brokenImages.length||x.h1!==1),axe:report.accessibility,api:report.api,errors:report.errors},null,2));
 if(report.pages.some(x=>x.status!==200||x.overflow||x.brokenImages.length||x.h1!==1)||report.errors.length||report.accessibility.some(x=>x.violations.length)||report.api.some(x=>x.status!==400))process.exitCode=1;
}finally{await browser.close()}
