import json,pathlib,re,html
ROOT=pathlib.Path(__file__).resolve().parents[1]
papers=json.loads((ROOT/'source-archive/research-metadata.json').read_text(encoding='utf-8'))
notes=json.loads((ROOT/'content/editorial-notes.json').read_text(encoding='utf-8'))
out=[]
for p in papers:
 if p['status']!='verified':raise ValueError(p['id']+' unverified')
 n=notes[p['id']];slug=re.sub('[^a-z0-9]+','-',p['title'].lower()).strip('-')
 extra=[]
 if p['id']=='P13':extra.append({'label':'Author manuscript at Stanford','url':'https://dho.stanford.edu/wp-content/uploads/FDA.pdf'})
 if p.get('pmid'):extra.append({'label':'Bibliographic record and abstract on PubMed','url':'https://pubmed.ncbi.nlm.nih.gov/'+p['pmid']+'/'})
 if p['id']=='P02':extra.append({'label':'Published correction (PMC record)','url':'https://pmc.ncbi.nlm.nih.gov/articles/PMC9478905/'})
 if p['id']=='P18':extra.append({'label':'Published correction (Nature)','url':'https://doi.org/10.1038/nature22985'})
 out.append({'id':p['id'],'slug':slug,'title':p['title'],'paperTitle':p['title'],'excerpt':n['excerpt'],'html':'<h2>What the paper explores</h2><p>'+html.escape(n['overview'])+'</p><h2>How to interpret the evidence</h2><p>'+html.escape(n['limits'])+'</p><h2>Questions for MedTech teams</h2><p>'+html.escape(n['relevance'])+'</p>','type':'Research Papers','topic':n['topic'],'year':p['year'],'date':p['date'],'originalPublicationDate':p['date'],'editorialPublicationDate':None,'importDate':'2026-10-08','author':p['authors'],'editor':'Editorial summary prepared for Hopkins MedTech Compliance','sourceOrganization':p['journal'],'doi':p['doi'],'sourceUrl':p['sourceUrl'],'sourceAccessStatus':'verified','access':'Based on the author manuscript' if p['id']=='P13' else 'Based on the publisher’s editorial' if p['id']=='P27' else 'Based on the abstract','reviewedAt':'2026-10-08','publicationStatus':'published','reviewNote':'','additionalSources':extra})
order=['P15','P01','P05'];out.sort(key=lambda p:order.index(p['id']) if p['id'] in order else 50+int(p['id'][1:]))
(ROOT/'content/research.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print('Published',len(out),'original reading notes with',len(set(p['doi'].lower() for p in out)),'unique DOIs.')
