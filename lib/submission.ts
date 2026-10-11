import {createHash} from 'node:crypto';
import {validateSubmission} from './validation.mjs';
const attempts=new Map<string,{count:number,until:number}>();
const fail=(status:number,code:string,message:string,extra:Record<string,unknown>={})=>Response.json({ok:false,code,message,...extra},{status,headers:{'Cache-Control':'no-store'}});
export async function handleSubmission(request:Request,kind:'contact'|'newsletter'){
 const origin=request.headers.get('origin');
 // Next's internal request URL may use localhost behind the hosting proxy.
 // Compare the browser Origin with the actual request Host, not that internal URL.
 if(origin){
  try{if(new URL(origin).host!==(request.headers.get('host')||new URL(request.url).host))return fail(403,'ORIGIN_REJECTED','Please submit from this website.');}
  catch{return fail(403,'ORIGIN_REJECTED','Please submit from this website.');}
 }
 if(!request.headers.get('content-type')?.includes('application/json'))return fail(415,'JSON_REQUIRED','A JSON request is required.');
 if(Number(request.headers.get('content-length')||0)>18000)return fail(413,'TOO_LARGE','Your message is too long.');
 const now=Date.now();for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0]||'local';
 const key=createHash('sha256').update(ip+kind).digest('hex');const rate=attempts.get(key)||{count:0,until:now+60000};rate.count++;attempts.set(key,rate);
 if(rate.count>5)return fail(429,'RATE_LIMITED','Please wait a minute before trying again.');
 let data;try{const raw=await request.text();if(raw.length>18000)return fail(413,'TOO_LARGE','Your message is too long.');data=JSON.parse(raw)}catch{return fail(400,'INVALID_JSON','The request could not be read.')}
 const checked=validateSubmission(kind,data);
 if(!checked.ok)return fail(400,'VALIDATION_ERROR','Please check the form fields.',{fieldErrors:checked.fieldErrors});
 const endpoint=kind==='contact'?process.env.CONTACT_WEBHOOK_URL:process.env.NEWSLETTER_WEBHOOK_URL;
 if(!endpoint)return fail(503,'NOT_CONFIGURED',kind==='contact'?'Online inquiries are not connected yet. Please email info@hopkinsmedtech.com or call +1 800 320 1438. Your message has not been sent.':'Email subscriptions are not connected yet. Your email has not been added to a mailing list.');
 try{
  const url=new URL(endpoint);if(url.protocol!=='https:')return fail(503,'TRANSPORT_UNAVAILABLE','The submission service is unavailable.');
  const upstream=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.FORM_WEBHOOK_SECRET?{'Authorization':'Bearer '+process.env.FORM_WEBHOOK_SECRET}:{})},body:JSON.stringify({kind,...checked.data}),signal:AbortSignal.timeout(8000),redirect:'error'});
  const receipt=await upstream.json();
  if(!upstream.ok||receipt.ok!==true||typeof receipt.requestId!=='string'||!receipt.requestId.trim())return fail(502,'DELIVERY_UNCONFIRMED','Delivery was not confirmed. Please contact us directly. Your input has been kept.');
  return Response.json({ok:true,requestId:receipt.requestId.slice(0,120)},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail(502,'DELIVERY_UNCONFIRMED','Delivery was not confirmed. Please contact us directly. Your input has been kept.')}
}
