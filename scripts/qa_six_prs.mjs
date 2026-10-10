import {chromium} from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const origin=process.env.QA_ORIGIN||'http://localhost:3107';
const out='qa/mao-confirmed-2026-10-10/final';
const site=JSON.parse(fs.readFileSync('content/site.json','utf8'));
const summaries=JSON.parse(fs.readFileSync('content/service-summaries.json','utf8'));
const faq=JSON.parse(fs.readFileSync('content/careers-faq.json','utf8'));
const browser=await chromium.launch();
const all=[]; const visual=[]; const errors=[];
fs.mkdirSync(out+'/screenshots',{recursive:true});
try {
  const page=await browser.newPage({javaScriptEnabled:false,viewport:{width:1440,height:1000}});
  const sitemap=await (await page.request.get(origin+'/sitemap.xml')).text();
  const routes=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>new URL(match[1]).pathname);
  for(const route of routes) {
    const response=await page.goto(origin+route,{waitUntil:'domcontentloaded'});
    const data=await page.evaluate(()=>{
      const headings=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(n=>({level:Number(n.tagName[1]),text:n.textContent.trim()}));
      const schemas=[...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(n=>JSON.parse(n.textContent));
      return {headings,schemas,missingAlt:[...document.images].filter(n=>!n.hasAttribute('alt')).length,
        noindex:document.querySelector('meta[name="robots"]')?.content.includes('noindex'),
        emptyEvidence:document.querySelectorAll('.approved-experiences').length,
        textLength:document.querySelector('main').innerText.length,
        tables:document.querySelectorAll('.page-facts table').length,
        source:document.querySelector('.article-source-meta a')?.getAttribute('href')};
    });
    assert.equal(response.status(),200,route);
    assert.equal(data.headings.filter(x=>x.level===1).length,1,route);
    assert.ok(data.headings.every((x,i)=>i===0||x.level<=data.headings[i-1].level+1),'Heading skip: '+route);
    assert.equal(data.missingAlt,0,route);assert.equal(data.noindex,true,route);
    assert.equal(data.emptyEvidence,site.jobs.some(j=>route==='/careers/'+j.slug)?2:0,route);assert.ok(data.textLength>30,route);
    if(site.jobs.some(j=>route==='/careers/'+j.slug)) {
      assert.equal(data.tables,1,route);
      assert.equal(data.schemas.filter(s=>s['@type']==='JobPosting').length,1,route);
      const jobSchema=data.schemas.find(s=>s['@type']==='JobPosting');
      assert.match(jobSchema.description,/Work arrangement: Remote \/ Onsite/);
      for(const field of ['datePosted','validThrough','jobLocation','jobLocationType','applicantLocationRequirements'])assert.equal(jobSchema[field],undefined,route);
      assert.match(await page.locator('.page-facts').innerText(),/Remote \/ Onsite/);
      assert.equal(await page.locator('.job-document > section').count(),15,route);
    }
    if(site.services.some(s=>s.route===route)) {
      assert.equal(data.tables,1,route);
      const slug=route.split('/').at(-1);
      const description=await page.locator('.page-hero .lead').innerText();
      assert.equal(description,summaries[slug].intro,route);
      assert.ok(description.split(/\s+/).length<=40,route);
      assert.equal(data.schemas.find(s=>s['@type']==='Service').description,description,route);
    }
    if(route.startsWith('/resources/')) assert.ok(data.source,route);
    if(route==='/careers') {
      const schema=data.schemas.find(s=>s['@type']==='FAQPage');
      assert.deepEqual(schema.mainEntity.map(x=>[x.name,x.acceptedAnswer.text]),faq.map(x=>[x.question,x.answer]));
      assert.deepEqual(await page.locator('.careers-faq > section > p').allTextContents(),faq.map(x=>x.answer));
    }
    all.push({route,headingCount:data.headings.length,schemaTypes:data.schemas.map(s=>s['@type']),noindex:data.noindex,textLength:data.textLength});
  }
  assert.match(await (await page.request.get(origin+'/robots.txt')).text(),/Disallow: \/\s/);
  const llms=await page.request.get(origin+'/llms.txt');assert.equal(llms.status(),200);assert.match(llms.headers()['x-robots-tag'],/noindex/);
  assert.ok(routes.includes('/about/team/jeff-wu'));
  await page.goto(origin+'/about/team/jeff-wu');
  assert.equal(await page.locator('.profile-hero .lead').innerText(),'Co-founder');
  assert.equal(await page.locator('.profile-hero a[href="https://www.linkedin.com/in/jeffwu774/"]').count(),1);
  await page.goto(origin+'/search?q=Jeff%20Wu');assert.equal(await page.locator('a[href*="/about/team/jeff-wu"]').count(),1);
  await page.close();
  const samples=['/','/about','/careers','/resources','/about/team','/about/team/jeff-wu','/resources/'+JSON.parse(fs.readFileSync('content/research.json','utf8'))[0].slug,...site.services.map(s=>s.route),...site.jobs.map(j=>'/careers/'+j.slug)];
  for(const width of [1440,390]) {
    const p=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
    p.on('pageerror',error=>errors.push(error.message));
    for(const route of samples) {
      await p.goto(origin+route,{waitUntil:'networkidle'});
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}: overflow ${route}`);
      const badImages=await p.locator('img').evaluateAll(images=>images.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src));
      assert.deepEqual(badImages,[],route);
      visual.push({route,width,overflow:false});
      if(samples.indexOf(route)<8||route==='/services/quality-system'||route==='/careers/clinical-research-intern')
        await p.screenshot({path:out+'/screenshots/'+(route==='/'?'home':route.slice(1).replaceAll('/','-'))+'-'+width+'.png',fullPage:true});
    }
    await p.close();
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/browser-report.json',JSON.stringify({staticPages:all.length,withoutJavaScript:all,desktopAndMobile:visual,errors},null,2));
  console.log(JSON.stringify({staticPages:all.length,visualChecks:visual.length,errors}));
} finally {await browser.close();}
