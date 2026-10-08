import json,pathlib,requests,concurrent.futures,re,hashlib
from PIL import Image
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1]
assets=json.loads((ROOT/'asset-manifest.json').read_text(encoding='utf-8'));mapping={}
for a in assets:
 if a.get('status')!='captured' or not a.get('mimeType','').startswith('image/') or a.get('width',0)<500:continue
 src=ROOT/'public'/a['localPath'].lstrip('/');target=src.with_suffix('.webp')
 with Image.open(src) as im:
  if im.mode not in ['RGB','RGBA']:im=im.convert('RGBA')
  im.thumbnail((1600,1600));im.save(target,'WEBP',quality=83,method=6)
 a['optimizedPath']='/media/'+target.name;a['originalBytes']=src.stat().st_size;a['optimizedBytes']=target.stat().st_size
 mapping[a['localPath']]=a['optimizedPath']
for path in [ROOT/'content/site.json',ROOT/'app/page.tsx',ROOT/'app/[...slug]/page.tsx']:
 s=path.read_text(encoding='utf-8')
 for old,new in mapping.items():s=s.replace(old,new)
 path.write_text(s,encoding='utf-8')
(ROOT/'asset-manifest.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2),encoding='utf-8')
site=json.loads((ROOT/'content/site.json').read_text(encoding='utf-8'))
def get(post):
 try:
  r=requests.get(post['linkedinUrl'],timeout=12);soup=BeautifulSoup(r.content,'html.parser');title=soup.title.get_text(strip=True) if soup.title else ''
  result={**post,'httpStatus':r.status_code,'responseTitle':title,'checkedAt':'2026-10-08'}
  (ROOT/'source-archive'/('linkedin-'+post['id']+'.html')).write_bytes(r.content)
  return result
 except Exception as e:return {**post,'error':str(e),'checkedAt':'2026-10-08'}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:pending=list(ex.map(get,site['pendingLinkedin']))
(ROOT/'source-archive/linkedin-access.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2),encoding='utf-8')
pages=json.loads((ROOT/'content-manifest.json').read_text(encoding='utf-8'))
for p in pages:
 p['targetRoute']=p.get('targetRoute') or '/';p['sectionId']='source-'+p['id'].lower();p['sourceTitle']=p.get('title');p['sourceDate']=None;p['assetIds']=[a.get('sha256') for a in assets if p['id'] in a.get('pageIds',[]) and a.get('sha256')];p['notes']='Original HTML and full visible text preserved. Shared navigation/footer deduplicated in the new site.'
(ROOT/'content-manifest.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2),encoding='utf-8')
print('Optimized',len(mapping),'images. Original bytes',sum(a.get('originalBytes',0) for a in assets),'optimized bytes',sum(a.get('optimizedBytes',0) for a in assets))
print('LinkedIn checks',[(p['id'],p.get('httpStatus'),p.get('responseTitle',p.get('error',''))[:100]) for p in pending])
