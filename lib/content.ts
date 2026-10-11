import serviceSummaries from '@/content/service-summaries.json';
import originalRoutes from '@/content/original-routes.json';
import source from '@/content/site.json';
import research from '@/content/research.json';
import insights from '@/content/insights.json';
import fullTime from '@/content/full-time-roles.json';
import {allPeople} from './team';
// Copy and articles the former website took from another consultancy stay in the archive only.
const thirdPartyCopy = (text?: string | null) => !!text && text.includes('EMMA International');
export const site = {...source, industries: source.industries.filter(item => !thirdPartyCopy(item.html)), services: source.services.map(item => ({...item, reviewNote: thirdPartyCopy(item.reviewNote) ? '' : item.reviewNote, excerpt: serviceSummaries[item.slug as keyof typeof serviceSummaries].intro}))};
export const resources = [...insights.filter(x=>x.type==='Company Insights'), ...research, ...insights.filter(x=>x.type==='Science')];
export {default as company} from '@/content/company.json';
// Full-time roles confirmed by Mao on 2026-10-11; kept apart from the protected internship descriptions.
export const fullTimeRoles = fullTime;
export const coreServices = [
 {name:'FDA Regulatory Consulting',label:'FDA submission services',description:'Regulatory strategy and submission support, from 510(k) and De Novo to PMA and EUA.',href:'/services/fda-regulatory-consulting',icon:'shield'},
 {name:'Clinical Trials',label:'Clinical study services',description:'Study design, clinical operations, data management and biostatistics, connected.',href:'/services/clinical-study',icon:'activity'},
 {name:'IVD & Device Compliance',label:'IVDR documentation',description:'IVDR technical documentation, quality systems and post-market support.',href:'/services/ivdr',icon:'microscope'},
 {name:'Market Entry',label:'Market entry services',description:'Practical support for Chinese companies entering the United States and Europe.',href:'/services/market-research',icon:'globe'},
 {name:'Laboratory Services',label:'Partner laboratory services',description:'Explore diagnostic validation and laboratory support through associated businesses and partners.',href:'/services/laboratory-services',icon:'flask'},
];
export const plain = (s:string) => s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function allRoutes(){return [...originalRoutes,'/', '/about','/about/team','/services','/industries','/resources','/careers','/contact','/search','/privacy',...site.services.map(x=>x.route),...site.industries.map(x=>x.route),...allPeople.map(x=>'/about/team/'+x.slug),...fullTimeRoles.map(x=>'/careers/'+x.slug),...site.jobs.map(x=>'/careers/'+x.slug),...resources.map(x=>'/resources/'+x.slug)];}
export function searchRecords(){return [
 ...site.services.map(x=>({title:x.title,href:x.route,type:'Service',text:plain(x.html),excerpt:x.excerpt})),
 ...site.industries.map(x=>({title:x.title,href:x.route,type:'Industry',text:plain(x.html)+x.sections.map(y=>plain(y.html)).join(' '),excerpt:x.excerpt})),
 ...allPeople.map(x=>({title:x.name,href:'/about/team/'+x.slug,type:'Team',text:plain(x.html)+(x.role||''),excerpt:x.role||x.excerpt})),
 ...fullTimeRoles.map(x=>({title:x.title,href:'/careers/'+x.slug,type:'Career',text:[...x.summary,...x.responsibilities,...x.qualifications,...x.preferred].join(' '),excerpt:x.excerpt})),
 ...site.jobs.map(x=>({title:x.title,href:'/careers/'+x.slug,type:'Career',text:x.sections.map(y=>y.paragraphs.join(' ')).join(' '),excerpt:x.excerpt})),
 ...resources.map(x=>({title:x.title,href:'/resources/'+x.slug,type:'Resource',text:plain(x.html),excerpt:x.excerpt}))
];}

export const homeServices = [
 {name:'Clinical performance studies',label:'Clinical study services',description:'HMC supports clinical performance studies for medical devices and in vitro diagnostics (IVD).',href:'/services/clinical-study',icon:'activity'},
 {name:'FDA and EU submissions',label:'Regulatory submission support',description:'HMC supports clients preparing FDA 510(k), EUA and European IVDR submissions.',href:'/services/regulatory-submission',icon:'shield'},
 {name:'Quality and compliance systems',label:'Quality system services',description:'HMC supports quality system documentation and compliance work for medical technology companies.',href:'/services/quality-system',icon:'microscope'},
 {name:'Laboratory support through partners',label:'Laboratory service arrangements',description:'Laboratory support is coordinated through associated businesses and partners, with the provider and scope confirmed for each engagement.',href:'/services/laboratory-services',icon:'flask'},
];
