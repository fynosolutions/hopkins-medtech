"""Supplement the coverage audit with menu, UI, and discovery evidence."""
import concurrent.futures,csv,hashlib,json,pathlib,re,unicodedata,urllib.parse
import requests
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'qa/content-audit'
data=json.loads((OUT/'coverage.json').read_text(encoding='utf-8'))
site=json.loads((ROOT/'content/site.json').read_text(encoding='utf-8'))
def soup(file):return BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
def txt(el):return re.sub(r'\s+',' ',el.get_text(' ',strip=True)).strip() if el else ''
def norm(t):return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',t).lower())
def key(u):
 p=urllib.parse.urlsplit(u);return (p.path or '/').lower()+'?'+p.query.lower()
mapping={key(x['sourceUrl']):x['targetRoute'] for x in data['pages']}
new={}
for f in (OUT/'new-live').glob('*.html'):
 s=soup(f)
 for el in s.select('script,style,noscript,[aria-hidden="true"],.sr-only'):el.decompose()
 new['/' if f.stem=='home' else '/'+f.stem.replace('__','/')]=norm(txt(s))
ui=[]
for f in sorted((OUT/'source-live').glob('*.html')):
 s=soup(f)
 for el in s.select('script,style,noscript'):el.decompose()
 for t in s.body.stripped_strings:
  t=re.sub(r'\s+',' ',t).strip();n=norm(t)
  if len(n)<3 or any(x['normalized']==n for x in ui):continue
  matches=[k for k,v in new.items() if n in v]
  ui.append({'sourceId':f.stem,'text':t,'normalized':n,'matchedRoutes':matches,'status':'matched' if matches else 'changed-or-missing'})
diffs=[x for x in ui if x['status']=='changed-or-missing']
def classify(t):
 if t.startswith(('Previous','Next')):return '文章顺序导航未保留；对应文章本身已保留，PERIOD 是原站首尾占位符'
 if t.endswith('Lifecycle'):return '标题改为 The product lifecycle；下属所有子栏目已保留'
 if t in ['INDUSTRY FOCUS','Gene and Cell Therapies','Biostatics','Setup and Operation of US Based Sale Office','Join Us']:return '栏目/标题改名或纠正拼写；对应内容页面存在'
 if t=='Headquarters':return '标签改为 New York office；原站地址仍保留，当前总部身份待核实'
 if t.startswith('5 Penn Plaza'):return '地址缩写：New York, NY 10001 / United States；实质地址未丢失'
 if t in ['Your theme','Mobile']:return '字段改为 Subject（下拉）/Phone number；主题由自由文本改为分类选择'
 if t=='SUBSCRIBE':return '按钮改为箭头图标，aria-label=Subscribe；接收后台未连接'
 if t=='NEWSLETTER SIGNUP':return '标题改为 Stay connected to MedTech；订阅界面保留，接收后台未连接'
 if t in ['sort by topic','Cosmetics','MDSAP','Blogs','Case Studies','Body of Knowledge (BOK)']:return '旧资源分类/类型选项未沿用；详见 resource-filters.csv（不能据此假定存在未抓取文章）'
 if t=='SEE ALL RESOURCES':return '按钮改为 Explore resources；资源总览入口存在'
 if t.startswith('Ready to learn more'):return '联系 CTA 原句未使用，改为新文案'
 if t.startswith(('REGULATORY AND COMPLIANCE','Have questions about FDA','Find the latest content')):return '原完整文案未在新站使用，已改写'
 return '人工核对'
for x in diffs:x['assessment']=classify(x['text'])

home=soup(OUT/'source-live/HMC-01.html');nav=[]
for li in home.select('.head.pc .menu > ul > li'):
 main=txt(li.find('a',recursive=False))
 for dd in li.select('.erji > dl > dd'):
  a=dd.find('a',recursive=False);group=txt(a)
  leaves=dd.select('.sanji > a') or [a]
  for leaf in leaves:
   url=urllib.parse.urljoin('http://www.hopkinsmedtech.com/',leaf['href']);target=mapping.get(key(url))
   nav.append({'mainModule':main,'subGroup':group if dd.select('.sanji') else '', 'leafLabel':txt(leaf),'sourceUrl':url,'targetRoute':target,'targetFetched200':any(x['targetRoute']==target and x['targetStatus']==200 for x in data['pages']),'newOrganization':('移入 Services 总览；不再有独立 Projects 一级菜单' if main=='PROJECTS' else 'Services 总览可访问；原五组/三级菜单重组' if main=='SERVICES' else '对应导航/独立页面存在')})

filters=[];resource=soup(OUT/'source-live/HMC-04.html')
newtopics=['Company','Science','FDA and Regulatory','IVD','Clinical Evidence','Quality','Digital Health']
newtypes=['Company Insights','Research Papers','Science','Historical Resources']
for i,select in enumerate(resource.select('#NewsZidingyi select')):
 for option in select.select('option')[1:]:
  label=txt(option);m=re.search(r"GetUrl\('([^']+)'\)",option['value'])
  param=m.group(1).lower();url='http://www.hopkinsmedtech.com/News.aspx?ClassID=102&'+urllib.parse.quote(param,safe='=')
  filters.append({'kind':'topic' if i==0 else 'type','originalLabel':label,'originalRequest':url,'sameOptionInNewSite':label in (newtopics if i==0 else newtypes)})

# GET only: verify published filter options and search do not reveal extra articles.
known={key(x['sourceUrl']) for x in data['pages']};extra=[]
items=filters+[{'kind':'search','originalLabel':q or '(empty)','originalRequest':'http://www.hopkinsmedtech.com/News.aspx?q='+urllib.parse.quote(q)} for q in ['','FDA','Clinical']]
def fetch(item):
 try:
  r=requests.get(item['originalRequest'],timeout=25);r.raise_for_status();s=BeautifulSoup(r.content.decode('utf-8','replace'),'html.parser')
  refs=sorted(set(urllib.parse.urljoin(item['originalRequest'],a['href']) for a in s.select('a[href]') if re.search(r'NewsDetail\.aspx\?ID=',a['href'],re.I)))
  return {**item,'status':r.status_code,'articleLinks':refs,'unknownLinks':[u for u in refs if key(u) not in known]}
 except Exception as e:return {**item,'status':'failed','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:variants=list(ex.map(fetch,items))

subsections=[]
for row in data['industrySubsections']:
 s=soup(OUT/'source-live'/f"{row['sourceId']}.html")
 target=soup(OUT/'new-live'/(row['targetRoute'].strip('/').replace('/','__')+'.html'))
 dd=next(x for x in s.select('.regulatory dd') if txt(x.select_one('h3'))==row['module'])
 expected=[mapping.get(key(urllib.parse.urljoin(row['sourceUrl'],a['href']))) for a in dd.select('a[href]')]
 found=[a['href'] for a in target.select('.accordion a[href]')]
 body=txt(dd.select_one('.spa'))
 subsections.append({**row,'bodyPresent':norm(body) in new[row['targetRoute']],'linkTargets':expected,'linksPresent':all(u and u in found for u in expected)})

assets=json.loads((ROOT/'asset-manifest.json').read_text(encoding='utf-8'))
for row in data['images']:
 i=int(row['id'][4:]);row['category']='其他原图'
 if i in range(2,7):row['category']='导航下拉背景（5 张）'
 elif i in [10,11,12]:row['category']='首页轮播大图（3 张，含 CRO for IVD and MedTech Innovations 字样）'
 elif i==16:row['category']='联系 CTA 电话配图'
 elif i in [19,28,29]:row['category']='历史资源缩略图'
 elif i in [23,27,62]:row['category']='Contact / Resources / Team 顶部大图'
 elif i in [67,68]:row['category']='装饰背景'
 elif max(row['width'],row['height'])<=50:row['category']='旧界面图标'
 summary=data['summary']
summary.update({'uniqueMappedTargetPages':len({x['targetRoute'] for x in data['pages']}),'uniqueSourceTextStringsAtLeast3Characters':len(ui),'changedOrMissingUniqueTextStrings':len(diffs),'navLeaves':len(nav),'navLeavesMapped':sum(x['targetFetched200'] for x in nav),'industryBodiesPresent':sum(x['bodyPresent'] for x in subsections),'industryLinksPresent':sum(x['linksPresent'] for x in subsections),'filterAndSearchVariants':len(variants),'unknownArticleLinks':sorted({u for x in variants for u in x.get('unknownLinks',[])})})
data.update({'wholeTextDifferences':diffs,'navigationLeaves':nav,'resourceFilters':filters,'sourceFilterAndSearchChecks':variants,'industrySubsections':subsections})
(OUT/'coverage.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def csvout(name,rows,fields):
 with (OUT/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
  for r in rows:w.writerow({k:' | '.join(str(t) for t in r.get(k,[])) if isinstance(r.get(k),list) else r.get(k) for k in fields})
csvout('text-differences-reviewed.csv',diffs,['sourceId','text','assessment'])
csvout('navigation-modules.csv',nav,['mainModule','subGroup','leafLabel','sourceUrl','targetRoute','targetFetched200','newOrganization'])
csvout('resource-filters.csv',filters,['kind','originalLabel','sameOptionInNewSite','originalRequest'])
csvout('industry-subsections.csv',subsections,['sourceId','sourceUrl','module','targetRoute','headingPresent','bodyPresent','linkTargets','linksPresent'])
csvout('image-usage.csv',data['images'],['id','sourceUrl','localPath','optimizedPath','width','height','category','sha256','statusInNewSite','renderedRoutes','pageIds'])
print(json.dumps(summary,ensure_ascii=False,indent=2))
print('Unused image categories:',{g:sum(x['category']==g and x['statusInNewSite']=='not-rendered' for x in data['images']) for g in {x['category'] for x in data['images'] if x['statusInNewSite']=='not-rendered'}})
print('Variant failures:',[x for x in variants if x['status']!=200])
