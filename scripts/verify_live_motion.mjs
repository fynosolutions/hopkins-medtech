import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='https://hopkins-medtech.vercel.app';
const b=await chromium.launch();const c=await b.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});const p=await c.newPage();
const report={origin,errors:[],checks:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{
 const response=await p.goto(origin,{waitUntil:'networkidle'});assert.equal(response.status(),200);
 await p.locator('.hero-line').first().waitFor();await p.locator('html[data-motion="on"]').waitFor();await p.waitForTimeout(2400);
 const a=await p.locator('.orbit-lime').evaluate(el=>getComputedStyle(el).transform);await p.waitForTimeout(1600);const z=await p.locator('.orbit-lime').evaluate(el=>getComputedStyle(el).transform);assert.notEqual(a,z);report.checks.push('Production hero animation is running');
 await p.screenshot({path:'qa/motion/live-home.png'});
 await p.getByRole('button',{name:'Pause animations',exact:true}).click();const stopped=await p.locator('.orbit-lime').evaluate(el=>getComputedStyle(el).transform);await p.waitForTimeout(500);assert.equal(stopped,await p.locator('.orbit-lime').evaluate(el=>getComputedStyle(el).transform));await p.getByRole('button',{name:'Play animations',exact:true}).click();report.checks.push('Production pause and play controls work');
 await p.locator('.testimonial-carousel').scrollIntoViewIfNeeded();await p.waitForTimeout(1400);const quote=await p.locator('.quote-slide[data-active=true] cite').innerText();await p.getByRole('button',{name:'Next testimonial',exact:true}).click();assert.notEqual(quote,await p.locator('.quote-slide[data-active=true] cite').innerText());report.checks.push('Production testimonials change');
 await p.locator('.featured-carousel').scrollIntoViewIfNeeded();await p.getByRole('button',{name:'Next resources',exact:true}).click();await p.waitForTimeout(900);assert.ok(await p.locator('.resource-track').evaluate(el=>el.scrollLeft)>100);report.checks.push('Production resources slide');
 await p.setViewportSize({width:390,height:900});await p.goto(origin);await p.waitForTimeout(2500);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),390);report.checks.push('Production mobile layout has no horizontal overflow');
 assert.equal(report.errors.length,0);console.log(JSON.stringify(report,null,2));
}finally{await fs.writeFile('qa/motion/live-report.json',JSON.stringify(report,null,2));await b.close()}
