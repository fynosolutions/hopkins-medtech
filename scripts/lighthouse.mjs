import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
// Pass the locally installed Lighthouse module entry as the first argument.
const {default:lighthouse}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({headless:true,args:['--remote-debugging-port=9222']});
try{
 for(const desktop of [false,true]){
  const result=await lighthouse(process.env.QA_ORIGIN||'http://127.0.0.1:3002',{port:9222,output:'json',logLevel:'error',...(desktop?{formFactor:'desktop',screenEmulation:{mobile:false,width:1350,height:940,deviceScaleFactor:1,disabled:false},throttling:{rttMs:40,throughputKbps:10240,cpuSlowdownMultiplier:1}}:{})});
  await fs.writeFile(`qa/lighthouse-${desktop?'desktop':'mobile'}.json`,result.report);
  console.log(desktop?'Desktop':'Mobile',JSON.stringify(Object.fromEntries(Object.entries(result.lhr.categories).map(([k,v])=>[k,v.score]))));
 }
}finally{await browser.close()}
