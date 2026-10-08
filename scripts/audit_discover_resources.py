"""Follow original resource filters, search pagination, and previous/next links (GET only)."""
import concurrent.futures,hashlib,json,pathlib,re,urllib.parse
import requests
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'qa/content-audit';DEST=OUT/'extra-source-pages';DEST.mkdir(exist_ok=True)
report=json.loads((OUT/'coverage.json').read_text(encoding='utf-8'))
def canonical(u):
 p=urllib.parse.urlsplit(u);q=urllib.parse.parse_qsl(p.query,keep_blank_values=True)
 q=[(k.lower(),v.lower()) for k,v in q if k.lower()!='spm']
 return p.path.lower()+'?'+urllib.parse.urlencode(sorted(q))
def fetch(url):
 file=DEST/(hashlib.sha256(url.encode()).hexdigest()[:12]+'.html')
 try:
  r=requests.get(url,timeout=25);r.raise_for_status();file.write_bytes(r.content);s=BeautifulSoup(r.content.decode('utf-8','replace'),'html.parser')
  links=[]
  for a in s.select('a[href]'):
   u=urllib.parse.urljoin(url,a['href']);p=urllib.parse.urlsplit(u);u=urllib.parse.urlunsplit((*p[:4],''))
   if p.hostname=='www.hopkinsmedtech.com' and p.path.lower().split('/')[-1] in ['news.aspx','newsdetail.aspx']:links.append(u)
  images=[]
  for el in s.select('img[src],[style]'):
   for v in [el.get('src','')]+re.findall(r'url\([\'\"]?([^\)\'\"]+)',el.get('style','')):
    if v and not v.startswith('data:'):images.append(urllib.parse.urljoin(url,v))
  article=s.select_one('#lContent,#lblContent');body=article.get_text(' ',strip=True) if article else ''
  articleTitle=s.select_one('.update_detail_tit h1,.update_detail_tit h2,#lblTitle,#lTitle')
  return {'sourceUrl':url,'status':200,'file':str(file.relative_to(ROOT)),'title':s.title.get_text(' ',strip=True) if s.title else '', 'articleTitle':articleTitle.get_text(' ',strip=True) if articleTitle else '', 'body':body,'bodyHtml':str(article) if article else '', 'links':sorted(set(links)),'images':sorted(set(images)),'paginationText':[x.get_text(' ',strip=True) for x in s.select('.page')], 'isArticle':'newsdetail.aspx' in url.lower()}
 except Exception as e:return {'sourceUrl':url,'status':'failed','error':str(e)}
seeds={x['originalRequest'] for x in report['sourceFilterAndSearchChecks']}
seen=set();todo=sorted(seeds);allpages=[]
while todo:
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:batch=list(ex.map(fetch,todo))
 allpages+=batch;seen.update(canonical(u) for u in todo)
 nexts={canonical(u):u for p in batch for u in p.get('links',[]) if canonical(u) not in seen}
 todo=list(nexts.values());print('Fetched',len(allpages),'articles',sum(x.get('isArticle',False) for x in allpages),'next',len(todo),flush=True)
known={canonical(x['sourceUrl']) for x in report['pages']}
extra=[x for x in allpages if x.get('isArticle') and canonical(x['sourceUrl']) not in known]
out={'allPages':allpages,'extraArticles':extra,'summary':{'listingAndArticleRequests':len(allpages),'successful':sum(x['status']==200 for x in allpages),'allArticles':sum(x.get('isArticle',False) for x in allpages),'extraArticles':len(extra),'failures':[x for x in allpages if x['status']!=200]}}
(OUT/'extra-resources.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(out['summary'],ensure_ascii=False,indent=2));print(json.dumps([{'url':x['sourceUrl'],'title':x['title'],'bodyLength':len(x['body'])} for x in extra],ensure_ascii=False,indent=2))
