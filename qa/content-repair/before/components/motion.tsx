'use client';

import {createContext,useContext,useEffect,useLayoutEffect,useState} from 'react';
import type {ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {ArrowUp,Pause,Play} from 'lucide-react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

const MotionContext=createContext({enabled:false});
export const useMotion=()=>useContext(MotionContext);

function MotionScenes({enabled}:{enabled:boolean}){
 const path=usePathname();
 useLayoutEffect(()=>{
  document.documentElement.dataset.motion=enabled?'on':'off';
  if(!enabled)return;
  gsap.registerPlugin(ScrollTrigger);
  const main=document.querySelector('main');
  if(!main)return;
  let active=true;
  const cleanups:(()=>void)[]=[];
  const context=gsap.context(self=>{
   const hero=main.querySelector('.home-hero');
   if(hero){
    // Text remains server-rendered and visible before this enhancement runs.
    gsap.timeline({defaults:{ease:'power3.out'}})
     .from('.hero-line>span',{yPercent:110,opacity:0,duration:.95,stagger:.16,clearProps:'transform,opacity'},.06)
     .from('.hero-wash',{xPercent:102,duration:1.2,clearProps:'transform'},.05)
     .from('.hero-copy .eyebrow',{y:12,opacity:0,duration:.6,clearProps:'transform,opacity'},.08)
     .from('.brand-orbit',{rotation:-110,scale:.55,opacity:0,duration:1.7,clearProps:'transform,opacity'},.35)
     .from('.hero-copy>div>p,.hero-buttons,.hero-footnote',{y:22,opacity:0,duration:.7,stagger:.12,clearProps:'transform,opacity'},.6)
     .from('.visual-top,.orbit-caption,.visual-bottom',{y:24,opacity:0,duration:.8,stagger:.12,clearProps:'transform,opacity'},.8);
    const visual=main.querySelector<HTMLElement>('.hero-visual')!;
    const observer=new IntersectionObserver(([entry])=>{visual.dataset.inView=String(entry.isIntersecting)},{threshold:0});
    observer.observe(visual);
    cleanups.push(()=>{observer.disconnect();delete visual.dataset.inView});
    if(window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches){
     const target=visual.querySelector('.orbit-interaction');
     const x=gsap.quickTo(target,'x',{duration:.8,ease:'power2.out'});
     const y=gsap.quickTo(target,'y',{duration:.8,ease:'power2.out'});
     const move=(e:PointerEvent)=>{const b=visual.getBoundingClientRect();x((e.clientX-b.left-b.width/2)*.035);y((e.clientY-b.top-b.height/2)*.035)};
     const reset=()=>{x(0);y(0)};
     visual.addEventListener('pointermove',move);visual.addEventListener('pointerleave',reset);
     cleanups.push(()=>{visual.removeEventListener('pointermove',move);visual.removeEventListener('pointerleave',reset)});
    }
   }
   const pageHero=main.querySelector('.page-hero');
   if(pageHero){
    gsap.from(pageHero.querySelectorAll('.eyebrow,h1,.lead,.button'),{y:28,opacity:0,duration:.8,stagger:.1,ease:'power3.out',clearProps:'transform,opacity'});
    gsap.from(pageHero.querySelector('.hero-orbits'),{rotation:-35,scale:.78,duration:1.8,ease:'power3.out',clearProps:'transform'});
   }
   // Do not hide offscreen content while waiting for an observer. Animation starts
   // only when a section actually enters the viewport, and always clears styles.
   const reveal=(trigger:Element,targets:Element[],direction='up',stagger=.09,delay=0)=>{
    if(!targets.length)return;
    ScrollTrigger.create({trigger,start:'top 88%',once:true,onEnter:()=>self.add(()=>{
     gsap.fromTo(targets,{opacity:0,x:direction==='left'?-42:direction==='right'?42:0,y:direction==='up'?38:0},{opacity:1,x:0,y:0,duration:.85,stagger,delay,ease:'power3.out',clearProps:'transform,opacity'});
    })});
   };
   main.querySelectorAll('[data-reveal]').forEach(el=>reveal(el,[el],el.getAttribute('data-reveal')||'up'));
   main.querySelectorAll('.section-heading').forEach(el=>reveal(el,Array.from(el.querySelectorAll('.eyebrow,h2,p,.text-link'))));
   main.querySelectorAll('.service-grid,.team-preview-grid,.team-grid,.industry-grid,.application-steps,.jobs-list').forEach(group=>{
    Array.from(group.children).forEach((el,i)=>reveal(el,[el],'up',0,(i%3)*.1));
   });
   main.querySelectorAll('.cross-statement').forEach(row=>{
    ScrollTrigger.create({trigger:row,start:'top 86%',once:true,onEnter:()=>self.add(()=>{
     gsap.timeline({defaults:{ease:'power3.out',clearProps:'transform,opacity'}})
      .from(row.querySelector('.statement-question'),{x:-40,opacity:0,duration:.7})
      .from(row.querySelectorAll('.statement-dots i'),{scale:0,opacity:0,duration:.4,stagger:.09},.15)
      .from(row.querySelector('.statement-answer'),{x:-25,opacity:0,duration:.7},.4);
    })});
   });
   const lifecycle=main.querySelector('.lifecycle');
   if(lifecycle){
    gsap.fromTo(lifecycle.children,{'--stage-progress':0},{'--stage-progress':1,stagger:.22,duration:.45,ease:'none',scrollTrigger:{trigger:lifecycle,start:'top 85%',end:'bottom 48%',scrub:.5}});
   }
   // A small amount of scroll-linked movement, without pinning or scroll hijacking.
   main.querySelectorAll('.image-orbit,.cta-ring,.careers-lines').forEach(el=>{
    gsap.fromTo(el,{y:25,rotation:-12},{y:-25,rotation:12,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:1}});
   });
   if(window.matchMedia('(min-width: 768px)').matches){
    main.querySelectorAll('.industry-visual>img').forEach(el=>gsap.fromTo(el,{y:-16,scale:1.09},{y:16,scale:1.09,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:.7}}));
   }
  },main);
  const frame=requestAnimationFrame(()=>ScrollTrigger.refresh());
  document.fonts.ready.then(()=>{if(active)ScrollTrigger.refresh()});
  return()=>{active=false;cancelAnimationFrame(frame);cleanups.forEach(fn=>fn());context.revert()};
 },[enabled,path]);
 return null;
}

export function MotionProvider({children}:{children:ReactNode}){
 const [ready,setReady]=useState(false),[reduced,setReduced]=useState(false),[paused,setPaused]=useState(false),[pastTop,setPastTop]=useState(false);
 useEffect(()=>{
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>setReduced(mq.matches);sync();mq.addEventListener('change',sync);
  try{setPaused(localStorage.getItem('hmc-motion')==='paused')}catch{}
  setReady(true);
  const scroll=()=>setPastTop(window.scrollY>600);scroll();
  const visibility=()=>{document.documentElement.dataset.pageVisible=String(!document.hidden)};visibility();
  window.addEventListener('scroll',scroll,{passive:true});document.addEventListener('visibilitychange',visibility);
  return()=>{mq.removeEventListener('change',sync);window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility)};
 },[]);
 const enabled=ready&&!reduced&&!paused;
 function toggle(){setPaused(!paused);try{localStorage.setItem('hmc-motion',paused?'enabled':'paused')}catch{}}
 return <MotionContext.Provider value={{enabled}}>{children}<MotionScenes enabled={enabled}/>{ready&&<div className="motion-tools">{!reduced&&<button className="motion-toggle" onClick={toggle} aria-label={paused?'Play animations':'Pause animations'} aria-pressed={paused} title={paused?'Play animations':'Pause animations'}>{paused?<Play size={14}/>:<Pause size={14}/>}<span>{paused?'Play motion':'Pause motion'}</span></button>}{pastTop&&<button className="back-to-top" aria-label="Back to top" onClick={()=>window.scrollTo({top:0,behavior:enabled?'smooth':'instant'})}><ArrowUp size={19}/></button>}</div>}</MotionContext.Provider>;
}
