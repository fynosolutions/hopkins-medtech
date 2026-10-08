'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Pause,Play} from 'lucide-react';
import {ResourceCard} from './ui';
import {useMotion} from './motion';

type Quote={text:string;name:string;truncated:boolean};
export function TestimonialCarousel({quotes}:{quotes:Quote[]}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[visible,setVisible]=useState(false),[pageVisible,setPageVisible]=useState(true);
 const root=useRef<HTMLDivElement>(null);const {enabled}=useMotion();
 const playing=enabled&&!paused&&!hovered&&!focused&&visible&&pageVisible;
 useEffect(()=>{
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.25});if(root.current)observer.observe(root.current);
  const sync=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',sync);
  return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync)};
 },[]);
 useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setIndex(i=>(i+1)%quotes.length),7500);return()=>clearInterval(timer)},[playing,quotes.length]);
 const move=(direction:number)=>setIndex(i=>(i+direction+quotes.length)%quotes.length);
 return <div ref={root} className="quote-card testimonial-carousel" role="region" aria-roledescription="carousel" aria-label="Client perspectives" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false)}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}}}>
  <span className="quote-mark" aria-hidden="true">“</span>
  <div className="quote-slides" aria-live={playing?'off':'polite'} aria-atomic="true">{quotes.map((q,i)=><div className="quote-slide" key={q.name} data-active={i===index} aria-hidden={i!==index} role="group" aria-roledescription="slide" aria-label={`${i+1} of ${quotes.length}`}><blockquote>{q.text}</blockquote><div className="quote-author"><span className="quote-line"/><cite>{q.name}</cite><span>HMC CLIENT</span></div>{q.truncated&&<p className="quote-source-note">This testimonial ends here in the original website record.</p>}</div>)}</div>
  <div className="carousel-controls"><div className="carousel-dots" aria-label="Choose a testimonial">{quotes.map((q,i)=><button key={q.name} aria-label={`Show testimonial ${i+1} by ${q.name}`} aria-pressed={i===index} onClick={()=>setIndex(i)}><span/></button>)}</div><div className="carousel-arrows">{enabled&&<button aria-label={paused?'Play testimonials':'Pause testimonials'} onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>}<button aria-label="Previous testimonial" onClick={()=>move(-1)}><ArrowLeft size={18}/></button><button aria-label="Next testimonial" onClick={()=>move(1)}><ArrowRight size={18}/></button></div></div>
  <Link href="/about#client-perspectives" className="text-link">Client perspectives<ArrowRight size={18}/></Link>
 </div>;
}

type Resource={title:string;slug:string;excerpt:string;type:string;topic:string;year:string|null};
export function ResourceCarousel({items}:{items:Resource[]}){
 const viewport=useRef<HTMLDivElement>(null);const [position,setPosition]=useState(0),[visible,setVisible]=useState(3);const {enabled}=useMotion();
 useEffect(()=>{
  const el=viewport.current;if(!el)return;
  const update=()=>{const card=el.firstElementChild as HTMLElement;if(!card)return;const width=card.offsetWidth+28;setPosition(Math.round(el.scrollLeft/width));setVisible(Math.max(1,Math.round((el.clientWidth+28)/width)))};
  const resize=new ResizeObserver(update);resize.observe(el);el.addEventListener('scroll',update,{passive:true});update();return()=>{resize.disconnect();el.removeEventListener('scroll',update)};
 },[]);
 function move(direction:number){const el=viewport.current;if(!el)return;const card=el.firstElementChild as HTMLElement;el.scrollTo({left:Math.max(0,Math.min(items.length-visible,position+direction*visible))*(card.offsetWidth+28),behavior:enabled?'smooth':'instant'})}
 return <div className="featured-carousel" role="region" aria-roledescription="carousel" aria-label="Featured resources"><div className="resource-track" ref={viewport}>{items.map((item,i)=><ResourceCard item={item} index={i} key={item.slug}/>)}</div><div className="carousel-controls"><span className="carousel-count" aria-live="polite">{String(position+1).padStart(2,'0')}—{String(Math.min(position+visible,items.length)).padStart(2,'0')} <span>/ {String(items.length).padStart(2,'0')}</span></span><div className="carousel-arrows"><button aria-label="Previous resources" disabled={position===0} onClick={()=>move(-1)}><ArrowLeft size={19}/></button><button aria-label="Next resources" disabled={position>=items.length-visible} onClick={()=>move(1)}><ArrowRight size={19}/></button></div></div></div>;
}
