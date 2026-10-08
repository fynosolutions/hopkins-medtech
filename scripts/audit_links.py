import pathlib,json,requests,concurrent.futures,urllib.parse,os
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1]; base=os.environ.get('QA_ORIGIN','http://127.0.0.1:3001')
s=json.loads((ROOT/'content/site.json').read_text(encoding='utf-8'));rs=json.loads((ROOT/'content/research.json').read_text(encoding='utf-8'))+json.loads((ROOT/'content/insights.json').read_text(encoding='utf-8'))
paths=['/','/about','/about/team','/services','/industries','/resources','/careers','/contact','/privacy','/search?q=clinical','/sitemap.xml','/robots.txt']+[x['route'] for x in s['services']+s['industries']]+['/about/team/'+x['slug'] for x in s['team']]+['/careers/'+x['slug'] for x in s['jobs']]+['/resources/'+x['slug'] for x in rs+s['historical']]
def get(path):
 r=requests.get(base+path,timeout=30);soup=BeautifulSoup(r.text,'html.parser')
 return {'path':path,'status':r.status_code,'links':list({a['href'] for a in soup.select('a[href]') if a['href'].startswith('/')}),'images':list({a['src'] for a in soup.select('img[src]') if a['src'].startswith('/')}),'title':soup.title.get_text() if soup.title else None}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:pages=list(ex.map(get,paths))
assets=set();links=set()
for p in pages:assets.update(p['images']);links.update(x.split('#')[0] for x in p['links'])
other=(links|assets)-set(paths)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:extras=list(ex.map(get,other))
redirects=[]
for row in json.loads((ROOT/'redirect-map.json').read_text(encoding='utf-8')):
 u=urllib.parse.urlsplit(row['sourceUrl']);p=u.path+('?' +u.query if u.query else '')
 if p=='/':continue
 r=requests.get(base+p,allow_redirects=False,timeout=20);location=r.headers.get('location','');redirects.append({'path':p,'status':r.status_code,'location':location,'expected':row['targetRoute'],'passed':r.status_code==308 and urllib.parse.urlsplit(location).path==row['targetRoute']})
r=requests.get(base+'/News.aspx?ClassID=102&q=IVD%20study',allow_redirects=False);redirects.append({'path':'search variant','status':r.status_code,'location':r.headers.get('location'),'passed':r.status_code==308 and 'q=IVD%20study' in r.headers.get('location','')})
nf=requests.get(base+'/this-page-does-not-exist',timeout=20)
report={'pages':pages,'assetsAndLinks':extras,'redirects':redirects,'notFoundStatus':nf.status_code}
(ROOT/('qa/'+os.environ.get('QA_REPORT','link-report.json'))).write_text(json.dumps({'origin':base,**report},indent=2),encoding='utf-8')
errors=[x for x in pages+extras if x['status']!=200];bad=[x for x in redirects if not x['passed']]
print('Pages',len(pages),'Extra paths/assets',len(extras),'Redirects',len(redirects),'404',nf.status_code,'Errors',errors,'Bad redirects',bad)
if errors or bad or nf.status_code!=404:raise SystemExit(1)
