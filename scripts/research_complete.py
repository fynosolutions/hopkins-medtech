import pathlib,json,requests,concurrent.futures,re
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=ROOT/'source-archive/research-metadata.json';data=json.loads(p.read_text(encoding='utf-8'))
def fix(x):
 if x['status']=='failed':
  r=requests.get('https://www.ebi.ac.uk/europepmc/webservices/rest/search',params={'query':'DOI:"'+x['doi']+'"','format':'json','resultType':'core'},timeout=30).json()['resultList']['result']
  if r:
   y=r[0];x.update(status='verified',title=y['title'].rstrip('.'),authors=y.get('authorString'),year=y.get('pubYear'),date=y.get('firstPublicationDate'),journal=y.get('journalInfo',{}).get('journal',{}).get('title'),abstract=y.get('abstractText',''),pmid=y.get('id'),pmcid=y.get('pmcid'),sourceUrl='https://doi.org/'+x['doi'],access='abstract',metadata=y)
 if not x.get('abstract') and x.get('pmcid'):
  r=requests.get('https://www.ebi.ac.uk/europepmc/webservices/rest/'+x['pmcid']+'/fullTextXML',timeout=30)
  if r.status_code==200:
   (ROOT/'source-archive'/('research-'+x['id']+'.xml')).write_text(r.text,encoding='utf-8')
   soup=BeautifulSoup(r.text,'xml');el=soup.find('abstract') or soup.find('body')
   x['readableText']=el.get_text(' ',strip=True) if el else '';x['access']='full text excerpt' if not soup.find('abstract') else 'abstract'
 print(x['id'],x.get('status'),x.get('error',''),x.get('readableText',x.get('abstract',''))[:6500],flush=True)
 return x
need=[x for x in data if not x.get('abstract')]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:fixed=list(ex.map(fix,need))
data=[next((y for y in fixed if y['id']==x['id']),x) for x in data]
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
