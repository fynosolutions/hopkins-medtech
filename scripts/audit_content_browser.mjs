import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const base='https://hopkins-medtech.vercel.app';
const audit=JSON.parse(await fs.readFile('qa/content-audit/coverage.json','utf8'));
const site=JSON.parse(await fs.readFile('content/site.json','utf8'));
const routes=new Set(['/resources','/services','/contact','/about/team',...site.industries.map(x=>x.route)]);
for(const img of audit.images.filter(x=>x.directlyRendered)) routes.add(img.renderedRoutes.find(x=>x.startsWith('/')));
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const result={base,checkedAt:new Date().toISOString(),pages:[],images:[],industryAccordions:[],resourceArchive:null,contactFields:[],errors:[]};
const queue=[...routes].filter(Boolean);
try{
 await Promise.all(Array.from({length:4},async()=>{
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  while(queue.length){
   const route=queue.shift();
   try{
    const res=await page.goto(base+route,{waitUntil:'networkidle',timeout:45000});
    if(route==='/resources'){
     await page.getByRole('button',{name:'Historical Resources',exact:true}).click();
     const titles=await page.locator('.resource-grid h3').allTextContents();
     result.resourceArchive={titles,count:titles.length,links:await page.locator('.resource-grid h3 a').evaluateAll(els=>els.map(e=>e.getAttribute('href'))),topicOptions:await page.locator('#topic-filter option').allTextContents()};
     await page.screenshot({path:'qa/content-audit/new-historical-resources.png',fullPage:true});
    }
    if(route.startsWith('/industries/')){
     const panels=page.locator('details.accordion');
     for(let i=0;i<await panels.count();i++){
      const panel=panels.nth(i);if(!await panel.evaluate(e=>e.open))await panel.locator('summary').click();
      result.industryAccordions.push({route,title:await panel.locator('summary').innerText(),bodyVisible:await panel.locator('.prose').isVisible(),links:await panel.locator('.prose a').evaluateAll(els=>els.map(e=>e.getAttribute('href')))});
     }
    }
    if(route==='/contact')result.contactFields=await page.locator('.contact-form input:not(.honeypot),.contact-form select,.contact-form textarea').evaluateAll(els=>els.map(e=>({name:e.name,tag:e.tagName,type:e.type})));
    const imgs=page.locator('img');
    for(let i=0;i<await imgs.count();i++){
     const el=imgs.nth(i);await el.scrollIntoViewIfNeeded();await el.evaluate(e=>e.decode().catch(()=>{}));
     const item=await el.evaluate(e=>({src:e.getAttribute('src'),width:e.naturalWidth,height:e.naturalHeight,renderWidth:e.getBoundingClientRect().width,renderHeight:e.getBoundingClientRect().height}));
     result.images.push({route,...item,visible:await el.isVisible()});
    }
    result.pages.push({route,status:res.status()});
   }catch(e){result.errors.push(route+': '+e.message)}
  }
  await page.close();
 }));
 result.sourceImages=audit.images.filter(x=>x.directlyRendered).map(x=>({id:x.id,src:x.sourceUrl,confirmed:result.images.some(i=>[x.localPath,x.optimizedPath].includes(i.src)&&i.width>0&&i.visible&&i.renderWidth>0&&i.renderHeight>0)}));
 result.summary={pages:result.pages.length,imagesConfirmed:result.sourceImages.filter(x=>x.confirmed).length,expectedImages:result.sourceImages.length,industryPanels:result.industryAccordions.length,industryPanelsVisible:result.industryAccordions.filter(x=>x.bodyVisible).length,historicalResources:result.resourceArchive?.count,errors:result.errors.length};
 await fs.writeFile('qa/content-audit/browser-verification.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result.summary,null,2));
 if(result.errors.length)console.log(result.errors);
}finally{await browser.close()}
