"""Verify rendered content, images, links and old URLs on local or deployed site."""
import concurrent.futures,csv,hashlib,json,os,pathlib,re,unicodedata,urllib.parse
import requests
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'qa/content-repair';ORIGIN=os.environ.get('QA_ORIGIN','http://127.0.0.1:3002');LABEL=os.environ.get('QA_LABEL','local')
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8'))
def norm(t):return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',t).lower())
site=read('content/site.json');archive=read('content/archive.json');old=read('qa/content-repair/before/content-manifest.json');extra=read('qa/content-audit/extra-resources.json');redirects=read('redirect-map.json')
paths=['/','/services','/industries','/about','/about/team','/resources','/careers','/contact','/privacy','/search?q=clinical']+[x['route'] for x in site['services']+site['industries']]+['/about/team/'+x['slug'] for x in site['team']]+['/careers/'+x['slug'] for x in site['jobs']]+['/resources/'+x['slug'] for x in site['historical']+read('content/research.json')+read('content/insights.json')]+read('content/original-routes.json')
def get(path):
 try:
  r=requests.get(ORIGIN+path,timeout=30);s=BeautifulSoup(r.content.decode('utf-8','replace'),'html.parser')
  srcs={x.get('src','') for x in s.select('img[src]')};hrefs={x['href'] for x in s.select('a[href]') if x['href'].startswith('/')};ids={x['id'] for x in s.select('[id]')}
  for el in s.select('[style]'):
   for match in re.finditer(r'''url\(["']?([^\s"')]+)["']?\)''',el['style']):srcs.add(match.group(1))
  for x in s.select('script,style,noscript,[aria-hidden="true"],.sr-only'):x.decompose()
  body=s.select_one('main');text=norm(body.get_text(' ',strip=True)) if body else ''
  return {'route':path,'status':r.status_code,'text':text,'images':sorted(srcs),'links':sorted(hrefs),'ids':ids,'textHash':hashlib.sha256(text.encode()).hexdigest()}
 except Exception as e:return {'route':path,'status':'failed','error':str(e),'text':'','images':[],'links':[],'ids':set()}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:pages=list(ex.map(get,sorted(set(paths))))
print('Rendered pages:',len(pages),flush=True)
sources={}
for row in old:
 f=ROOT/'qa/content-audit/source-live'/(row['id']+'.html');sources[row['sourceUrl']]=f
for row in extra['extraArticles']:sources[row['sourceUrl']]=ROOT/row['file']
strings={}
for url,file in sources.items():
 s=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
 for el in s.select('script,style,noscript'):el.decompose()
 for raw in s.body.stripped_strings:
  n=norm(raw)
  if not n:continue
  if n not in strings:strings[n]={'text':re.sub(r'\s+',' ',raw).strip(),'sourceUrls':[]}
  strings[n]['sourceUrls'].append(url)
ordered=sorted(pages,key=lambda x:(x['route'].startswith('/archive'),len(x['route'])))
textrows=[]
for n,row in strings.items():
 targets=[p['route'] for p in ordered if n in p['text']];textrows.append({**row,'matchedRoutes':targets,'matched':bool(targets),'currentPageMatch':any(not u.startswith('/archive') for u in targets)})
imageRows=[]
browserFile=OUT/(LABEL+'-browser.json')
dynamicImages=json.loads(browserFile.read_text(encoding='utf-8')).get('interactiveImages',[]) if browserFile.exists() else []
for image in archive['images']:
 routes=[p['route'] for p in pages if image['src'] in p['images'] or image['original'] in p['images']]
 routes=sorted(set(routes+[x['route'] for x in dynamicImages if x['src'] in [image['src'],image['original']]]))
 imageRows.append({'id':image['id'],'title':image['title'],'sha256':image['sha256'],'routes':routes,'matched':bool(routes),'currentPageMatch':any(not u.startswith('/archive') for u in routes)})
byPath={urllib.parse.urlsplit(p['route']).path:p for p in pages};assets=set();invalidLinks=[]
for p in pages:
 for href in p['links']:
  parsed=urllib.parse.urlsplit(href)
  if parsed.path in byPath:
   if parsed.fragment and parsed.fragment not in byPath[parsed.path]['ids']:invalidLinks.append({'from':p['route'],'href':href,'reason':'fragment not found'})
  elif not parsed.path.startswith('/search'):assets.add(parsed.path)
 assets.update(u for u in p['images'] if u.startswith('/') and u not in byPath)
def status(path):
 try:
  r=requests.get(ORIGIN+path,timeout=30);return {'path':path,'status':r.status_code}
 except Exception as e:return {'path':path,'status':'failed','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:assetResults=list(ex.map(status,sorted(assets)))
def oldurl(row):
 u=urllib.parse.urlsplit(row['sourceUrl']);path=u.path+('?' +u.query if u.query else '')
 try:
  r=requests.get(ORIGIN+path,timeout=30,allow_redirects=False);loc=urllib.parse.urlsplit(r.headers.get('location',''));actual=loc.path+('?' +loc.query if loc.query else '')+('#'+loc.fragment if loc.fragment else '')
  passed=(path=='/' and r.status_code==200) or (r.status_code==308 and actual==row['targetRoute'])
  return {'sourceUrl':row['sourceUrl'],'targetRoute':row['targetRoute'],'status':r.status_code,'actual':actual,'passed':passed}
 except Exception as e:return {'sourceUrl':row['sourceUrl'],'status':'failed','passed':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:aliasResults=list(ex.map(oldurl,redirects))
summary={'origin':ORIGIN,'contentPages':len(pages),'pages200':sum(x['status']==200 for x in pages),'sourceRecords':len(sources),'uniqueSourceTextStrings':len(textrows),'matchedSourceTextStrings':sum(x['matched'] for x in textrows),'unmatchedSourceTextStrings':sum(not x['matched'] for x in textrows),'uniqueOriginalImages':len(imageRows),'renderedOriginalImages':sum(x['matched'] for x in imageRows),'imagesInRegularPages':sum(x['currentPageMatch'] for x in imageRows),'imagesOnlyInArchive':sum(not x['currentPageMatch'] for x in imageRows),'oldAddressChecks':len(aliasResults),'oldAddressesPassed':sum(x['passed'] for x in aliasResults),'assetAndDownloadChecks':len(assetResults),'assets200':sum(x['status']==200 for x in assetResults),'brokenAnchors':len(invalidLinks)}
result={'summary':summary,'pages':[{k:v for k,v in p.items() if k not in ['text','ids']} for p in pages],'textCoverage':textrows,'imageCoverage':imageRows,'oldAddresses':aliasResults,'assets':assetResults,'brokenAnchors':invalidLinks}
(OUT/(LABEL+'-coverage.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
with (OUT/(LABEL+'-text-coverage.csv')).open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=['text','matched','currentPageMatch','matchedRoutes','sourceUrls']);w.writeheader();w.writerows({k:' | '.join(v) if isinstance(v,list) else v for k,v in x.items()} for x in textrows)
print(json.dumps(summary,ensure_ascii=False,indent=2));print('Unmatched:',json.dumps([x for x in textrows if not x['matched']],ensure_ascii=False));print('Broken anchors:',invalidLinks)
if summary['unmatchedSourceTextStrings'] or summary['pages200']!=len(pages) or summary['renderedOriginalImages']!=76 or summary['oldAddressesPassed']!=138 or summary['assets200']!=len(assetResults) or invalidLinks:raise SystemExit(1)
