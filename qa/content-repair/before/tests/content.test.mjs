import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {legacyDestination} from '../lib/legacy.mjs';
import {validateSubmission} from '../lib/validation.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const site=read('../content/site.json'), research=read('../content/research.json'),map=read('../redirect-map.json');
test('47 source addresses map precisely, including query variants',()=>{
 assert.equal(map.length,47);
 for(const row of map)assert.equal(legacyDestination(row.sourceUrl,map),new URL(row.sourceUrl).pathname==='/'?null:row.targetRoute,row.sourceUrl);
 assert.equal(legacyDestination('/News.aspx?ClassID=102&q=IVD%20trial',map),'/search?q=IVD%20trial');
 assert.equal(legacyDestination('/news.aspx?classid=102',map),'/resources');
 assert.equal(legacyDestination('/NewsDetail.aspx?ID=999',map),null);
 assert.equal(legacyDestination('/management.aspx?ClassID=78&utm_source=email',map),'/services/medical-device-510k?utm_source=email');
});
test('eight educational roles retain all 15 sections and original downloads',()=>{
 assert.equal(site.jobs.length,8);assert.equal(new Set(site.jobs.map(x=>x.id)).size,8);
 for(const j of site.jobs){assert.equal(j.pages,2);assert.equal(j.sections.length,15,j.id);assert.ok(fs.existsSync(new URL('../public'+j.pdf,import.meta.url)));const txt=j.sections.map(s=>s.paragraphs.join(' ')).join(' ');assert.match(txt,/education partners/);assert.match(txt,/not a cleared, approved, or clinically/);assert.match(txt,/equal internship and employment opportunities/);assert.ok(!txt.includes('�'),j.id);}
});
test('research is source-backed, unique, and separate from historical articles',()=>{
 assert.ok(research.length>=27);assert.equal(new Set(research.map(x=>x.doi.toLowerCase())).size,research.length);
 for(const r of research){assert.ok(r.title&&r.author&&r.year&&r.sourceOrganization&&r.doi);assert.match(r.sourceUrl,/^https:\/\/doi.org\//);assert.ok(r.html.length>500);assert.equal(r.editorialPublicationDate,null);assert.equal(r.sourceAccessStatus,'verified')}
 assert.equal(site.historical.length,6);assert.ok(site.historical.every(x=>x.title!=='All Resources'));
 const insights=read('../content/insights.json');assert.equal(insights.length,11);assert.equal(insights.filter(x=>x.type==='Company Insights').length,7);assert.equal(insights.filter(x=>x.type==='Science').length,4);
 assert.equal(site.pendingLinkedin.length,11);assert.ok(site.pendingLinkedin.every(x=>x.publicationStatus==='published'&&x.targetRoute));
 for(const x of insights){assert.ok(x.additionalSources.length);assert.ok(x.originalPublicationDate);assert.equal(x.author,'Hopkins MedTech Compliance');assert.equal(x.editorialPublicationDate,null)}
});
test('team uses six real named profiles without invented Jeff title or portraits',()=>{
 assert.equal(site.team.length,6);assert.equal(site.team[0].name,'Jeff Wu');assert.equal(site.team[0].role,null);assert.equal(site.team[0].html,'');assert.ok(site.team[1].name.startsWith('Homer Wu'));assert.ok(site.team.every(x=>x.image===null));assert.equal(site.team.filter(x=>x.slug==='homer-wu').length,1);
});
test('contact preserves email-or-phone rule and rejects invalid types, lengths, spam',()=>{
 const valid={subject:'Clinical',name:'Sandbox test',phone:'+1 800 320 1438',message:'Controlled local validation fixture'};
 assert.ok(validateSubmission('contact',valid).ok);assert.ok(validateSubmission('contact',{...valid,phone:'',email:'fixture@example.test'}).ok);
 assert.equal(validateSubmission('contact',{...valid,phone:''}).ok,false);assert.equal(validateSubmission('contact',{...valid,email:'invalid'}).ok,false);assert.equal(validateSubmission('contact',{...valid,name:{nested:1}}).ok,false);assert.equal(validateSubmission('contact',{...valid,message:'x'.repeat(5001)}).ok,false);assert.equal(validateSubmission('contact',{...valid,website:'bot'}).ok,false);
 assert.equal(validateSubmission('newsletter',{email:'fixture@example.test'}).ok,true);assert.equal(validateSubmission('newsletter',null).ok,false);assert.equal(validateSubmission('newsletter',{email:''}).ok,false);
});
