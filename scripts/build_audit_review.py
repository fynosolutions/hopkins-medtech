"""Build a local, self-contained audit viewer from captured evidence."""
import csv,difflib,html,json,pathlib,re,urllib.parse
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'qa/content-audit'
base=json.loads((OUT/'coverage.json').read_text(encoding='utf-8'));extra=json.loads((OUT/'extra-coverage.json').read_text(encoding='utf-8'));site=json.loads((ROOT/'content/site.json').read_text(encoding='utf-8'))
e=lambda x:html.escape(str(x or ''),quote=True)
images=[{**x,'used':x['statusInNewSite']!='not-rendered','file':'../../public'+x['localPath']} for x in base['images']]
for i,x in enumerate(extra['assets']):
 if not x.get('width'):continue
 images.append({**x,'id':f'IMG-{82+i:03d}','used':x['usedInNewSiteByHash'],'statusInNewSite':'not-rendered','renderedRoutes':[],'file':pathlib.Path(x['file']).relative_to('qa/content-audit').as_posix(),'category':'扩展页 CRO 品牌横幅' if x['width']>1000 else '测试/占位图'})
def csvout(name,rows,fields):
 with (OUT/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
  for r in rows:w.writerow({k:' | '.join(str(t) for t in r.get(k,[])) if isinstance(r.get(k),list) else r.get(k) for k in fields})
csvout('all-image-usage.csv',images,['id','sourceUrl','file','width','height','category','sha256','used','statusInNewSite','renderedRoutes'])

lines=[(x['route'],t) for x in site['services'] for t in BeautifulSoup(x['html'],'html.parser').stripped_strings]
diffs=[]
for x in extra['textBlocks']:
 if x['status']!='not-matched':continue
 rid=urllib.parse.parse_qs(urllib.parse.urlsplit(x['sourceUrl']).query)['ID'][0];newroute='';newtext=''
 if rid in ['29','30','32']:
  score,newroute,newtext=max((difflib.SequenceMatcher(None,x['text'].lower(),t.lower()).ratio(),route,t) for route,t in lines)
  assessment='聚合服务页与独立服务页版本不同；业务内容大体有对应，当前新文案沿用了源站独立页的拼接错误'
  if x['text']=='Biostatics':newroute='/services/biostatistics';newtext='Biostatistics';assessment='标题拼写已纠正'
 elif rid=='1':assessment='项目历史概述未展示；客户数量须保留历史属性，不能未经核实作为现行业绩'
 elif rid=='112':assessment='资源中心原介绍段落未展示'
 elif rid=='94':assessment='标签/格式改变；联系号码及邮箱已保留'
 else:assessment='疑似测试占位；记录排除，不作为正常业务内容补入'
 diffs.append({**x,'assessment':assessment,'closestNewRoute':newroute,'closestNewText':newtext})
csvout('extra-reviewed-differences.csv',diffs,['sourceUrl','text','assessment','closestNewRoute','closestNewText'])

imagecards=[];seen=set()
for x in images:
 if x['sha256'] in seen:continue
 seen.add(x['sha256']);used=x['used'];routes=x.get('renderedRoutes',[])
 if used and not routes:
  routes=next(y['renderedRoutes'] for y in images if y['sha256']==x['sha256'] and y.get('renderedRoutes'))
 target=''.join(f'<a href="https://hopkins-medtech.vercel.app{e(u)}" target="_blank" rel="noreferrer">{e(u)}</a>' for u in routes[:3])
 imagecards.append(f'<article class="picture" data-used="{str(used).lower()}"><a class="pic" href="{e(x["file"])}"><img loading="lazy" src="{e(x["file"])}" alt="{e(x["id"]+" "+x["category"])}"></a><div class="picbody"><span class="badge {"good" if used else "bad"}">{"已使用" if used else "未使用"}</span><h3>{e(x["id"])} · {e(x["category"])}</h3><p>{x["width"]} × {x["height"]}</p><a href="{e(x["sourceUrl"])}" target="_blank" rel="noreferrer">原站图片 ↗</a>{target}</div></article>')

def table(head,rows):return '<div class="table-wrap"><table><thead><tr>'+''.join('<th>'+e(x)+'</th>' for x in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+str(x)+'</td>' for x in row)+'</tr>' for row in rows)+'</tbody></table></div>'
nav=table(['原一级模块','原分组','末级入口','新站落点'],[[e(x['mainModule']),e(x['subGroup']),e(x['leafLabel']),f'<a target="_blank" rel="noreferrer" href="https://hopkins-medtech.vercel.app{e(x["targetRoute"])}">{e(x["targetRoute"])}</a>'] for x in base['navigationLeaves']])
sub=table(['原站','子栏目','正文','延伸链接'],[[e(x['sourceId']),e(x['module']),'已保留','已保留' if x['linksPresent'] else '<strong class="red">回到原站 # 占位，需修复</strong>'] for x in base['industrySubsections']])
textdiff=table(['来源','原文字','评估'],[[e(x['sourceId']),e(x['text']),e(x['assessment'])] for x in base['wholeTextDifferences']])
status={'full-body-matched':'完整正文已匹配','empty-body':'空正文组件记录','has-unmatched-text':'有文字差异','all-text-blocks-matched':'内容分布在多页'}
extratable=table(['原站 ID / 标题','正文情况','新站正文位置','未匹配文字'],[[f'<a href="{e(x["sourceUrl"])}" target="_blank" rel="noreferrer">ID={e(x["sourceUrl"].split("=")[-1])} · {e(x["title"])}</a>',e(status[x['status']]),'<br>'.join(f'<a href="https://hopkins-medtech.vercel.app{e(u)}" target="_blank" rel="noreferrer">{e(u)}</a>' for u in x['matchedRoutes'][:4]),'<details><summary>'+str(len(x['unmatchedBlocks']))+' 个片段</summary>'+''.join('<p>'+e(t)+'</p>' for t in x['unmatchedBlocks'])+'</details>' if x['unmatchedBlocks'] else '—'] for x in sorted(extra['pages'],key=lambda x:(x['status']!='has-unmatched-text',int(x['sourceUrl'].split('=')[-1])))])

doc='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HMC 内容完整性自检</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3f5f3;color:#193e37;font-family:system-ui,"Microsoft YaHei",sans-serif;line-height:1.65}header{background:#123f38;color:white;padding:48px max(24px,calc((100vw - 1240px)/2))}header .kicker{letter-spacing:.12em;color:#b1d487;font-size:13px}h1{font-size:clamp(28px,4vw,46px);margin:12px 0}header p{max-width:900px;color:#d8e7e1}main{max-width:1288px;margin:auto;padding:28px 24px 80px}h2{font-size:27px;margin:0 0 18px}h3{font-size:15px;margin:10px 0}a{color:#086b78;overflow-wrap:anywhere}header a{color:#d5eeaa}nav{display:flex;gap:18px;flex-wrap:wrap}nav a{font-size:14px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:0 0 32px}.stat{background:white;border:1px solid #dbe5de;padding:22px;border-radius:12px}.stat strong{display:block;font-size:35px;line-height:1.2}.stat span{font-size:14px;color:#51675f}.red{color:#ad3b30}section{margin:38px 0;padding:30px;background:white;border-radius:14px;border:1px solid #dbe5de;scroll-margin-top:20px}.notice{background:#fff3e2;border-left:4px solid #b96420;padding:18px 22px}.notice p{margin:0 0 8px}.toolbar{display:flex;gap:12px;align-items:center;margin:24px 0;flex-wrap:wrap}select{font:inherit;padding:9px 14px;border-radius:6px;border:1px solid #809f92;background:white}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.picture{border:1px solid #dbe5de;border-radius:10px;overflow:hidden}.pic{display:flex;height:178px;background:#e9eeeb;align-items:center;justify-content:center;padding:10px}.pic img{max-width:100%;max-height:158px;object-fit:contain}.picbody{padding:16px}.picbody p{margin:4px 0;color:#60766e;font-size:12px}.picbody a{display:block;font-size:12px;margin:6px 0}.badge{display:inline-block;border-radius:4px;font-size:12px;padding:2px 7px}.bad{background:#fff0e4;color:#993f21}.good{background:#e5f2e0;color:#276034}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px;min-width:700px}td,th{text-align:left;padding:11px;vertical-align:top;border-bottom:1px solid #dbe5de}th{background:#eef4ef;white-space:nowrap}td{min-width:75px;overflow-wrap:anywhere}td p{max-width:750px}summary{cursor:pointer}footer{color:#587368;font-size:13px;margin-top:24px}[hidden]{display:none!important}@media(max-width:800px){.gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.stats{grid-template-columns:repeat(2,1fr)}section{padding:18px}}@media(max-width:500px){.gallery{grid-template-columns:1fr}main{padding:20px 14px}.stat{padding:15px}.stat strong{font-size:29px}}
</style><header><div class="kicker">HOPKINS MEDTECH · 2026-10-08</div><h1>内容完整性自检：尚未全部保留</h1><p>原站与实际 Vercel 部署的逐页检查。主要业务正文已有对应，但原图、部分文案、搜索记录映射和界面模块存在缺口。保存文件不等于页面展示。</p><nav><a href="#findings">关键发现</a><a href="#pictures">原图核对</a><a href="#modules">模块 / 子模块</a><a href="#text">文字差异</a><a href="#extra">额外详情地址</a><a href="report.md">完整 Markdown 报告</a></nav></header><main>
<div class="stats"><div class="stat"><strong>37 / 76</strong><span>不同原图已实际使用</span></div><div class="stat"><strong>32 / 32</strong><span>原导航末级内容有落点</span></div><div class="stat"><strong>36 / 36</strong><span>行业子栏目正文保留</span></div><div class="stat"><strong class="red">91</strong><span>额外旧详情地址未映射</span></div></div>
<section id="findings"><h2>明确存在的缺口</h2><div class="notice"><p><strong>不能按“全部文字、图片、模块和子模块都已使用”验收。</strong></p><p>本轮完成检查与证据补采，没有修改线上页面，也没有重新部署。</p></div><ol><li><strong>39 张不同原图未使用：</strong>包括首页轮播、导航背景、Team / Contact / Resources 大图、缩略图和旧图标；其中 2 张是扩展页测试/占位图，应记录排除理由。</li><li><strong>文字有改写和遗漏：</strong>联系页、资源简介、旧项目概述未完整展示；三份聚合服务正文与当前独立服务页存在版本差异。</li><li><strong>91 个额外详情地址未建立跳转：</strong>75 个正文已匹配、9 个空正文、7 个有差异；不能算成 91 篇文章全部漏迁。</li><li><strong>2 个子栏目链接仍有问题：</strong>Biopharma、Pharmaceuticals 的 Preclinical Research 入口回到原站占位地址。</li><li><strong>模块有重组或取消：</strong>Projects 并入 Services；旧资源分类和上一篇/下一篇导航未沿用；咨询和订阅的界面存在，后台尚未接通。</li></ol><p>已核验 99 个新站内容页；浏览器复核 42 页，已用原图全部加载并可见，36 个行业子栏目均可展开。<a href="report.md">查看完整说明与修复清单</a>。</p></section>
<section id="pictures"><h2>全部原图：按内容去重</h2><p>84 个有效来源地址，去重后 76 张。已用 37 张，未用 39 张。下方默认展示缺口；可筛选查看已用原图及其页面位置。</p><div class="toolbar"><label for="image-filter">使用状态</label><select id="image-filter"><option value="false">未使用 · 39</option><option value="true">已使用 · 37</option><option value="all">全部 · 76</option></select><span id="image-count" role="status"></span><a href="all-image-usage.csv">下载图片明细 CSV</a></div><div class="gallery">IMAGES</div></section>
<section id="modules"><h2>导航模块与行业子模块</h2><p>基线中的 26 个独立服务、5 个行业、5 位原团队成员和 6 条历史内容均有正文落点。32 个导航末级条目全部有对应内容，但导航层级已重组。</p><details><summary>展开 32 个原导航入口的对应关系</summary>NAV</details><details><summary>展开 36 个行业子栏目的核对结果</summary>SUB</details></section>
<section id="text"><h2>基线文字差异</h2><p>39 组未逐字匹配字符串，经人工区分改写、改名、缩写和缺失功能；不等于 39 段业务内容丢失。</p><details><summary>展开原文与差异评估</summary>TEXTDIFF</details><p><a href="text-differences-reviewed.csv">下载文字差异 CSV</a> · <a href="extra-reviewed-differences.csv">下载扩展正文版本对照</a></p></section>
<section id="extra"><h2>原清单之外的 91 个详情地址</h2><p>来自原站公开搜索、10 页搜索结果及详情链接。75 个完整正文已在新站出现、9 个为空正文组件记录、7 个存在差异。新站域名下的这些旧地址全部返回 404。</p><p>原项目概述中的客户数量带有历史日期，尚未核实为现行事实；测试占位记录不应机械补进正式业务页面。</p><details><summary>展开 91 个来源、正文匹配情况与差异</summary>EXTRATABLE</details><p><a href="extra-page-coverage.csv">下载详情地址明细 CSV</a> · <a href="extra-redirect-check.json">查看 91 条 HTTP 验证</a></p></section>
<footer>检查对象：<a href="http://www.hopkinsmedtech.com/">HMC 原站</a> → <a href="https://hopkins-medtech.vercel.app/">新站 Vercel 部署</a>。证据留存在本地 qa/content-audit；报告不连接外部统计或提交服务。</footer></main><script>const select=document.getElementById('image-filter');const cards=[...document.querySelectorAll('.picture')];function filter(){let count=0;for(const card of cards){card.hidden=select.value!=='all'&&card.dataset.used!==select.value;if(!card.hidden)count++}document.getElementById('image-count').textContent='显示 '+count+' 张'}select.addEventListener('change',filter);filter();</script></html>'''
for k,v in [('IMAGES',''.join(imagecards)),('NAV',nav),('SUB',sub),('TEXTDIFF',textdiff),('EXTRATABLE',extratable)]:doc=doc.replace(k,v)
(OUT/'review.html').write_text(doc,encoding='utf-8')
print(json.dumps({'imageUrls':len(images),'uniqueImageCards':len(imagecards),'extraTextDifferencesReviewed':len(diffs),'output':str(OUT/'review.html')},ensure_ascii=False))
