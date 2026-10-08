import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
await page.goto('https://www.rqmplus.com/',{waitUntil:'domcontentloaded',timeout:45000});
await page.mouse.move(700,350);await page.keyboard.press('Tab');
const frames=[];
for(let i=0;i<3;i++){
 await page.waitForTimeout(i===0?700:2000);
 frames.push(await page.evaluate(()=>({time:performance.now(),elements:[...document.querySelectorAll('.bi-title-1,.big-idea-bg,.rqm-dots-grad circle')].slice(0,8).map(el=>({class:el.getAttribute('class'),opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform,fill:getComputedStyle(el).fill}))})));
 await page.screenshot({path:`qa/reference-motion/hero-${i}.png`});
}
await page.evaluate(()=>document.querySelector('.block-cross-text')?.scrollIntoView());await page.waitForTimeout(1800);
await page.screenshot({path:'qa/reference-motion/cross-text.png'});
await fs.writeFile('qa/reference-motion/frames.json',JSON.stringify(frames,null,2));
console.log('Reference motion frames captured',frames.map(f=>f.elements.length));
await browser.close();
