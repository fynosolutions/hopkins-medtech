"""Restore original content from the reviewed audit, preserving new content exactly.

Reads the pre-repair snapshot for repeatability. Never runs the initial importer.
"""
import copy,csv,hashlib,html,json,pathlib,re,shutil,urllib.parse,unicodedata
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1];QA=ROOT/'qa/content-repair';BEFORE=QA/'before';AUDIT=ROOT/'qa/content-audit'
def read(path):return json.loads(path.read_text(encoding='utf-8'))
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def norm(t):return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',t).lower())
def txt(el):return re.sub(r'\s+',' ',el.get_text(' ',strip=True)).strip() if el else ''
def key(u):
 p=urllib.parse.urlsplit(u);return p.path.lower()+'?'+urllib.parse.urlencode(sorted((k.lower(),v) for k,v in urllib.parse.parse_qsl(p.query) if k.lower() in ['classid','id']))
site=read(BEFORE/'content/site.json');manifest=read(BEFORE/'content-manifest.json');assets=read(BEFORE/'asset-manifest.json');redirects=read(BEFORE/'redirect-map.json');audit=read(AUDIT/'coverage.json');extra=read(AUDIT/'extra-resources.json');extraCoverage=read(AUDIT/'extra-coverage.json')
oldRedirects={key(x['sourceUrl']):x['targetRoute'] for x in redirects}
rawExtra={int(urllib.parse.parse_qs(urllib.parse.urlsplit(x['sourceUrl']).query)['ID'][0]):x for x in extra['extraArticles']}
extraChecks={int(urllib.parse.parse_qs(urllib.parse.urlsplit(x['sourceUrl']).query)['ID'][0]):x for x in extraCoverage['pages']}
for a in extraCoverage['assets']:
 if not a.get('width'):continue
 dest=ROOT/'public/media'/pathlib.Path(a['file']).name;shutil.copy2(ROOT/a['file'],dest)
 assets.append({**a,'localPath':'/media/'+dest.name,'originalFilename':urllib.parse.urlsplit(a['sourceUrl']).path.split('/')[-1],'status':'captured','pageIds':[],'usage':'Original website archive and restored brand imagery'})
images=[x for x in assets if x.get('width') and x.get('mimeType','').startswith('image/')]
media={a['sourceUrl']:a.get('optimizedPath') or a['localPath'] for a in images}
for a in images:
 if 'optimizedPath' in a and not (ROOT/'public'/a['optimizedPath'].lstrip('/')).exists():media[a['sourceUrl']]=a['localPath']
imageById={x['id']:x for x in audit['images']}
def img(n):
 a=imageById[f'IMG-{n:03d}'];return media[a['sourceUrl']]
extraOverrides={1:'/archive/records/news-1',29:'/services/disciplines/clinical',30:'/services/disciplines/regulatory',32:'/services/disciplines/post-market',47:'/archive/records/news-47',94:'/contact',112:'/resources#original-resources',130:'/services/otc-drug',131:'/services/clinical-study',132:'/services/medical-device-510k',133:'/services/eua-application',134:'/about#approach',135:'/about#approach',136:'/about#approach',137:'/about#client-perspectives',138:'/about#client-perspectives'}
for rid,p in rawExtra.items():
 choices=extraChecks[rid]['matchedRoutes']
 def rank(u):return (0 if u.startswith('/about/team/') else 1 if u.startswith('/services/') else 2 if u.startswith('/industries/') else 3,len(u))
 target=extraOverrides.get(rid) or (sorted(choices,key=rank)[0] if choices else '/archive/records/news-'+str(rid))
 redirects.append({'id':f'NEWS-{rid}','sourceUrl':p['sourceUrl'],'targetRoute':target})
destinations={key(x['sourceUrl']):x['targetRoute'] for x in redirects}
def clean(fragment,url):
 s=BeautifulSoup(str(fragment or ''),'html.parser')
 for n in s.select('script,style,noscript,iframe,object,embed,link,meta'):n.decompose()
 for n in list(s.find_all(True)):
  old=dict(n.attrs);n.attrs={}
  if n.name=='h1':n.name='h2'
  if n.name in ['input','button','textarea']:
   label=old.get('placeholder') or old.get('value') or n.get_text(' ',strip=True)
   if old.get('type')=='hidden' or not label:n.decompose();continue
   n.name='span';n.string=label
  if n.name=='select':n.name='ul'
  if n.name=='option':n.name='li'
  if n.name not in ['p','a','ul','ol','li','h2','h3','h4','strong','b','em','i','br','hr','img','table','thead','tbody','tr','td','th','blockquote','span']:
   n.unwrap();continue
  if n.name=='a':
   href=old.get('href','');u=urllib.parse.urljoin(url,href)
   if href=='#' and 'preclinical' in txt(n).lower():n['href']='/services/preclinical-research'
   elif href in ['','#'] or href.startswith('javascript:'):n.unwrap()
   elif urllib.parse.urlsplit(u).hostname in ['hopkinsmedtech.com','www.hopkinsmedtech.com'] and key(u) in destinations:n['href']=destinations[key(u)]
   elif u.startswith(('https:','http:','mailto:','tel:')):n['href']=u;n['rel']='noopener noreferrer';n['target']='_blank'
   else:n.unwrap()
  elif n.name=='img':
   u=urllib.parse.urljoin(url,old.get('src',''))
   if u not in media:n.decompose();continue
   a=next(x for x in images if x['sourceUrl']==u);n['src']=media[u];n['alt']=old.get('alt') or 'Image from the original HMC website';n['width']=a['width'];n['height']=a['height'];n['loading']='lazy'
 for n in list(s.select('p')):
  if not txt(n) and not n.select('img'):n.decompose()
 for n in s.select('li'):
  if n.parent.name not in ['ul','ol']:n.name='div'
 return str(s)

# Use the complete, legible source versions for existing service descriptions.
sectionMap={29:{'Project Management':'project-management','Clinical Operation':'clinical-operations','Data Management':'data-management','Biostatics':'biostatistics','Quality Assurance':'quality-assurance'},30:{'Regulatory Strategy':'regulatory-strategy','Regulatory Submission':'regulatory-submission','FDA':'fda-regulatory-consulting','IVDR':'ivdr'},32:{'Post Market Compliance':'post-market-compliance','Post Market Surveillance':'post-market-surveillance'}}
serviceChanges=[]
for rid,headings in sectionMap.items():
 p=rawExtra[rid];s=BeautifulSoup(p['bodyHtml'],'html.parser')
 for h in s.select('h2'):
  slug=headings.get(txt(h))
  if not slug:continue
  nodes=[]
  for node in h.next_siblings:
   if getattr(node,'name',None)=='h2':break
   nodes.append(str(node))
  body=clean(''.join(nodes),p['sourceUrl']);item=next(x for x in site['services'] if x['slug']==slug)
  if norm(txt(BeautifulSoup(body,'html.parser')))!=norm(txt(BeautifulSoup(item['html'],'html.parser'))):
   item['html']=body;item['restoredFrom']=p['sourceUrl'];serviceChanges.append({'route':item['route'],'cleanSource':p['sourceUrl'],'originalRecord':'/archive/records/'+item['id'].lower()})
  item['originalRecord']='/archive/records/'+item['id'].lower()
for industry in site['industries']:
 s=BeautifulSoup((AUDIT/'source-live'/(industry['id']+'.html')).read_text(encoding='utf-8'),'html.parser')
 industry['lifecycleTitle']=txt(s.select_one('.regulatory dt'))
 for section in industry['sections']:
  if section['title']=='Preclinical Research':
   ss=BeautifulSoup(section['html'],'html.parser')
   for a in ss.select('a'):a['href']='/services/preclinical-research';a.attrs.pop('target',None);a.attrs.pop('rel',None)
   section['html']=str(ss)

resourcePage=BeautifulSoup((AUDIT/'source-live/HMC-04.html').read_text(encoding='utf-8'),'html.parser')
for resource in site['historical']:
 source=BeautifulSoup((AUDIT/'source-live'/(resource['id']+'.html')).read_text(encoding='utf-8'),'html.parser')
 match=next(a for a in resourcePage.select('.newadd .ul a[href]') if key(urllib.parse.urljoin('http://www.hopkinsmedtech.com/',a['href']))==key(resource['sourceUrl']))
 resource['originalThumbnail']=media[urllib.parse.urljoin(resource['sourceUrl'],match.img['src'])]
 resource['originalTitle']=txt(match.select_one('h3'))
 resource['originalExcerpt']=txt(match.select_one('span'))
 resource['legacyTopics']={'historical-cbd-otc':['CBD'],'historical-intended-use-validation':['Medical Devices'],'historical-sterile-device-510k':['Medical Devices']}.get(resource['slug'],[])
 resource['legacyType']='Blogs' if resource['author']!='Hopkins MedTech Group' else 'Historical Recruitment'
 adjacent=[]
 for a in source.select('.update_detail_bot a[href]'):
  u=urllib.parse.urljoin(resource['sourceUrl'],a['href'])
  if a['href']=='#':continue
  adjacent.append({'direction':'Previous' if 'prev' in a.get('class',[]) else 'Next','title':txt(a).split('：',1)[-1],'href':destinations[key(u)]})
 resource['adjacent']=adjacent

nav=audit['navigationLeaves'];disciplines=[]
for group in ['Technology','Clinical','Regulatory','Marketing','Post-Market']:
 slug=group.lower();rid={'Technology':28,'Clinical':29,'Regulatory':30,'Marketing':31,'Post-Market':32}[group]
 body=clean(rawExtra[rid]['bodyHtml'],rawExtra[rid]['sourceUrl'])
 disciplines.append({'title':group,'slug':slug,'route':'/services/disciplines/'+slug,'html':body,'sourceUrl':rawExtra[rid]['sourceUrl'],'links':[{'title':x['leafLabel'],'href':x['targetRoute']} for x in nav if x['mainModule']=='SERVICES' and x['subGroup']==group]})
home=BeautifulSoup((AUDIT/'source-live/HMC-01.html').read_text(encoding='utf-8'),'html.parser');contact=BeautifulSoup((AUDIT/'source-live/HMC-03.html').read_text(encoding='utf-8'),'html.parser')
legacy={'disciplines':disciplines,'projects':[{'title':x['leafLabel'],'href':x['targetRoute']} for x in nav if x['mainModule']=='PROJECTS'],'navigation':nav,'topics':[txt(x) for x in resourcePage.select('#NewsZidingyi select')[0].select('option')[1:]],'types':[txt(x) for x in resourcePage.select('#NewsZidingyi select')[1].select('option')[1:]],'contact':{'title':txt(contact.select_one('.update_contact_tit h2')),'description':txt(contact.select_one('.update_contact_tit h3')),'address':'5 Penn Plaza, 19th Floor, New York, New York, 10001, United States of America'},'resourceDescription':txt(resourcePage.select('.tit3 span')[0]),'ctaText':txt(home.select_one('.con3 h3')),'photos':{'home':[img(x) for x in [10,11,12]],'nav':{'Industries':img(2),'Services':img(3),'Projects':img(4),'Resources':img(5),'About':img(6)},'contact':img(23),'resources':img(27),'team':img(62),'cta':img(16),'ctaPattern':img(68),'publisherPattern':img(67),'brand':media['http://www.hopkinsmedtech.com/upload/img/20220218165456.jpg']},'icons':{'phone':img(24),'address':img(25),'email':img(26)},'historicalCards':[{k:r[k] for k in ['slug','title','originalTitle','originalExcerpt','originalThumbnail','legacyTopics','legacyType','year']} for r in site['historical']]}

# Build browseable source records, not hidden JSON or a file-only archive.
records=[]
for p in manifest:
 if not p['id'].startswith('HMC-'):continue
 path=AUDIT/'source-live'/(p['id']+'.html');s=BeautifulSoup(path.read_text(encoding='utf-8'),'html.parser');route=p['targetRoute'];parts=[]
 if route=='/':parts=[s.select_one(sel) for sel in ['.banner','.con','.con2','.con3','.con4','.con5']]
 elif route=='/contact':parts=[s.select_one('.insidebanner'),s.select_one('#ContactZidingyi')]
 elif route=='/resources':parts=[s.select_one('.insidebanner'),s.select_one('#NewsZidingyi')]
 elif s.select_one('.regulatory'):parts=[s.select_one('.insidebanner'),s.select_one('.regulatory')]
 else:parts=[s.select_one('.insidebanner'),s.select_one('#lContent,#lblContent'),s.select_one('.update_detail_bot')]
 parts.append(s.select_one('.foot'))
 body=''.join(clean(x,p['sourceUrl']) for x in parts if x)
 title=p['title'].removesuffix('-Hopkins MedTech Compliance').strip() or 'Original page'
 if title=='HMC':title='Original homepage'
 dates=txt(s.select_one('#lblPutdate'))
 records.append({'id':p['id'].lower(),'title':title,'sourceTitle':p['title'],'sourceUrl':p['sourceUrl'],'sourceDate':dates or None,'route':'/archive/records/'+p['id'].lower(),'currentRoutes':[route],'html':body,'category':'Resources' if route.startswith('/resources') else 'People' if route.startswith('/about/team') else 'Industries' if route.startswith('/industries') else 'Services' if route.startswith('/services') else 'Company','sourceText':p['originalText'],'additionalText':[]})
for rid,p in sorted(rawExtra.items()):
 s=BeautifulSoup((ROOT/p['file']).read_text(encoding='utf-8'),'html.parser');body=clean(p['bodyHtml'],p['sourceUrl']);title=p['title'].removesuffix('-Hopkins MedTech Compliance').strip()
 title=BeautifulSoup(title,'html.parser').get_text(' ',strip=True)
 if not title:
  current=destinations[key(p['sourceUrl'])].split('#')[0];item=next((x for x in site['services']+site['industries'] if x['route']==current),None)
  title=item['title'] if item else {1:'Projects overview',29:'Clinical services',30:'Regulatory services',32:'Post-market services',47:'Original test record',94:'Original contact record'}.get(rid,'Original website record '+str(rid))
 date=txt(s.select_one('#lblPutdate'))
 records.append({'id':'news-'+str(rid),'title':title,'sourceTitle':p['title'],'sourceUrl':p['sourceUrl'],'sourceDate':date or None,'route':'/archive/records/news-'+str(rid),'currentRoutes':[destinations[key(p['sourceUrl'])]] if destinations[key(p['sourceUrl'])]!='/archive/records/news-'+str(rid) else [],'html':body,'category':'Test record' if rid==47 else 'Component records' if not p['body'] else 'Extended records','sourceText':p['body'],'additionalText':[]})
# Preserve source strings, including date/label fragments outside main content.
navigationText=' '.join(x['mainModule']+' '+x['subGroup']+' '+x['leafLabel'] for x in nav)
for record in records:
 rid=record['id'];file=AUDIT/'source-live'/(rid.upper()+'.html') if rid.startswith('hmc-') else ROOT/rawExtra[int(rid[5:])]['file']
 s=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
 for el in s.select('script,style,noscript'):el.decompose()
 covered=norm(txt(BeautifulSoup(record['html'],'html.parser'))+' '+navigationText+' '+record['title']+' '+(record['sourceDate'] or ''));seen=set()
 for t in s.body.stripped_strings:
  n=norm(t)
  if not n or n in covered or n in seen:continue
  record['additionalText'].append(re.sub(r'\s+',' ',t).strip());seen.add(n)
 record['excerpt']=txt(BeautifulSoup(record['html'],'html.parser'))[:180] or record['title']

unique=[];hashes=set()
imageNames={1:'Hopkins MedTech Compliance logo',2:'Industries navigation artwork',3:'Services navigation artwork',4:'Projects navigation artwork',5:'Resources navigation artwork',6:'About navigation artwork',7:'Original search icon',8:'Original close icon',9:'Original menu icon',13:'Client First value icon',14:'A Holistic Approach value icon',15:'Partnership value icon',16:'Contact the Hopkins MedTech team',17:'Determining the Right Regulatory Pathway for your Drug',18:'510k Submissions for Sterile Devices',19:'The FDA, CBD, and OTC Drugs',20:'Intended Use Validation',23:'Contact page banner',24:'Original phone icon',25:'Original address icon',26:'Original email icon',27:'Resource center banner',28:'5 Reasons Why Internal Auditing is Important',29:'Join Us — original recruitment image',31:'Original resource article illustration',34:'Our Company — original website image',62:'Our Team — original website banner',63:'Internal auditing — original article illustration',67:'Original EMMA International article artwork',68:'Original contact section background',69:'Original publication date icon',70:'Original article view icon',71:'Original author icon',72:'Original location icon',73:'Original telephone icon',74:'Original WeChat icon',75:'Original email icon',76:'Original website icon',77:'Original phone graphic',78:'Original contact phone graphic',79:'Original home icon',80:'Original breadcrumb arrow',81:'Original resource search icon'}
for a in images:
 if a['sha256'] in hashes:continue
 hashes.add(a['sha256']);old=next((x for x in audit['images'] if x['sha256']==a['sha256']),None)
 label=old['id'] if old else 'IMG-'+str(82+next(i for i,x in enumerate(extraCoverage['assets']) if x['sha256']==a['sha256'])).zfill(3)
 category='Interface icons' if max(a['width'],a['height'])<70 else 'Brand and page imagery'
 if label in ['IMG-082','IMG-083']:category='Test and placeholder images'
 sourceUrls=[x['sourceUrl'] for x in images if x['sha256']==a['sha256']]
 matchingPage=next((x for x in site['services']+site['industries'] if x['image']==media[a['sourceUrl']]),None)
 fallback=matchingPage['title']+' — original website image' if matchingPage else 'Original HMC website artwork'
 title=imageNames.get(int(label[4:]),fallback)
 title={'IMG-082':'Apple illustration from an original test record','IMG-083':'Original no-image placeholder','IMG-084':'CRO for IVD and MedTech Innovations — original brand banner','IMG-010':'CRO for IVD and MedTech Innovations — clinical research','IMG-011':'CRO for IVD and MedTech Innovations — laboratory work','IMG-012':'CRO for IVD and MedTech Innovations — microscopy'}.get(label,title)
 unique.append({'id':label.lower(),'src':media[a['sourceUrl']],'original':a['localPath'],'sourceUrls':sourceUrls,'width':a['width'],'height':a['height'],'sha256':a['sha256'],'category':category,'title':title})

write(ROOT/'content/site.json',site);write(ROOT/'content/legacy-ui.json',legacy);write(ROOT/'content/archive.json',{'records':records,'images':unique,'navigation':nav,'capturedOn':'2026-10-08'});write(ROOT/'redirect-map.json',redirects)
write(QA/'service-restoration.json',serviceChanges)
# Keep the original manifests intact, and publish a new, explicit completion map.
rows=[{'sourceUrl':x['sourceUrl'],'targetRoute':x['targetRoute'],'originalRecord':next((r['route'] for r in records if r['sourceUrl']==x['sourceUrl']),'/archive/records/hmc-01')} for x in redirects]
with (QA/'restored-page-map.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=['sourceUrl','targetRoute','originalRecord']);w.writeheader();w.writerows(rows)
assert len(records)==138 and len(unique)==76 and len(redirects)==138
print(json.dumps({'archiveRecords':len(records),'uniqueImages':len(unique),'mappedOldAddresses':len(redirects),'serviceBodiesRestoredFromCleanSource':len(serviceChanges),'protectedNewContent':'unchanged'},indent=2))
