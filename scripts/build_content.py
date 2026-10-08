import json,re,pathlib,urllib.parse,shutil,html
import fitz
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1]
pages=json.loads((ROOT/'content-manifest.json').read_text(encoding='utf-8'))
assets=json.loads((ROOT/'asset-manifest.json').read_text(encoding='utf-8'))
routes={p['sourceUrl'].lower():p.get('targetRoute') or '/' for p in pages}
media={a.get('sourceUrl',''):a.get('localPath') for a in assets if a['status']=='captured'}
def clean_text(t):return re.sub(r'\s+',' ',t).strip()
def clean(el,base):
    if not el:return ''
    s=BeautifulSoup(str(el),'html.parser')
    for n in s.select('script,style,iframe,object,embed,form,input'):n.decompose()
    for n in list(s.find_all(True)):
        if n.name not in ['p','a','ul','ol','li','h2','h3','h4','strong','b','em','i','br','hr','img','table','thead','tbody','tr','td','th','blockquote']:
            n.unwrap();continue
        old=dict(n.attrs);n.attrs={}
        if n.name=='a':
            u=urllib.parse.urljoin(base,old.get('href',''))
            if u.lower() in routes:n['href']=routes[u.lower()]
            elif u.startswith(('http:','https:','mailto:','tel:')):n['href']=u;n['rel']='noopener noreferrer';n['target']='_blank'
            else:n.unwrap()
        if n.name=='img':
            u=urllib.parse.urljoin(base,old.get('src',''))
            if u in media:n['src']=media[u];n['alt']=old.get('alt','') or 'Original Hopkins MedTech website illustration';n['loading']='lazy'
            else:n.decompose()
    for p in list(s.select('p')):
        if not p.get_text(strip=True) and not p.select('img'):p.decompose()
    return str(s)
groups={
 'FDA Regulatory Consulting':['regulatory-strategy','regulatory-submission','fda-regulatory-consulting','medical-device-510k','eua-application','fda-us-agent','facility-registration-listing'],
 'Clinical Trials':['clinical-study','project-management','clinical-operations','data-management','biostatistics','quality-assurance','clinical-investigation','preclinical-research'],
 'IVD & Device Compliance':['ivdr','quality-system','post-market-surveillance','post-market-compliance','product-development','cgmp','otc-drug','food-dietary-supplements'],
 'Market Entry':['market-research','marketing','us-sales-office'],
 'Laboratory Services':['laboratory-services']}
names={'fda-regulatory-consulting':'FDA Regulatory Consulting','ivdr':'European IVDR','biostatistics':'Biostatistics','quality-system':'Quality Systems','clinical-operations':'Clinical Operations','medical-device-510k':'Medical Device 510(k)','us-sales-office':'US Sales Office','ivd':'In Vitro Diagnostics','gene-cell-therapies':'Gene & Cell Therapies'}
summaries={
'fda-regulatory-consulting':'A clear regulatory strategy for the next stage of your medical product.',
'clinical-study':'Study planning, execution and analysis for medical devices and point-of-care diagnostics.',
'ivdr':'Technical documentation, quality systems and a considered path to the European market.',
'market-research':'Research and practical market insight to support your next commercial decision.',
'medical-device-510k':'Submission support for medical devices entering the United States market.',
'eua-application':'Regulatory consulting for emergency use authorization pathways.',
'product-development':'Connect early development decisions with clinical evidence and regulatory planning.',
'us-sales-office':'Support for Chinese companies establishing and operating a US sales presence.'}
services=[]; industries=[]; historical=[]; about={}; team=[]
for p in pages:
    route=p.get('targetRoute') or '/';s=BeautifulSoup((ROOT/p['htmlPath']).read_text(encoding='utf-8'),'html.parser')
    title=s.select_one('.projecttit h3, .inbanner_txt .h2, #lblTitle')
    title=clean_text(title.get_text()) if title else p['title']
    node=s.select_one('#lContent, #lblContent'); body=clean(node,p['sourceUrl'])
    banner=s.select_one('.insidebanner > img')
    img=media.get(urllib.parse.urljoin(p['sourceUrl'],banner.get('src',''))) if banner else None
    item={'id':p['id'],'slug':route.split('/')[-1],'title':names.get(route.split('/')[-1],title),'route':route,'html':body,'image':img,'sourceUrl':p['sourceUrl'],'sourceIds':[p['id']],'sections':[]}
    item['excerpt']=summaries.get(item['slug'],clean_text(node.get_text())[:210] if node else '')
    item['reviewNote']=''
    if 'EMMA' in body or 'EMMA' in str(s.select_one('.regulatory')):item['reviewNote']='The original website includes material referring to EMMA International. Those statements are preserved with their attribution and do not establish HMC ownership of the capabilities described. Please contact us to confirm the scope of your project.'
    elif any(z in body for z in ['21 CFR','120','ANSI']):item['reviewNote']='This description preserves material from the original website. Historical regulatory references and specific capability claims require confirmation for a current project.'
    if route.startswith('/services/'):
        prior=next((a for a in services if a['route']==route),None)
        if prior:
            prior['sourceIds'].append(p['id'])
            if clean_text(BeautifulSoup(prior['html'],'html.parser').get_text())!=clean_text(BeautifulSoup(body,'html.parser').get_text()):prior['html']+='<h2>Additional service information</h2>'+body
        else:
            item['group']=next((g for g,ss in groups.items() if item['slug'] in ss),'IVD & Device Compliance');services.append(item)
    elif route.startswith('/industries/'):
        for dd in s.select('.regulatory dd'):
            h=dd.select_one('h3'); b=dd.select_one('.spa')
            item['sections'].append({'title':clean_text(h.get_text()),'html':clean(b,p['sourceUrl'])})
        industries.append(item)
    elif route=='/about':about=item
    elif route=='/about/team':
        for i,dd in enumerate(s.select('.regulatory dd')):
            title=clean_text(dd.select_one('h3').get_text());name,role=title.split(' - ',1)
            slug=['homer-wu','jennifer-stanford','wendy-zhou','andrew-wayland','qian-cheng'][i]
            b=dd.select_one('.spa')
            team.append({'id':'TEAM-'+str(i+1),'name':name,'role':role,'slug':slug,'html':clean(b,p['sourceUrl']),'excerpt':clean_text(b.select_one('p').get_text())[:185],'initials':''.join(w[0] for w in name.replace(',','').split()[:2]),'linkedin':'https://www.linkedin.com/in/homerwu/' if i==0 else None,'image':None,'sourceUrl':p['sourceUrl'],'verified':True})
    elif route.startswith('/resources/'):
        date=s.select_one('#lblPutdate');item['date']=date.get_text(strip=True) if date else None
        item.update({'type':'Historical Resources','topic':'Clinical Evidence' if 'clinical-manager' in route else 'FDA and Regulatory','year':item['date'][:4] if item['date'] else None,'author':'Hopkins MedTech Group' if 'clinical-manager' in route else ('Gabe Kadoo' if any(z in route for z in ['cbd','sterile']) else 'Alexis Ferrier'),'sourceOrganization':'Hopkins MedTech' if 'clinical-manager' in route else 'EMMA International','originalPublicationDate': {'HMC-05':'2022-02-18','HMC-06':'2022-01-25','HMC-07':'2022-01-13','HMC-08':'2021-11-17','HMC-39':'2021-12-08','HMC-40':'2023-09-27'}.get(p['id'])})
        if 'clinical-manager' in route:item['reviewNote']='Historical vacancy published on September 27, 2023. Its current availability is unconfirmed. This is separate from the eight internship descriptions.'
        else:item['reviewNote']='Historical article credited to EMMA International. The original author, dates and third-party contact details are preserved. This article is not current regulatory guidance.'
        historical.append(item)
team.insert(0,{'id':'TEAM-JEFF','name':'Jeff Wu','role':None,'slug':'jeff-wu','html':'','excerpt':'Professional profile available on LinkedIn.','initials':'JW','linkedin':'https://www.linkedin.com/in/jeffwu774/','image':None,'sourceUrl':'https://www.linkedin.com/in/jeffwu774/','verified':False})
services.append({'id':'S-LAB','slug':'laboratory-services','title':'Laboratory Services','route':'/services/laboratory-services','group':'Laboratory Services','excerpt':'Discuss diagnostic assay validation and laboratory support through associated businesses and partners.','html':'<p>Laboratory support is coordinated through associated businesses and partners. Hopkins MedTech Compliance (HMC) and Hopkins MedTech Lab (HML) are distinct entities; partner capabilities and accreditations should not be interpreted as HMC-owned facilities or certifications.</p><p>Contact us to confirm the provider, validation scope and quality requirements for your diagnostic project.</p>','image':'/media/0d78598a-20220224105150.png','sections':[],'reviewNote':'The specific laboratory provider and service scope are confirmed for each engagement.','sourceUrl':'https://www.diacarta.com/hmc-hml-partnership','sourceIds':[]})
home=BeautifulSoup((ROOT/'source-archive/HMC-01.html').read_text(encoding='utf-8'),'html.parser')
quotes=[{'text':clean_text(n.select_one('h3').get_text()),'name':clean_text(n.select_one('span').get_text()),'truncated':i==1} for i,n in enumerate(home.select('.con5 .swiper-slide'))]
homeSource={'html':clean(home.select_one('.con2'),routes and 'http://www.hopkinsmedtech.com/'),'quotes':quotes}
# Read the two-column PDFs in their intended reading order. Retain all terms and legal text.
jobs=[];pdfdir=ROOT/'public/downloads';pdfdir.mkdir(exist_ok=True)
slugs=['clinical-research-intern','regulatory-affairs-intern','clinical-data-biostatistics-intern','quality-assurance-intern','ai-computer-vision-intern','data-science-intern','digital-health-product-intern','healthcare-market-research-intern']
headings=['KEY TO TERMS USED','INTENDED ROLE','PRINCIPAL DUTIES','EXAMPLE ASSIGNMENTS','YOUR FIRST TWO WEEKS','ABOUT HOPKINS MEDTECH','REQUIRED QUALIFICATIONS','PREFERRED QUALIFICATIONS','WHAT YOU WILL GAIN','DELIVERABLES','SUPERVISION AND EVALUATION','WHAT WE DO NOT EXPECT','APPLICATION AND SELECTION','DATA HANDLING, PRIVACY, AND RESPONSIBLE AI']
for path in (ROOT/'1008 - HMC 8 Positions').glob('*.pdf'):
    doc=fitz.open(path);raw='\n'.join(p.get_text() for p in doc);code=re.search(r'JD-HMT-[AB]0[1-4]',raw)[0]; idx=(0 if '-A' in code else 4)+int(code[-1])-1
    blocks=[b for b in doc[0].get_text('blocks') if b[6]==0]
    title=clean_text(' '.join(b[4] for b in blocks if 100<b[1]<165))
    body_start=min(b[1] for b in blocks if clean_text(b[4]) in headings)
    desc=clean_text(' '.join(b[4] for b in blocks if 165<=b[1]<body_start))
    first=[b for b in blocks if body_start<=b[1]<730]
    ordered=sorted([b for b in first if b[0]<306],key=lambda b:b[1])+sorted([b for b in first if b[0]>=306],key=lambda b:b[1])
    second=[b for b in doc[1].get_text('blocks') if b[6]==0 and 60<b[1]<740]
    privacy=next(b[1] for b in second if 'DATA HANDLING, PRIVACY' in b[4])
    main=[b for b in second if b[1]<privacy];end=[b for b in second if b[1]>=privacy]
    ordered+=sorted([b for b in main if b[0]<306],key=lambda b:b[1])+sorted([b for b in main if b[0]>=306],key=lambda b:b[1])
    # Privacy paragraph continues in the right column; blocks follow PDF reading order here.
    ordered+=end
    sections=[];cur=None
    for b in ordered:
        text=b[4].replace('�C','•').replace('��','·').replace('\u00ad','')
        text=clean_text(text)
        if text in headings:cur={'title':text.title(),'paragraphs':[]};sections.append(cur)
        elif text.startswith('Hopkins MedTech Group LLC provides equal'):
            cur={'title':'Equal Opportunity & Educational Nature','paragraphs':[text]};sections.append(cur)
        elif cur and text:
            if cur['paragraphs'] and (b[0]>60 and b[0]<100 or b[0]>325) and not text.startswith('•') and cur['title'] not in ['Key To Terms Used']:
                cur['paragraphs'][-1]+=' '+text
            else:cur['paragraphs'].append(text)
    shutil.copy2(path,pdfdir/path.name)
    job={'id':code,'slug':slugs[idx],'title':title,'excerpt':desc,'track':'Healthcare & MedTech' if idx<4 else 'AI & Digital Health','level':'Student / early career','sections':sections,'pdf':'/downloads/'+path.name,'pages':len(doc),'status':'Educational partner referral; availability to be confirmed'}
    jobs.append(job)
jobs.sort(key=lambda j:j['id'])
guide=(ROOT/'HMC_Codex_Execution_Guide.txt').read_text(encoding='utf-8')
careers=guide.split('附录一 Careers A 英文原文')[1].split('附录二')[0]
pending=[]
for match in re.finditer(r'\n([LS]\d{2}) ([^\n]+)\s+LinkedIn：(\S+)',guide):pending.append({'id':match[1],'title':match[2],'linkedinUrl':match[3],'publicationStatus':'draft','reason':'LinkedIn full text, author and date need verification'})
data={'services':services,'industries':industries,'team':team,'historical':historical,'about':about,'home':homeSource,'jobs':jobs,'pendingLinkedin':pending}
(ROOT/'content/site.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'content/careers-source.txt').write_text(careers,encoding='utf-8')
print('Services',len(services),'Industries',len(industries),'Team',len(team),'Jobs',len(jobs),'Historical',len(historical))
print([(j['id'],j['title'],len(j['sections'])) for j in jobs])
