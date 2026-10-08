import test from 'node:test';
import assert from 'node:assert/strict';
import {handleSubmission} from '../lib/submission.ts';
let address=1;
const payload={subject:'Local test',name:'Sandbox fixture',email:'fixture@example.test',message:'Controlled test; never send to a real recipient.'};
const req=(body=payload,extra={})=>new Request('https://site.test/api/contact',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://site.test','x-forwarded-for':'fixture-'+address++,...extra},body:JSON.stringify(body)});
test('no configured transport cannot report delivery success',async()=>{delete process.env.CONTACT_WEBHOOK_URL;const r=await handleSubmission(req(),'contact');assert.equal(r.status,503);assert.deepEqual((await r.json()).ok,false)});
test('transport success requires a real receipt, not merely HTTP 200',async()=>{
 const original=globalThis.fetch;process.env.CONTACT_WEBHOOK_URL='https://sandbox-receiver.invalid/receive';
 try{
  globalThis.fetch=async()=>Response.json({message:'accepted'});let r=await handleSubmission(req(),'contact');assert.equal(r.status,502);
  globalThis.fetch=async()=>Response.json({ok:false,requestId:'rejected'});r=await handleSubmission(req(),'contact');assert.equal(r.status,502);
  globalThis.fetch=async(url,options)=>{assert.equal(new URL(url).search,'');assert.equal(options.method,'POST');assert.equal(JSON.parse(options.body).email,payload.email);return Response.json({ok:true,requestId:'local-fixture-receipt'})};
  r=await handleSubmission(req(),'contact');assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,requestId:'local-fixture-receipt'});
 }finally{globalThis.fetch=original;delete process.env.CONTACT_WEBHOOK_URL}
});
test('upstream failure and timeout remain explicit failures',async()=>{
 const original=globalThis.fetch;process.env.CONTACT_WEBHOOK_URL='https://sandbox-receiver.invalid/receive';
 try{
  globalThis.fetch=async()=>Response.json({ok:true,requestId:'not-delivered'},{status:500});assert.equal((await handleSubmission(req(),'contact')).status,502);
  globalThis.fetch=async()=>{throw new DOMException('timeout','TimeoutError')};assert.equal((await handleSubmission(req(),'contact')).status,502);
 }finally{globalThis.fetch=original;delete process.env.CONTACT_WEBHOOK_URL}
});
test('validation, cross-origin requests and repeated requests are rejected',async()=>{
 assert.equal((await handleSubmission(req({}),'contact')).status,400);
 assert.equal((await handleSubmission(req(payload,{Origin:'https://other.test'}),'contact')).status,403);
 for(let i=0;i<5;i++)assert.equal((await handleSubmission(req(payload,{'x-forwarded-for':'repeated-fixture'}),'contact')).status,503);
 assert.equal((await handleSubmission(req(payload,{'x-forwarded-for':'repeated-fixture'}),'contact')).status,429);
});
