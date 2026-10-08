import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const map=JSON.parse(await fs.readFile('redirect-map.json','utf8'));
await fs.mkdir('source-archive/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.route('**/*',route=>{
 const req=route.request(), url=new URL(req.url());
 if(req.method()!=='GET'||url.pathname.toLowerCase().includes('checksubmit')||!['www.hopkinsmedtech.com'].includes(url.hostname))return route.abort();
 return route.continue();
});
const results=[];let next=0;
await Promise.all(Array.from({length:3},async()=>{const page=await context.newPage();while(next<map.length){const item=map[next++];try{await page.goto(item.sourceUrl,{waitUntil:'domcontentloaded',timeout:20000});await page.waitForTimeout(350);await page.screenshot({path:`source-archive/screenshots/${item.id}.png`,fullPage:true});results.push({id:item.id,status:'captured'})}catch(e){results.push({id:item.id,status:'failed',reason:e.message})}}await page.close()}));
await fs.writeFile('source-archive/screenshots/status.json',JSON.stringify(results,null,2));await browser.close();console.log('Original source screenshots',results.filter(x=>x.status==='captured').length,'/',map.length);
