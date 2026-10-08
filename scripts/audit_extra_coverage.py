import concurrent.futures,csv,hashlib,json,pathlib,re,unicodedata,urllib.parse
import requests
from bs4 import BeautifulSoup
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'qa/content-audit'
data=json.loads((OUT/'coverage.json').read_text(encoding='utf-8'));extra=json.loads((OUT/'extra-resources.json').read_text(encoding='utf-8'))
def norm(t):return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',t).lower())
new={}
for f in (OUT/'new-live').glob('*.html'):
 s=BeautifulSoup(f.read_text(encoding='utf-8'),'html.parser')
 for x in s.select('script,style,noscript,[aria-hidden="true"],.sr-only'):x.decompose()
 new['/' if f.stem=='home' else '/'+f.stem.replace('__','/')]=norm(s.select_one('main').get_text(' ',strip=True))
rows=[];blocks=[]
for x in extra['extraArticles']:
 s=BeautifulSoup(x['bodyHtml'],'html.parser');body=norm(x['body']);found=[k for k,v in new.items() if body and body in v]
 lines=list(dict.fromkeys(re.sub(r'\s+',' ',t).strip() for t in s.stripped_strings if norm(t)))
 missing=[];used=set()
 for t in lines:
  matches=[k for k,v in new.items() if norm(t) in v];used.update(matches)
  if not matches:missing.append(t)
  blocks.append({'sourceUrl':x['sourceUrl'],'title':x['title'],'text':t,'matchedRoutes':matches,'status':'matched' if matches else 'not-matched'})
 status='empty-body' if not body else 'full-body-matched' if found else 'all-text-blocks-matched' if not missing else 'has-unmatched-text'
 row={'sourceUrl':x['sourceUrl'],'sourceFile':x['file'],'title':x['title'],'status':status,'matchedRoutes':found or sorted(used),'bodyCharacters':len(x['body']),'unmatchedBlocks':missing,'body':x['body']};rows.append(row)

known={x.get('sourceUrl') or x.get('url') for x in json.loads((ROOT/'asset-manifest.json').read_text(encoding='utf-8'))}
unknown=sorted({u for x in extra['allPages'] for u in x.get('images',[]) if u not in known and urllib.parse.urlsplit(u).hostname=='www.hopkinsmedtech.com'})
usedHashes={x['sha256'] for x in data['images'] if x['statusInNewSite']!='not-rendered'};knownHashes={x['sha256'] for x in data['images']}
def fetch_asset(u):
 try:
  r=requests.get(u,timeout=20);r.raise_for_status();path=OUT/'additional-assets'/(hashlib.sha256(u.encode()).hexdigest()[:10]+'-'+pathlib.Path(urllib.parse.urlsplit(u).path).name);path.write_bytes(r.content)
  row={'sourceUrl':u,'status':r.status_code,'file':str(path.relative_to(ROOT)),'mimeType':r.headers.get('content-type'),'sha256':hashlib.sha256(r.content).hexdigest()}
  try:
   with Image.open(path) as im:row['width'],row['height']=im.size
  except Exception:pass
  row['sameBytesAsPreviouslyKnownImage']=row['sha256'] in knownHashes;row['usedInNewSiteByHash']=row['sha256'] in usedHashes
  return row
 except Exception as e:return {'sourceUrl':u,'status':'failed','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:images=list(ex.map(fetch_asset,unknown))
newpics=[x for x in images if x.get('width')]
allhash=knownHashes|{x['sha256'] for x in newpics}
summary={'newSourceDetailAddresses':len(rows),'fullBodyMatched':sum(x['status']=='full-body-matched' for x in rows),'allBlocksMatchedAcrossPages':sum(x['status']=='all-text-blocks-matched' for x in rows),'emptyBody':sum(x['status']=='empty-body' for x in rows),'withUnmatchedText':sum(x['status']=='has-unmatched-text' for x in rows),'uniqueUnmatchedText':len({norm(x['text']) for x in blocks if x['status']=='not-matched'}),'newImageUrls':len(newpics),'allImageUrls':len(data['images'])+len(newpics),'allUniqueImageContents':len(allhash),'allUniqueImageContentsUsed':len(usedHashes),'allUniqueImageContentsNotUsed':len(allhash-usedHashes)}
out={'summary':summary,'pages':rows,'textBlocks':blocks,'assets':images,'imageFetchFailures':[x for x in images if x['status']=='failed']}
(OUT/'extra-coverage.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
def csvout(file,rs,fields):
 with (OUT/file).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows({k:' | '.join(str(t) for t in r.get(k,[])) if isinstance(r.get(k),list) else r.get(k) for k in fields} for r in rs)
csvout('extra-page-coverage.csv',rows,['sourceUrl','title','status','matchedRoutes','unmatchedBlocks','sourceFile'])
csvout('extra-text-blocks.csv',blocks,['sourceUrl','title','text','status','matchedRoutes'])
csvout('extra-images.csv',images,['sourceUrl','file','status','mimeType','width','height','sha256','sameBytesAsPreviouslyKnownImage','usedInNewSiteByHash'])
print(json.dumps(summary,ensure_ascii=False,indent=2))
print('MISSING TEXT:')
for x in rows:
 if x['status']=='has-unmatched-text':print(json.dumps({'url':x['sourceUrl'],'title':x['title'],'missing':x['unmatchedBlocks']},ensure_ascii=False))
print('IMAGES',json.dumps(images,ensure_ascii=False,indent=2))
