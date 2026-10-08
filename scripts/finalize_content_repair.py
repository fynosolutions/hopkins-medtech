"""Write repair handoff documents from successful deployed-site evidence."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa/content-repair'
def read(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'))
def write(path, value):
    (ROOT/path).write_text(value, encoding='utf-8')

coverage = read('qa/content-repair/live-coverage.json')
summary = coverage['summary']
browser = read('qa/content-repair/live-browser.json')['summary']
assert summary['pages200'] == summary['contentPages'] == 246
assert summary['matchedSourceTextStrings'] == summary['uniqueSourceTextStrings'] == 656
assert summary['renderedOriginalImages'] == 76 and summary['oldAddressesPassed'] == 138
assert summary['assets200'] == summary['assetAndDownloadChecks'] and not summary['brokenAnchors']
assert browser['passed'] == browser['checks'] == 9
assert not (browser['layoutFailures'] or browser['axeViolations'] or browser['errors'])

archive = read('content/archive.json')
image_usage = {x['id']:x for x in coverage['imageCoverage']}
image_rows = []
for image in archive['images']:
    usage = image_usage[image['id']]
    for url in image['sourceUrls']:
        image_rows.append({
            'id':image['id'], 'sourceUrl':url, 'title':image['title'],
            'sha256':image['sha256'], 'originalFile':'public'+image['original'],
            'displayFile':'public'+image['src'],
            'businessPages':' | '.join(x for x in usage['routes'] if not x.startswith('/archive')),
            'publicCollection':'/archive/media#'+image['id'],
            'placement':'Business pages and archive' if usage['currentPageMatch'] else 'Original interface artwork / test placeholder archive',
        })
assert len(image_rows) == 84
with (OUT/'restored-image-map.csv').open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=list(image_rows[0]))
    writer.writeheader(); writer.writerows(image_rows)

deployment = {
    'project':'hopkins-medtech', 'scope':'wei34',
    'url':'https://hopkins-medtech.vercel.app',
    'deploymentId':'dpl_4LpMfUn5fW88YzV6DKuYgkPEMapE',
    'deploymentUrl':'https://hopkins-medtech-hx12qo329-wei34.vercel.app',
    'dashboard':'https://vercel.com/wei34/hopkins-medtech',
    'status':'READY', 'indexable':False, 'productionDomainChanged':False,
    'previousVerifiedDeploymentId':'dpl_7taPcFF7oWqEanGtBiqpQhJACxXZ',
    'revision':'Original content restoration with public historical archive',
    'verification':'qa/content-repair/report.md',
}
for path in ['qa/deployment.json', 'qa/content-repair/deployment.json']:
    write(path, json.dumps(deployment, ensure_ascii=False, indent=2)+'\n')

manifest = {
    'date':'2026-10-08', 'deployment':deployment, 'verifiedSummary':summary,
    'sourceRecords':[{k:r[k] for k in ['id','sourceUrl','route','currentRoutes','category']} for r in archive['records']],
    'images':image_rows,
    'knownOriginalFailures':[
        {'sourceUrl':'http://www.hopkinsmedtech.com/images/202202231610531.png','status':404,'resolution':'The available /upload/ version is preserved.'},
        {'sourceUrl':'http://www.hopkinsmedtech.com/images/inbannerbg1.png','status':404,'resolution':'No recoverable original file was found; not counted among the 76 valid original images.'},
    ],
}
write('qa/content-repair/restoration-manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

report = f'''# HMC 原站内容修复与部署验收

日期：2026-10-08。已根据[修复前的差异报告](../content-audit/report.md)完成修复，并部署到 [Vercel 网站](https://hopkins-medtech.vercel.app)。

**结果：本次公开页面、公开搜索、分页及页面链接所发现的原站文字、有效图片和模块，均有可访问的业务页面或公开档案落点。** 这是对已发现范围的验收，不包含无法访问的后台记录或原站已失效的图片文件。

## 用户确认与已有新增内容

- 按用户确认，测试文字 `12313`、苹果图、“暂无图片”以及 2022 年客户数量声明完整保存在公开历史档案。Projects 业务页提供历史记录链接，不显示该客户数量为当前指标。
- 咨询和订阅暂不接后台，继续保留未接通提示和电话、邮箱联系。没有发送外部邮件或创建真实订阅。
- 27 篇论文导读、7 篇 Company Insights、4 篇 Science、8 个岗位、6 人团队、Laboratory Services 及待处理 LinkedIn 数据，均与修复前快照逐项相等。
- 已完成的主视觉、动效与资源库保留。原站分类作为独立历史资源区补充，避免改变新增内容的分类与检索。

## 文字、模块与链接修复

| 原差异 | 修复与位置 |
|---|---|
| 91 个额外旧详情地址未映射 | 扩展为 138 条完整旧地址映射；根地址保留首页，其余 137 条使用 308 跳转；未知 ID 仍为 404 |
| 原模块层级缺少独立入口 | Services 补回 Technology / Clinical / Regulatory / Marketing / Post-Market 五组、13 个末级入口；Projects 补回 10 个项目入口；原 32 个导航末级入口均有新站落点 |
| 原服务正文存在拼接错误或版本差异 | 7 个服务详情采用原站 29/30/32 号聚合记录中更完整、通顺的版本，注明来源；旧版本全文也有公开档案 |
| 联系、资源、CTA、行业标题文字缺失 | 已补回相应业务页；联系表单在现有主题选择外增加可选自由主题输入 |
| 两个 Preclinical Research 错链 | Biopharma、Pharmaceuticals 的链接均指向有效服务详情；36 个行业子栏目仍保留 |
| 原资源分类及文章导航缺失 | 补回 9 个主题、3 个类型、6 条原资源卡片、原缩略图与摘录、10 条上一篇/下一篇链接；旧分类 URL 可初始化筛选 |
| 测试、历史版本、空组件缺少公开落点 | 138 份公开原站记录，可从页脚、Resources、业务页和站内搜索访问；空正文记录按原状说明 |

业务入口：[按专业分类](https://hopkins-medtech.vercel.app/services#by-discipline)、[Projects](https://hopkins-medtech.vercel.app/services/projects)、[原资源区](https://hopkins-medtech.vercel.app/resources#original-resources)。

历史入口：[原站档案](https://hopkins-medtech.vercel.app/archive)、[全部原图](https://hopkins-medtech.vercel.app/archive/media)、[2022 年项目记录](https://hopkins-medtech.vercel.app/archive/records/news-1)、[测试记录](https://hopkins-medtech.vercel.app/archive/records/news-47)。

## 图片实际使用

84 个有效来源图片 URL，按文件 SHA-256 去重后为 **76 张原图**，全部在公开图库实际加载、可见，并保留原件下载。原件文件的 SHA-256 均与审计时一致。

- **58 张**同时用于业务页面，包括首页四张品牌图片、导航图片、Contact / Resources / Team 横幅、历史资源缩略图、CTA 图及背景、业务配图等。下拉菜单的三张图经打开菜单后验证，背景图按实际引用计入。
- **18 张**仅在公开档案使用：16 张旧界面小图标及 2 张测试/占位图。现有新站图标系统保留，原图也有独立可见位置，没有只保存到文件夹就计为已展示。
- 原站两条失败图片引用继续列入来源异常：`/images/202202231610531.png` 的有效 `/upload/` 同名版本已保留；`/images/inbannerbg1.png` 未找到可恢复文件。二者不计入 76 张有效原图。

每个来源 URL、原件、显示文件、业务页和公开图库锚点详见 [图片修复映射](restored-image-map.csv)。

## 实际部署验证

| 检查 | 结果 |
|---|---:|
| 原站读取记录 | 139 份，含一个重复根地址；对应 138 份公开档案 |
| 去重后的原站文字片段 | 656 / 656 在实际返回的正文中匹配 |
| 新站内容页及搜索页 | 246 / 246 返回 200 |
| 有效原图 | 76 / 76 实际加载、可见 |
| 旧地址 | 138 / 138 符合映射 |
| 图片及下载资源 | {summary['assets200']} / {summary['assetAndDownloadChecks']} 返回 200 |
| 站内目标锚点缺失 | 0 |
| 新增页面桌面/手机布局 | 本地及线上各 28 组，无横向溢出、坏图或 H1 数量异常 |
| 修复功能浏览器验证 | 本地及线上各 9 项通过 |
| 新增代表页 axe 检查 | 本地及线上各 7 页，自动检查 0 违规 |
| 已有页面回归 | 本地 42 组布局、8 项交互、5 页 axe 通过 |
| 已有动效回归 | 本地 10 项通过；线上 5 项通过，含实际动画、暂停、轮播和移动布局 |
| 类型与单元检查 | TypeScript 通过；13 / 13 项测试通过 |
| 生产构建 | 本地和 Vercel 均通过，253 个静态输出 |
| 元数据 | 245 条 sitemap 地址使用实际域名，新增档案已纳入；审阅版继续禁止索引 |

文字核对直接请求线上 HTML，检查正文，排除脚本 JSON、样式、隐藏辅助文字；匹配时规范化空白、标点和大小写。因此 656 是可核查的文本片段数，不是字数，也不表示逐字节一致。历史原句、来源日期及版本差异可在档案正文和可展开的原站标签区阅读。图片中原有文字通过未改写原图保留。

自动无障碍检查不等同于完整人工认证。本次没有重跑 Lighthouse；此前性能分数属于之前的版本，不作为本次新结果。咨询/订阅后台按用户选择暂缓，与本轮内容修复完成状态分开记录。现有 Jeff 职务/简介、正式隐私政策等待确认新增资料没有擅自补写。

## 交付与复核文件

- [页面与旧地址对应表](restored-page-map.csv)：138 条来源地址、新业务落点与原记录档案。
- [图片对应表](restored-image-map.csv)：84 个有效图片 URL，含 76 张去重原图。
- [线上文字逐项核对](live-text-coverage.csv)、[线上完整核验 JSON](live-coverage.json)。
- [线上浏览器记录](live-browser.json)、[线上元数据](live-metadata.json)、[服务版本修复](service-restoration.json)。
- [完整修复清单 JSON](restoration-manifest.json)、[部署版本](deployment.json)。
- `before/` 和 `protected-content.json`：修复前代码、内容快照及新增内容保护基准，仅本地保留，不公开部署。

原 `content-manifest.json`、`asset-manifest.json` 以及 `qa/content-audit/` 保留为修复前基线；完整补充范围以上述修复清单为准。原审计报告没有被覆盖成“从来没有差异”。

复核命令：先设置 `QA_ORIGIN` 和 `QA_LABEL`，依次运行 `node scripts/qa_content_repair.mjs`、`python scripts/verify_content_repair.py`。浏览器记录先生成，使图片统计包含打开下拉菜单后才显示的图片。`npm test` 核对受保护新增内容与原图文件哈希。

当前部署：`{deployment['deploymentId']}`。地址：[hopkins-medtech.vercel.app]({deployment['url']})。原公司网站域名与 DNS 未变更。
'''
write('qa/content-repair/report.md', report)

acceptance_path = ROOT/'qa/acceptance-report.md'
backup = OUT/'before/acceptance-report.md'
if not backup.exists():
    backup.write_text(acceptance_path.read_text(encoding='utf-8'),encoding='utf-8')
write('qa/acceptance-report.md', '''# HMC 网站验收报告

日期：2026-10-08。最新部署：[hopkins-medtech.vercel.app](https://hopkins-medtech.vercel.app)。

已完成原站内容修复。本次发现范围内的文字、有效图片、模块及子模块，均有业务页或公开档案位置；旧地址映射完整。测试占位与历史客户数量声明按用户确认放在公开档案，咨询/订阅后台按用户选择暂不接通。

完整结果、方法、范围与证据见 [内容修复与部署验收](content-repair/report.md)。

| 项目 | 最新结果 |
|---|---|
| 文字 | 656 / 656 个去重片段在实际线上正文中匹配 |
| 图片 | 84 个有效来源 URL / 76 张不同图片全部公开可见，原件哈希一致 |
| 页面、旧链接、资源 | 246 个页面、138 个旧地址、142 个图片/下载请求通过 |
| 受保护新增内容 | 论文、洞察、岗位、团队、实验室内容与修复前一致 |
| TypeScript、测试、构建 | 通过；13 项测试通过；253 个静态输出 |
| 布局、交互、无障碍 | 原 42 组布局 / 8 项交互 / 5 页 axe；新增本地及线上各 28 组布局 / 9 项交互 / 7 页 axe，全部通过 |
| 动效 | 本地 10 项、线上 5 项通过 |
| 部署 | READY；元数据与 sitemap 正确；保持审阅版禁止索引 |

此前验收记录保存在 [修复前快照](content-repair/before/acceptance-report.md)，其中 Lighthouse 分数属于此前版本，本轮未将其作为新的性能结果。

其余已知事实待确认项见 [待确认项](known-gaps.md)。原网站的失效图片引用不计为有效可迁移图片；未切换原站域名或 DNS。
''')
print('Wrote repair report, acceptance, deployment, 84 image mappings and restoration manifest.')
