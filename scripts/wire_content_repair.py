"""Apply additive presentation changes to the saved pre-repair source."""
import json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1];BEFORE=ROOT/'qa/content-repair/before'
def original(path):return (BEFORE/path).read_text(encoding='utf-8')
def save(path,text):(ROOT/path).write_text(text,encoding='utf-8')
def replace(text,old,new):
 assert old in text,old[:100]
 return text.replace(old,new)
archive=json.loads((ROOT/'content/archive.json').read_text(encoding='utf-8'));legacy=json.loads((ROOT/'content/legacy-ui.json').read_text(encoding='utf-8'))
routes=['/archive','/archive/media','/services/projects']+[x['route'] for x in archive['records']]+[x['route'] for x in legacy['disciplines']]
save('content/original-routes.json',json.dumps(routes,indent=2))

s=original('lib/content.ts');s="import originalRoutes from '@/content/original-routes.json';\n"+s
s=replace(s,"return ['/', '/about'","return [...originalRoutes,'/', '/about'")
save('lib/content.ts',s)
s=original('app/layout.tsx');s=replace(s,"import './motion.css';","import './motion.css';\nimport './legacy.css';");save('app/layout.tsx',s)
s=original('app/page.tsx');s="import {OriginalBrandGallery} from '@/components/legacy-interactive';\n"+s
s=replace(s,'<section className="section services-section">','<OriginalBrandGallery/><section className="section services-section">');save('app/page.tsx',s)

s=original('components/ui.tsx');s="import legacy from '@/content/legacy-ui.json';\n"+s
s=replace(s,'<Button href="/contact" light>Let’s talk</Button>','<Button href="/contact" light>Let’s talk</Button><div className="legacy-cta-content" style={{backgroundImage:`linear-gradient(#123f38e8,#123f38e8),url(${legacy.photos.ctaPattern})`,backgroundSize:"cover"}}><img src={legacy.photos.cta} alt="Contact the Hopkins MedTech team" width="420" height="270" loading="lazy"/><div><p>{legacy.ctaText}</p><Link href="/contact">CONTACT US</Link><Link href="/contact">CHAT WITH US</Link></div></div>')
s=replace(s,'{title:string,slug:string,excerpt:string,type:string,topic:string,year:string|null},index?:number}','{title:string,slug:string,excerpt:string,type:string,topic:string,year:string|null,originalThumbnail?:string},index?:number}')
s=replace(s,'<ResourceArt topic={item.topic} index={index}/>','{item.type===\'Historical Resources\'&&item.originalThumbnail?<img className="resource-original-photo" src={item.originalThumbnail} alt="" width="554" height="377" loading="lazy"/>:<ResourceArt topic={item.topic} index={index}/>}')
save('components/ui.tsx',s)

s=original('components/header.tsx');s=replace(s,"'use client';","'use client';\nimport legacy from '@/content/legacy-ui.json';")
s=replace(s,'<div className="nav-dropdown"><span','<div className="nav-dropdown"><img className="nav-original-image" src={legacy.photos.nav[n.label as "Services"|"Industries"|"About"]} alt="" width="556" height="210"/><span')
s=replace(s,'<Link className="dropdown-all" href={n.href}>','{n.label===\'Services\'&&<><Link className="nav-extra-link" href="/services#by-discipline">Services by discipline<ArrowUpRight size={16}/></Link><Link href="/services/projects">Projects<ArrowUpRight size={16}/></Link></>}<Link className="dropdown-all" href={n.href}>')
save('components/header.tsx',s)
s=original('components/footer.tsx');s=replace(s,'<Link href="/resources">Resources</Link>','<Link href="/resources">Resources</Link><Link href="/services/projects">Projects</Link><Link href="/archive">Original website archive</Link>');save('components/footer.tsx',s)

s=original('app/[...slug]/page.tsx');s="import legacy from '@/content/legacy-ui.json';\nimport {OriginalBanner,OriginalContactIntroduction,OriginalContactDetails,OriginalServiceDirectory,OriginalResourceIntroduction,ArchiveLink} from '@/components/legacy';\nimport {OriginalResourceLibrary} from '@/components/legacy-interactive';\n"+s
s=replace(s,"filter(x=>x!=='/'&&x!=='/search')","filter(x=>x!=='/'&&x!=='/search'&&!x.startsWith('/archive')&&!x.startsWith('/services/disciplines/')&&x!=='/services/projects')")
s=replace(s,'function Services(){','function Services(){')
old='</section>)}</div></div><ContactCTA/></>}';new='</section>)}</div></div><OriginalServiceDirectory/><ContactCTA/></>}'
s=replace(s,old,new)
s=replace(s,'<p className="source-link">Service information preserved from the <a href={item.sourceUrl}', '<p className="source-link">Service information preserved from the <a href={(item as {restoredFrom?:string}).restoredFrom||item.sourceUrl}')
s=replace(s,'original source ↗</a>.</p></article><Sidebar','original source ↗</a>.</p>{item.id.startsWith("HMC-")&&<ArchiveLink record={"/archive/records/"+item.id.toLowerCase()}/>}</article><Sidebar')
s=replace(s,'<div className="prose"><h2>The product lifecycle</h2></div>','<div className="prose"><p className="eyebrow">{item.lifecycleTitle}</p><h2>The product lifecycle</h2></div>')
s=replace(s,'<section className="section"><SectionHeading eyebrow="HOW WE PARTNER"','<section className="section" id="approach"><SectionHeading eyebrow="HOW WE PARTNER"')
s=replace(s,'around your next challenge."/><section className="container section"><div className="team-grid">','around your next challenge."/><OriginalBanner kind="team"/><section className="container section"><div className="team-grid">')
s=replace(s,'alongside the original HMC resource archive."/><section className="container section"><ResourceList/></section><ContactCTA/>','alongside the original HMC resource archive."/><OriginalBanner kind="resources"/><section className="container section"><ResourceList/></section><section className="container section original-resource-section" id="original-resources"><OriginalResourceIntroduction/><OriginalResourceLibrary/></section><ContactCTA/>')
s=replace(s,'additionalSources?:{label:string,url:string}[]};','additionalSources?:{label:string,url:string}[];originalThumbnail?:string;adjacent?:{direction:string;title:string;href:string}[]};')
s=replace(s,'<ResourceArt topic={r.topic} index={historical?2:0}/>','{historical&&r.originalThumbnail?<img className="resource-original-photo" src={r.originalThumbnail} alt={r.title} width="554" height="377"/>:<ResourceArt topic={r.topic} index={0}/>}')
s=replace(s,'<div className="sources-box"><h2>Sources & further reading</h2>','{historical&&r.adjacent&&<nav className="original-article-nav" aria-label="Original article sequence">{r.adjacent.map(x=><Link href={x.href} key={x.direction}><span>{x.direction}</span>{x.title}</Link>)}</nav>}<div className="sources-box"><h2>Sources & further reading</h2>{historical&&r.sourceOrganization===\'EMMA International\'&&<img className="publisher-pattern" src={legacy.photos.publisherPattern} alt="Original EMMA International article artwork" width="3000" height="701" loading="lazy"/>}')
s=replace(s,'the questions on your mind."/><section className="container section contact-layout">','the questions on your mind."/><OriginalBanner kind="contact"/><OriginalContactIntroduction/><section className="container section contact-layout">')
s=replace(s,'<Note>For internship opportunities, please follow the','<OriginalContactDetails/><Note>For internship opportunities, please follow the')
save('app/[...slug]/page.tsx',s)

# Preserve current search results and provide a separate searchable source collection.
s=original('app/search/page.tsx');s="import {originalSearchRecords} from '@/lib/archive';\n"+s
s=replace(s,":[];return <>",":[];const originals=terms.length?originalSearchRecords().filter(x=>terms.every(t=>(x.title+' '+x.text).toLowerCase().includes(t))):[];return <>")
s=replace(s,'</section></>}','{q&&<details className="original-search-results"><summary>{originals.length} original website records</summary><p className="muted">Historical source material, including original versions and component records.</p>{originals.map(x=><article className="search-result" key={x.href}><span>{x.type}</span><h2><Link href={x.href}>{x.title} ↗</Link></h2><p>{x.excerpt}</p></article>)}<Link className="text-link" href="/archive">Browse the complete original collection ↗</Link></details>}</section></>}')
save('app/search/page.tsx',s)

# Keep the existing subject choices and also restore the original free-text theme field.
s=original('components/forms.tsx')
s=replace(s,"const d=Object.fromEntries(new FormData(form));if", "const d=Object.fromEntries(new FormData(form));if(String(d.theme||'').trim())d.subject=String(d.theme).trim();delete d.theme;if")
s=replace(s,'<label>Your name <span>*</span>','<label>Your theme <small>(optional)</small><input name="theme" maxLength={150} placeholder="Add a specific subject for your inquiry"/></label>\n <label>Your name <span>*</span>')
save('components/forms.tsx',s)
print('Presentation wiring applied; existing new content and motion components retained.')
