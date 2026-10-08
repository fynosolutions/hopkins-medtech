import re,json,pathlib,concurrent.futures,requests,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
guide=(ROOT/'HMC_Codex_Execution_Guide.txt').read_text(encoding='utf-8')
papers=[]
for block in re.split(r'\n(?=P\d{2} )',guide)[1:]:
    block=block.split('附录四')[0]
    doi=re.search(r'来源：https://doi.org/(\S+)',block)
    if doi:papers.append({'id':block[:3],'providedTitle':block.splitlines()[0][4:],'doi':doi[1],'context':re.search(r'业务相关性：(.*)',block)[1]})
extra=['10.1136/bmj.m3164','10.1136/bmj.m3210','10.1038/s41591-022-01772-9','10.1136/bmj.h5527','10.7326/0003-4819-155-8-201110180-00009','10.1136/bmj-2023-078378','10.1148/ryai.2020200029']
papers += [{'id':f'P{i+21:02d}','doi':d} for i,d in enumerate(extra)]
def get(p):
    try:
        r=requests.get('https://www.ebi.ac.uk/europepmc/webservices/rest/search',params={'query':'DOI:'+p['doi'],'format':'json','resultType':'core'},timeout=35);r.raise_for_status()
        results=r.json()['resultList']['result']; exact=[x for x in results if x.get('doi','').lower()==p['doi'].lower()]
        if not exact:raise ValueError('DOI not found')
        x=exact[0]
        return {**p,'status':'verified','title':x['title'].rstrip('.'),'authors':x.get('authorString'),'year':x.get('pubYear'),'date':x.get('firstPublicationDate'),'journal':x.get('journalInfo',{}).get('journal',{}).get('title'),'abstract':x.get('abstractText',''),'pmid':x.get('id'),'pmcid':x.get('pmcid'),'sourceUrl':'https://doi.org/'+p['doi'],'access':'abstract','metadata':x}
    except Exception as e:return {**p,'status':'failed','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:out=list(ex.map(get,papers))
(ROOT/'source-archive/research-metadata.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print([(x['id'],x['status'],len(x.get('abstract',''))) for x in out],flush=True)
for x in out:
    print(x['id'],x.get('title',x['doi']),re.sub('<[^>]+>',' ',x.get('abstract','')),flush=True)
