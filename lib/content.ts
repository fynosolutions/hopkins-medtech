import originalRoutes from '@/content/original-routes.json';
import source from '@/content/site.json';
import research from '@/content/research.json';
import insights from '@/content/insights.json';
import {allPeople} from './team';
export const site = source;
export const resources = [...insights.filter(x=>x.type==='Company Insights'), ...research, ...insights.filter(x=>x.type==='Science'), ...source.historical];
export {default as company} from '@/content/company.json';
export const coreServices = [
 {name:'FDA Regulatory Consulting',label:'A clear path forward.',description:'Regulatory strategy and submission support, from 510(k) and De Novo to PMA and EUA.',href:'/services/fda-regulatory-consulting',icon:'shield'},
 {name:'Clinical Trials',label:'Evidence with purpose.',description:'Study design, clinical operations, data management and biostatistics, connected.',href:'/services/clinical-study',icon:'activity'},
 {name:'IVD & Device Compliance',label:'Confidence at every stage.',description:'IVDR technical documentation, quality systems and post-market support.',href:'/services/ivdr',icon:'microscope'},
 {name:'Market Entry',label:'Your next market, closer.',description:'Practical support for Chinese companies entering the United States and Europe.',href:'/services/market-research',icon:'globe'},
 {name:'Laboratory Services',label:'Science that supports decisions.',description:'Explore diagnostic validation and laboratory support through associated businesses and partners.',href:'/services/laboratory-services',icon:'flask'},
];
export const plain = (s:string) => s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function allRoutes(){return [...originalRoutes,'/', '/about','/about/team','/services','/industries','/resources','/careers','/contact','/search','/privacy',...site.services.map(x=>x.route),...site.industries.map(x=>x.route),...allPeople.map(x=>'/about/team/'+x.slug),...site.jobs.map(x=>'/careers/'+x.slug),...resources.map(x=>'/resources/'+x.slug)];}
export function searchRecords(){return [
 ...site.services.map(x=>({title:x.title,href:x.route,type:'Service',text:plain(x.html),excerpt:x.excerpt})),
 ...site.industries.map(x=>({title:x.title,href:x.route,type:'Industry',text:plain(x.html)+x.sections.map(y=>plain(y.html)).join(' '),excerpt:x.excerpt})),
 ...allPeople.map(x=>({title:x.name,href:'/about/team/'+x.slug,type:'Team',text:plain(x.html)+(x.role||''),excerpt:x.role||x.excerpt})),
 ...site.jobs.map(x=>({title:x.title,href:'/careers/'+x.slug,type:'Career',text:x.sections.map(y=>y.paragraphs.join(' ')).join(' '),excerpt:x.excerpt})),
 ...resources.map(x=>({title:x.title,href:'/resources/'+x.slug,type:'Resource',text:plain(x.html),excerpt:x.excerpt}))
];}
