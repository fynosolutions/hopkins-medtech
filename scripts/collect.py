import re, json, hashlib, concurrent.futures, urllib.parse, pathlib, csv
import requests
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'source-archive'; ARCHIVE.mkdir(exist_ok=True)
(ROOT/'content').mkdir(exist_ok=True)
ASSETS=ROOT/'public'/'media'; ASSETS.mkdir(parents=True,exist_ok=True)
BASE='http://www.hopkinsmedtech.com'
guide=(ROOT/'HMC_Codex_Execution_Guide.txt').read_text(encoding='utf-8')
mapping=[{'id':'HMC-'+m[0],'sourceUrl':BASE+m[1], 'targetRoute':m[2]} for m in re.findall(r'^(\d{2})\s+(/\S*)\s+(/\S*)\s*$',guide,re.M)]
def fetch(item):
    url=item['sourceUrl']; name=item.get('id',hashlib.sha256(url.encode()).hexdigest()[:10])
    try:
        r=requests.get(url,timeout=30); r.raise_for_status(); raw=r.content
        html=raw.decode('utf-8','replace'); soup=BeautifulSoup(html,'html.parser')
        (ARCHIVE/(name+'.html')).write_bytes(raw)
        links=[urllib.parse.urljoin(url,a['href']) for a in soup.select('a[href]')]
        images=[]
        for el in soup.select('[src], [srcset], [style]'):
            for val in [el.get('src','')]+re.findall(r'url\([\'\"]?([^\)\'\"]+)',el.get('style','')):
                if val and not val.startswith('data:'): images.append({'url':urllib.parse.urljoin(url,val),'alt':el.get('alt',''),'tag':el.name})
            for v in el.get('srcset','').split(','):
                if v.strip(): images.append({'url':urllib.parse.urljoin(url,v.strip().split()[0]),'alt':el.get('alt',''),'tag':el.name})
        for el in soup.select('link[href]'): images.append({'url':urllib.parse.urljoin(url,el['href']),'alt':'','tag':'link'})
        for link in links:
            if re.search(r'\.(pdf|docx?|xlsx?|mp4|webm)(\?|$)',link,re.I): images.append({'url':link,'alt':'','tag':'download'})
        for el in soup.select('script,style,noscript'):el.decompose()
        text=soup.get_text('\n',strip=True)
        (ARCHIVE/(name+'.txt')).write_text(text,encoding='utf-8')
        return {**item,'id':name,'status':'captured','title':soup.title.get_text(' ',strip=True) if soup.title else '', 'originalText':text,'htmlPath':'source-archive/'+name+'.html','links':links,'media':images,'sha256':hashlib.sha256(raw).hexdigest()}
    except Exception as e: return {**item,'id':name,'status':'failed','error':str(e)}
pages=[]; seen=set(); todo=mapping
while todo and len(pages)<120:
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex: batch=list(ex.map(fetch,todo))
    pages+=batch; seen.update(x['sourceUrl'].lower() for x in todo)
    candidates={}
    for p in batch:
        for u in p.get('links',[]):
            q=urllib.parse.urlsplit(u); u=urllib.parse.urlunsplit((q.scheme,q.netloc,q.path,q.query,''))
            if q.netloc=='www.hopkinsmedtech.com' and (q.path.endswith('.aspx') or q.path in ('','/')) and '/check/' not in q.path.lower() and u.lower() not in seen:
                candidates[u]={'sourceUrl':u,'targetRoute':None}
    todo=list(candidates.values())
    print('Pages:',len(pages),'next:',len(todo),flush=True)
assets={}
for p in pages:
    for a in p.get('media',[]):
        if urllib.parse.urlsplit(a['url']).netloc!='www.hopkinsmedtech.com': continue
        if a['url'] not in assets:assets[a['url']]={**a,'pageIds':[]}
        assets[a['url']]['pageIds'].append(p['id'])
def asset(a):
    u=a['url']; name=pathlib.Path(urllib.parse.urlsplit(u).path).name
    safe=hashlib.sha256(u.encode()).hexdigest()[:8]+'-'+re.sub(r'[^a-zA-Z0-9._-]','_',name)
    try:
        r=requests.get(u,timeout=30);r.raise_for_status();(ASSETS/safe).write_bytes(r.content)
        out={**a,'sourceUrl':u,'localPath':'/media/'+safe,'originalFilename':name,'mimeType':r.headers.get('content-type',''),'sha256':hashlib.sha256(r.content).hexdigest(),'status':'captured'}
        try:
            from PIL import Image
            with Image.open(ASSETS/safe) as im:out['width'],out['height']=im.size
        except:pass
        return out
    except Exception as e:return {**a,'status':'failed','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex: media=list(ex.map(asset,assets.values()))
cssrefs={}
for a in media:
    if a.get('status')=='captured' and '.css' in a['originalFilename']:
        css=(ROOT/'public'/a['localPath'].lstrip('/')).read_text(encoding='utf-8',errors='replace')
        for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)',css):
            u=urllib.parse.urljoin(a['sourceUrl'],ref)
            if not u.startswith('data:') and u not in assets:cssrefs[u]={'url':u,'alt':'CSS asset','tag':'background','pageIds':a['pageIds']}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:media+=list(ex.map(asset,cssrefs.values()))
(ROOT/'content-manifest.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'asset-manifest.json').write_text(json.dumps(media,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'redirect-map.json').write_text(json.dumps(mapping,indent=2),encoding='utf-8')
with (ROOT/'content-migration-map.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['id','sourceUrl','targetRoute','status']);w.writeheader();w.writerows({k:p.get(k) for k in w.fieldnames} for p in pages)
print('Captured pages',sum(p['status']=='captured' for p in pages),'/',len(pages),'assets',sum(a['status']=='captured' for a in media),'/',len(media),flush=True)
