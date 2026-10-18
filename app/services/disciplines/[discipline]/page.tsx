import {site} from '@/lib/content';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import legacy from '@/content/legacy-ui.json';
import {PageHero,Breadcrumb,ContactCTA,Note} from '@/components/ui';
type Props={params:Promise<{discipline:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return legacy.disciplines.map(x=>({discipline:x.slug}))}
export async function generateMetadata({params}:Props){const {discipline}=await params;const item=legacy.disciplines.find(x=>x.slug===discipline);return {title:item?.title+' Services',description:item?`Hopkins MedTech ${item.title} services: ${item.links.map(x=>x.title).join(', ')}.`:undefined,alternates:{canonical:item?.route}}}
export default async function Discipline({params}:Props){const {discipline}=await params;const item=legacy.disciplines.find(x=>x.slug===discipline);if(!item)notFound();return <><PageHero eyebrow="SERVICES BY DISCIPLINE" title={item.title} description="Read the service scope and follow the links for details."/><div className="container"><Breadcrumb items={[{label:'Services',href:'/services'},{label:item.title}]}/><div className="detail-grid"><article className="detail-main"><Note>The service links follow the original HMC directory. Discuss the applicable requirements and scope for your project.</Note><div className="prose">{item.links.map(link=><section key={link.href}><h2><Link href={link.href}>{link.title}</Link></h2><p>{site.services.find(service=>service.route===link.href)?.excerpt}</p></section>)}</div><p className="source-link">Original source: <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">HMC service overview ↗</a></p></article><aside className="detail-sidebar"><div className="side-links"><h2>Explore {item.title}</h2>{item.links.map(x=><Link href={x.href} key={x.href}>{x.title} ↗</Link>)}</div><Link className="button" href="/contact">Contact us ↗</Link></aside></div></div><ContactCTA/></>}
