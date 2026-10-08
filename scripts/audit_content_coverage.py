"""Read-only audit of actual old/new page HTML and source image usage.
Does not change application content or deploy anything.
"""
import concurrent.futures, csv, hashlib, json, os, pathlib, re, unicodedata, urllib.parse
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'qa/content-audit';OUT.mkdir(parents=True,exist_ok=True)
for d in ['source-live','new-live','additional-assets']: (OUT/d).mkdir(exist_ok=True)
OLD='http://www.hopkinsmedtech.com';NEW='https://hopkins-medtech.vercel.app'
manifest=json.loads((ROOT/'content-manifest.json').read_text(encoding='utf-8'))
assets=json.loads((ROOT/'asset-manifest.json').read_text(encoding='utf-8'))
site=json.loads((ROOT/'content/site.json').read_text(encoding='utf-8'))
redirects=json.loads((ROOT/'redirect-map.json').read_text(encoding='utf-8'))
def text(el):return re.sub(r'\s+',' ',el.get_text(' ',strip=True)).strip() if el else ''
def norm(s):return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',s).lower())
def key(url):
 u=urllib.parse.urlsplit(url);return (u.path or '/').lower()+('?' +u.query.lower() if u.query else '')
mapping={key(x['sourceUrl']):x['targetRoute'] for x in redirects}
def get(item):
 try:
  path=OUT/item['file']
  if os.environ.get('AUDIT_USE_CACHE')=='1' and path.exists():
   return {**item,'status':200,'html':path.read_text(encoding='utf-8'),'file':str(path.relative_to(ROOT))}
  r=requests.get(item['url'],timeout=25);r.raise_for_status()
  path=OUT/item['file'];path.write_bytes(r.content)
  return {**item,'status':r.status_code,'html':r.content.decode('utf-8','replace'),'file':str(path.relative_to(ROOT))}
 except Exception as e:return {**item,'status':'failed','error':str(e)}
def batch(items):
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:return list(ex.map(get,items))
old=batch([{'id':p['id'],'url':p['sourceUrl'],'route':p.get('targetRoute') or '/','file':'source-live/'+p['id']+'.html'} for p in manifest])
seen={key(x['url']) for x in old};discovered=[]
for cycle in range(3):
 more={}
 for p in old:
  if not p.get('html'):continue
  for a in BeautifulSoup(p['html'],'html.parser').select('a[href]'):
   u=urllib.parse.urljoin(p['url'],a['href']);parts=urllib.parse.urlsplit(u);u=urllib.parse.urlunsplit((*parts[:4],''))
   if parts.hostname in ['www.hopkinsmedtech.com','hopkinsmedtech.com'] and (parts.path.lower().endswith('.aspx') or parts.path in ['/','']) and '/check/' not in parts.path.lower() and key(u) not in seen:
    id='discovered-'+hashlib.sha256(u.encode()).hexdigest()[:10];more[key(u)]={'id':id,'url':u,'route':mapping.get(key(u)),'file':'source-live/'+id+'.html'}
 if not more:break
 got=batch(list(more.values()));old+=got;discovered+=got;seen.update(more)
print('Old pages fetched:',sum(x['status']==200 for x in old),'/',len(old),'newly discovered:',len(discovered),flush=True)

paths=['/','/services','/industries','/about','/about/team','/resources','/careers','/contact','/privacy']+[x['route'] for x in site['services']+site['industries']]+['/about/team/'+x['slug'] for x in site['team']]+['/careers/'+x['slug'] for x in site['jobs']]+['/resources/'+x['slug'] for x in site['historical']]
for f in ['research','insights']:paths+=['/resources/'+x['slug'] for x in json.loads((ROOT/'content'/(f+'.json')).read_text(encoding='utf-8'))]
new=batch([{'route':p,'url':NEW+p,'file':'new-live/'+('home' if p=='/' else p.strip('/').replace('/','__'))+'.html'} for p in sorted(set(paths))])
print('New pages fetched:',sum(x['status']==200 for x in new),'/',len(new),flush=True)
newtext={};newfull={};newimages={};styles=set()
for p in new:
 if not p.get('html'):continue
 s=BeautifulSoup(p['html'],'html.parser')
 for n in s.select('script,style,noscript,[aria-hidden="true"],.sr-only'):n.decompose()
 newtext[p['route']]=norm(text(s.select_one('main')));newfull[p['route']]=norm(text(s))
 original=BeautifulSoup(p['html'],'html.parser')
 for el in original.select('img[src],source[src],source[srcset]'):
  urls=[el.get('src','')]+[x.strip().split()[0] for x in el.get('srcset','').split(',') if x.strip()]
  for u in urls:
   if not u:continue
   full=urllib.parse.urljoin(NEW,u);parsed=urllib.parse.urlsplit(full);path=parsed.path
   if path=='/_next/image':path=urllib.parse.parse_qs(parsed.query).get('url',[''])[0]
   newimages.setdefault(path,set()).add(p['route'])
 for link in original.select('link[rel="stylesheet"][href]'):styles.add(urllib.parse.urljoin(NEW,link['href']))
 for el in original.select('[style]'):
  for u in re.findall(r'url\([\'\"]?([^\)\'\"]+)',el['style']):newimages.setdefault(urllib.parse.urlsplit(urllib.parse.urljoin(NEW,u)).path,set()).add(p['route'])
for cssurl in styles:
 try:
  css=requests.get(cssurl,timeout=15).text
  for u in re.findall(r'url\([\'\"]?([^\)\'\"]+)',css):
   if re.search(r'\.(png|jpg|jpeg|gif|webp|svg)(\?|$)',u,re.I):newimages.setdefault(urllib.parse.urlsplit(urllib.parse.urljoin(cssurl,u)).path,set()).add('(loaded CSS)')
 except Exception:pass

def blocks(el):
 if not el:return []
 s=BeautifulSoup(str(el),'html.parser')
 for n in s.select('script,style,noscript,input,button,select'):n.decompose()
 result=[]
 # Tag-independent lines also cover text outside paragraph tags.
 for line in s.get_text('\n',strip=True).splitlines():
  line=re.sub(r'\s+',' ',line).strip()
  if len(norm(line))>=15 and line not in result:result.append(line)
 return result

details=[];allblocks=[];modules=[]
for p in old:
 if not p.get('html'):continue
 s=BeautifulSoup(p['html'],'html.parser');route=p.get('route');parts=[]
 if p['id'] in ['HMC-01','HMC-09','2ef220fb30']:
  for selector,name in [('.con','Home service shortcuts'),('.con2','Company advantages'),('.con3','Contact CTA'),('.con4','Resource recommendations'),('.con5','Testimonials')]:parts.append((name,s.select_one(selector)))
 elif route=='/contact':parts.append(('Contact page',s.select_one('#ContactZidingyi')))
 elif route=='/resources':parts.append(('Resources index and filters',s.select_one('#NewsZidingyi')))
 elif route=='/about/team':
  for dd in s.select('.regulatory dd'):parts.append((text(dd.select_one('h3')),dd))
 else:
  parts.append(('Main body',s.select_one('#lContent,#lblContent')))
  for dd in s.select('.regulatory dd'):
   title=text(dd.select_one('h3'));parts.append((title,dd));modules.append({'sourceId':p['id'],'sourceUrl':p['url'],'module':title,'targetRoute':route,'headingPresent':norm(title) in newtext.get(route,'')})
 count=0;missing=[];relocated=[]
 targets=[route] if route else []
 if route=='/about/team':targets+=['/about/team/'+x['slug'] for x in site['team']]
 if route=='/':targets+=['/about']
 for section,el in parts:
  for line in blocks(el):
   n=norm(line);exact=[t for t in targets if n in newtext.get(t,'')];elsewhere=[]
   if not exact:elsewhere=[t for t,body in newtext.items() if n in body]
   state='matched-target' if exact else 'matched-elsewhere' if elsewhere else 'not-matched'
   row={'sourceId':p['id'],'sourceUrl':p['url'],'section':section,'text':line,'status':state,'matchedRoutes':exact or elsewhere};allblocks.append(row);count+=1
   if state=='not-matched':missing.append(row)
   if state=='matched-elsewhere':relocated.append(row)
 archived=next((m for m in manifest if m['id']==p['id']),None)
 archivedBody=BeautifulSoup((ROOT/archived['htmlPath']).read_text(encoding='utf-8'),'html.parser') if archived else None
 for src in [s,archivedBody]:
  if src:
   for n in src.select('script,style,noscript'):n.decompose()
 details.append({'id':p['id'],'sourceUrl':p['url'],'targetRoute':route,'sourceStatus':p['status'],'targetStatus':next((x['status'] for x in new if x['route']==route),None),'sourceTextChangedSinceArchive':norm(text(s))!=norm(text(archivedBody)) if archivedBody else None,'blockCount':count,'notMatchedCount':len(missing),'matchedElsewhereCount':len(relocated),'unmatched':missing})

# Gather picture references, including inline <style> URLs missed by the first import.
sourceImages={}
for p in old:
 if not p.get('html'):continue
 s=BeautifulSoup(p['html'],'html.parser')
 for el in s.select('img,source,[style],video[poster],link[rel="icon"],link[rel="shortcut icon"]'):
  urls=[el.get(k,'') for k in ['src','data-src','data-original','data-lazy','poster']]
  urls += [v.strip().split()[0] for v in el.get('srcset','').split(',') if v.strip()]
  if el.name=='link':urls.append(el.get('href',''))
  urls+=re.findall(r'url\([\'\"]?([^\)\'\"]+)',el.get('style',''))
  for u in urls:
   if not u or u.startswith('data:'):continue
   full=urllib.parse.urljoin(p['url'],u)
   if urllib.parse.urlsplit(full).hostname=='www.hopkinsmedtech.com':sourceImages.setdefault(full,set()).add(p['id'])
 for el in s.select('style'):
  for u in re.findall(r'url\([\'\"]?([^\)\'\"]+)',el.get_text()):sourceImages.setdefault(urllib.parse.urljoin(p['url'],u),set()).add(p['id'])
known={a.get('sourceUrl') or a.get('url'):a for a in assets}
additional=[]
for u,pages in sourceImages.items():
 if u in known:continue
 try:
  r=requests.get(u,timeout=15);r.raise_for_status();out={'sourceUrl':u,'pageIds':sorted(pages),'status':'captured','mimeType':r.headers.get('content-type'),'sha256':hashlib.sha256(r.content).hexdigest()}
  file=OUT/'additional-assets'/(hashlib.sha256(u.encode()).hexdigest()[:10]+'-'+pathlib.Path(urllib.parse.urlsplit(u).path).name);file.write_bytes(r.content);out['auditFile']=str(file.relative_to(ROOT))
  try:
   with Image.open(file) as im:out['width'],out['height']=im.size
  except Exception:pass
 except Exception as e:out={'sourceUrl':u,'pageIds':sorted(pages),'status':'failed','error':str(e)}
 additional.append(out)

images=[a for a in assets+additional if a.get('mimeType','').startswith('image/') and a.get('width')]
usedHashes=set();imageRows=[]
for i,a in enumerate(images):
 routes=set()
 for u in [a.get('localPath'),a.get('optimizedPath')]:routes.update(newimages.get(u,set()))
 if routes:usedHashes.add(a['sha256'])
 imageRows.append({'id':f'IMG-{i+1:03d}',**a,'renderedRoutes':sorted(routes),'directlyRendered':bool(routes)})
for row in imageRows:
 row['duplicateOfRendered']=not row['directlyRendered'] and row['sha256'] in usedHashes
 row['statusInNewSite']='rendered' if row['directlyRendered'] else 'same-bytes-rendered-under-another-url' if row['duplicateOfRendered'] else 'not-rendered'
summary={'oldPageRecords':len(old),'freshOld200':sum(x['status']==200 for x in old),'newPageCount':len(new),'freshNew200':sum(x['status']==200 for x in new),'newlyDiscoveredPages':len(discovered),'sourceTextChanges':sum(x['sourceTextChangedSinceArchive'] is True for x in details),'sourceTextBlocks':len(allblocks),'unmatchedTextBlocks':sum(x['status']=='not-matched' for x in allblocks),'originalImageUrls':len(images),'uniqueOriginalImageHashes':len({x['sha256'] for x in images}),'directImageUrlsUsed':sum(x['directlyRendered'] for x in imageRows),'duplicateImageUrlsCovered':sum(x['duplicateOfRendered'] for x in imageRows),'imageUrlsNotRendered':sum(x['statusInNewSite']=='not-rendered' for x in imageRows),'uniqueOriginalImagesUsed':len(usedHashes),'uniqueOriginalImagesNotRendered':len({x['sha256'] for x in images}-usedHashes),'additionalAssetReferencesFound':len(additional),'industrySubsections':len(modules),'industrySubsectionHeadingsPresent':sum(x['headingPresent'] for x in modules)}
report={'summary':summary,'pages':details,'textBlocks':allblocks,'images':imageRows,'industrySubsections':modules,'additionalAssets':additional,'freshFetchFailures':[{k:v for k,v in x.items() if k!='html'} for x in old+new if x['status']!=200],'newDiscoveredPages':[{k:v for k,v in x.items() if k!='html'} for x in discovered]}
(OUT/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
def csvout(file,rows,fields):
 with (OUT/file).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows({k:(' | '.join(str(t) for t in v) if isinstance(v,list) else v) for k,v in r.items() if k in fields} for r in rows)
csvout('text-blocks.csv',allblocks,['sourceId','sourceUrl','section','text','status','matchedRoutes'])
csvout('image-usage.csv',imageRows,['id','sourceUrl','localPath','optimizedPath','width','height','sha256','statusInNewSite','renderedRoutes','pageIds'])
csvout('page-coverage.csv',details,['id','sourceUrl','targetRoute','sourceStatus','targetStatus','sourceTextChangedSinceArchive','blockCount','notMatchedCount','matchedElsewhereCount'])
csvout('industry-subsections.csv',modules,['sourceId','sourceUrl','module','targetRoute','headingPresent'])

# Inspection sheets use the archived originals, without altering any source asset.
unused=[];hashes=set()
for x in imageRows:
 if x['statusInNewSite']=='not-rendered' and x['sha256'] not in hashes:unused.append(x);hashes.add(x['sha256'])
fontpath='C:/Windows/Fonts/arial.ttf';font=ImageFont.truetype(fontpath,15)
for offset in range(0,len(unused),12):
 chunk=unused[offset:offset+12];sheet=Image.new('RGB',(1500,4*260),'#e8eeeb');draw=ImageDraw.Draw(sheet)
 for j,x in enumerate(chunk):
  path=ROOT/x['auditFile'] if x.get('auditFile') else ROOT/'public'/x['localPath'].lstrip('/')
  with Image.open(path) as im:
   im=im.convert('RGBA');im.thumbnail((460,190));left=(j%3)*500+20;top=(j//3)*260+25
   draw.rectangle((left,top,left+460,top+190),fill='white');sheet.paste(im,(left+(460-im.width)//2,top+(190-im.height)//2),im)
   draw.text((left,top+196),x['id']+'  '+str(x['width'])+'x'+str(x['height'])+'  '+path.name[:40],font=font,fill='#153e35')
 sheet.save(OUT/f'unused-images-{offset//12+1}.jpg',quality=92)
print(json.dumps(summary,indent=2),flush=True)
