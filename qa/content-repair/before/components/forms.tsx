'use client';
import {useState} from 'react';
import {ArrowUpRight,ArrowRight,LoaderCircle} from 'lucide-react';
type Reply={ok:boolean,message?:string,requestId?:string};
async function submit(kind:string,body:Record<string,FormDataEntryValue>){const r=await fetch('/api/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});return await r.json() as Reply;}
export function Newsletter({available=false}:{available?:boolean}){
 const [state,setState]=useState('');const [loading,setLoading]=useState(false);
 return <form className="newsletter" onSubmit={async e=>{
 e.preventDefault();if(loading)return;const form=e.currentTarget;setLoading(true);setState('');
 try{const r=await submit('newsletter',Object.fromEntries(new FormData(form)));setState(r.ok?'Your subscription was received. Reference: '+r.requestId:r.message||'Unable to subscribe. Please try again.');if(r.ok)form.reset()}catch{setState('We could not reach the subscription service. Please try again later.')}finally{setLoading(false)}
 }}><label htmlFor="newsletter-email">Stay connected to MedTech.</label><p>Research, regulatory perspectives and company updates.</p><div className="newsletter-field"><input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="Your email address" maxLength={254} required/><button type="submit" aria-label="Subscribe" disabled={loading}>{loading?<LoaderCircle className="spin" size={20}/>:<ArrowRight size={22}/>}</button></div><input className="honeypot" aria-hidden="true" tabIndex={-1} name="website" autoComplete="off"/>{!available&&<p className="form-hint">Email signup is currently unavailable. Please check back soon.</p>}<p role="status" className="form-status">{state}</p></form>
}
export function ContactForm({available=false}:{available?:boolean}){
 const [loading,setLoading]=useState(false);const [state,setState]=useState('');const [ok,setOk]=useState(false);
 return <form className="contact-form" onSubmit={async e=>{
 e.preventDefault();if(loading)return;const form=e.currentTarget;const d=Object.fromEntries(new FormData(form));if(!String(d.email).trim()&&!String(d.phone).trim()){setState('Please provide an email address or phone number so we can respond.');setOk(false);return}setLoading(true);setState('');
 try{const r=await submit('contact',d);setOk(r.ok);setState(r.ok?'Your inquiry has been received. Reference: '+r.requestId:r.message||'Your inquiry could not be delivered.');if(r.ok)form.reset()}catch{setOk(false);setState('Your inquiry was not confirmed. Please try again or contact us by email. Your message has been kept below.')}finally{setLoading(false)}
 }}>
 <div className="form-intro"><h2>Tell us about your project.</h2>{available?<p>Share a little about your project and the best way to reach you.</p>:<p>Online submission is not connected yet. You can reach us directly at <a href="mailto:HomerWu@HopkinsMedtech.com">HomerWu@HopkinsMedtech.com</a>.</p>}</div>
 <label>Subject <span>*</span><select name="subject" required defaultValue=""><option value="" disabled>Select an area of interest</option>{['FDA Regulatory Consulting','Clinical Trials','IVD and Medical Device Compliance','Market Entry','Laboratory Services','Other inquiry'].map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Your name <span>*</span><input name="name" autoComplete="name" maxLength={100} required placeholder="Full name"/></label>
 <div className="form-row"><label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@company.com"/></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Include country code"/></label></div>
 <p className="form-hint">Please provide an email address or a phone number.</p>
 <label>How can we help? <span>*</span><textarea name="message" required maxLength={5000} rows={5} placeholder="A little about your product, stage and goals…"/></label>
 <input className="honeypot" aria-hidden="true" tabIndex={-1} name="website" autoComplete="off"/>
 <p className="form-hint">Please do not include patient information or confidential project files.</p><p role="status" className={`form-status ${ok?'success':''}`}>{state}</p><button className="button" type="submit" disabled={loading}>{loading?'Sending…':'Send inquiry'}{loading?<LoaderCircle className="spin" size={18}/>:<ArrowUpRight size={18}/>}</button>
 </form>
}
