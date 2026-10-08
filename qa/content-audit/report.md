# HMC 原站 → 新站完整性自检

> 后续状态（2026-10-08）：本报告列出的差异已完成修复并重新部署。最新结果见[内容修复与部署验收](../content-repair/report.md)：656 个文字片段、76 张有效原图和 138 个旧地址均通过线上复核。测试与历史声明按用户确认进入公开档案，后台按用户选择暂不接通。以下内容保留为修复前的原始检查记录，原“未通过”结论描述的是修复前版本。

检查日期：2026-10-08。原站：[hopkinsmedtech.com](http://www.hopkinsmedtech.com/)；检查的新站：[hopkins-medtech.vercel.app](https://hopkins-medtech.vercel.app/)。

**结论：没有全部用到，目前不能通过“原站全部文字、图片、模块和子模块均已保留”的验收。** 基线中的主要业务内容已迁移，但存在原图未使用、部分文案未保留、扩展搜索记录未映射、分类及文章导航未沿用等问题。归档成功、页面可访问、内容实际展示是三个不同指标。

本轮只完成检查、补采证据和差异报告；没有修改线上页面或重新部署。执行指南作为验收参考，用户这次直接要求的“自检”决定本轮范围。

## 1. 核查范围和方法

- 重新读取原站 48 条记录：47 个基线地址及一个重复根地址。全部 HTTP 200，与已有归档的提取文字一致。
- 读取新站 99 个内容页面，全部 HTTP 200；比对实际返回的页面正文，排除脚本里的 JSON、隐藏辅助内容，不能以 `content/site.json` 存在文字代替页面展示。
- 检查原站 12 个资源分类筛选选项，以及空关键词、FDA、Clinical 搜索，再递归跟随分页和上一篇/下一篇。共读取 125 个列表/详情请求，全部 HTTP 200；发现 **97 个 NewsDetail 地址，其中 91 个不在原先基线中**。
- 按 SHA-256 去除相同图片的不同 URL。检查 `<img>`、内联样式、背景图和已有 CSS 素材记录；未把 JS、CSS、浏览计数请求当作图片。
- 在实际部署运行浏览器核验，检查 42 个相关页面：41 个直接使用的原图 URL 均加载成功并可见（对应 37 份不同图片内容）；36 个行业折叠子栏目均可展开阅读；历史资源筛选实际显示 6 条；无脚本错误。
- 额外核验 91 个新发现旧地址在新站域名下的表现：**91/91 返回 404**，未建立旧地址迁移。

本报告覆盖本次公开页面、公开搜索、分页和页面链接可发现的范围，不将未公开后台记录列为已检查。发现的 91 个额外详情地址多数是服务、人员或组件的重复记录，并非 91 篇独立漏迁文章。

## 2. 文字、模块和子模块核对

| 原站内容 | 当前新站 | 结论 |
|---|---|---|
| 顶部导航的 32 个末级入口 | 全部有相应内容落点 | 内容入口有对应；原导航层级已调整 |
| 基线 26 个独立服务详情 | `/services` 及对应详情页；新站另增 1 个 Laboratory Services | 基线正文已保留，不能据此推断扩展记录也全部保留 |
| 5 个行业 | IVD、Medical Devices、Gene & Cell Therapies、Biopharma、Pharmaceuticals | 全部保留 |
| 行业下 36 个生命周期子栏目 | 6 + 6 + 8 + 8 + 8 个折叠区 | 标题和正文 36/36 对应；34 个延伸链接正确，2 个仍回到原站占位地址 |
| 原团队 5 人 | Homer、Jennifer、Wendy、Andrew、Qian 的独立简介 | 5/5 姓名、职务和完整简介有对应；新增 Jeff 不计入原站覆盖率 |
| 基线 5 篇知识文章 + 2023 年招聘 | Resources → Historical Resources | 6/6 正文保留；文章顺序导航、部分原缩略图未保留 |
| 首页 4 个重点业务入口 | EUA、510(k)、Clinical Study、OTC Drug 快捷入口 | 全部保留 |
| 首页公司优势和 3 项价值观 | 首页概括，原完整文本放在 About | 属于移位保留，不是删除 |
| 2 条客户评价 | 首页轮播和 About | 原文与署名保留；源站原本截断的内容没有补写 |
| 电话、邮箱、地址 | Contact 和页脚 | 信息保留；电话格式、地址缩写及 Headquarters 标签有改动 |
| 联系表单 | 主题、姓名、电话、邮箱、正文 | 字段类别保留；主题从自由输入改为下拉；接收后台未连接 |
| Newsletter | 页脚订阅输入框和按钮 | 界面保留，真实订阅接收未连接 |
| 站内/资源搜索 | 新站全站搜索、资源关键词筛选 | 有替代功能；旧搜索中额外记录尚未完整映射 |
| Chat with us / 地图区 | 联系入口保留；没有地图模块 | 原站 Chat 是 `#`，地图容器为空，未发现可迁移的有效客服或地图信息 |

原导航的 Projects 一级入口已并入 Services，10 个原项目末级页面均存在。Services 的 Technology / Clinical / Regulatory / Marketing / Post-Market 五组及其 13 个末级入口，改按新业务分组展示。这符合指南允许重排的方向，但不等于“原有层级原样使用”。

**两个需修复的行业子栏目链接：**

- [Biopharma](https://hopkins-medtech.vercel.app/industries/biopharma) → Preclinical Research → Learn more：目前返回原站 `submissions.aspx?ClassID=66#`。
- [Pharmaceuticals](https://hopkins-medtech.vercel.app/industries/pharmaceuticals) → 同名子栏目：目前返回原站 `submissions.aspx?ClassID=67#`。

原链接本来是 `#` 占位，新站应指向已经存在的 `/services/preclinical-research`。正文已保留，但这两处不能算有效的详情入口。

## 3. 已确认的文字与界面差异

| 差异 | 原站位置 | 当前情况 |
|---|---|---|
| 联系页原标题及完整引导段落 | [原 Contact](http://www.hopkinsmedtech.com/Contact.aspx?ClassID=82) | 改成新文案，原段落没有完整展示；其中针对 FDA warning letter 的提问未保留在联系页 |
| 资源中心原介绍段落 | [原 Resources](http://www.hopkinsmedtech.com/News.aspx?ClassID=102) | 被新介绍替换 |
| 原联系 CTA 句子 | 首页及内页公共区域 | 换成新文案；联系按钮仍在 |
| 9 个旧主题分类 | 原 Resources 筛选 | 只有 Digital Health 保留为同名选项；其余 8 个未沿用，包括 CBD、Combination Products、Cosmetics、COVID-19、EU MDR、Gene and Cell Therapies、MDSAP、Medical Devices |
| 3 个旧资源类型 | Blogs / Case Studies / Body of Knowledge (BOK) | 改为 Company Insights / Research Papers / Science / Historical Resources |
| 上一篇 / 下一篇 | 6 条历史内容详情 | 未保留；目前只有返回资源列表等入口。原首尾 PERIOD 是占位符，不是另两篇文章 |
| 5 个行业生命周期总标题 | 如 IVDs Lifecycle | 统一改成 The product lifecycle；下属 36 个栏目未丢失 |
| 其他标签 | Biostatics、Join Us、地址、订阅等 | 部分纠正拼写、改名或缩写；Subscribe 可访问名称仍在箭头按钮上，不能算订阅按钮被删 |

本次原站 12 个分类筛选请求均没有返回文章条目，不能因为某分类选项存在，就断言该分类还有未获取文章。新站筛选功能存在，但分类体系不等同于原站。

基线完整文本辅助检查得到 39 组未逐字匹配的独有字符串，已人工区分为真正未保留、改名、缩写、功能替换和导航删除。**不是 39 段业务内容全部丢失。** 详见 `text-differences-reviewed.csv`。

## 4. 搜索分页新发现的 91 个详情地址

| 分类 | 数量 | 说明 |
|---|---:|---|
| 完整正文已在新站某页匹配 | 75 | 大多是服务、行业子栏目、人物等重复记录；正文有对应，旧地址仍缺跳转 |
| 空正文组件记录 | 9 | 首页快捷入口、价值观、评价等记录，不能当成缺少 9 篇文章 |
| 有文字差异的记录 | 7 | 包括下表中的版本差异、文案遗漏、标签改写及测试占位 |
| 新站旧路径未映射 | 91 | 全部实测 HTTP 404；不代表 91 份正文全丢失 |

| 原地址 ID | 记录内容 | 评估 |
|---|---|---|
| [1](http://www.hopkinsmedtech.com/NewsDetail.aspx?ID=1) | 项目概述，包含“超过 50 个客户”及项目列表引导 | 原段落未在新站展示。页面日期为 2022-02-23；该数字只能作为历史原文保留，不能未经核实改成当前业绩承诺 |
| [29](http://www.hopkinsmedtech.com/NewsDetail.aspx?ID=29) | Clinical 聚合正文：项目管理、临床运营、数据、生统、QA | 业务模块有对应，但 22 个文本片段与新站未逐字匹配；该版本多处比原独立服务页更通顺 |
| [30](http://www.hopkinsmedtech.com/NewsDetail.aspx?ID=30) | Regulatory 聚合正文 | FDA / IVDR 的 2 个片段与当前独立服务页版本不同 |
| [32](http://www.hopkinsmedtech.com/NewsDetail.aspx?ID=32) | Post-Market 聚合正文 | 2 个片段与当前独立服务页版本不同 |
| [112](http://www.hopkinsmedtech.com/NewsDetail.aspx?ID=112) | 标题为 Intended Use Validation，正文实际为资源中心简介 | 资源中心原引导段落未保留；不能误当成另一篇独立 IUV 文章 |
| [94](http://www.hopkinsmedtech.com/NewsDetail.aspx?ID=94) | Headquarters、Phone、Email | 原标签未逐字匹配；电话和邮箱信息已有对应 |
| [47](http://www.hopkinsmedtech.com/NewsDetail.aspx?ID=47) | 仅有 `12313` | 疑似测试占位，已记录；不建议当作正常业务文案发布 |

上述三份聚合服务正文主要是不同源页面版本造成差异，不能把 26 个差异片段全部解释成服务能力丢失。另发现新站照搬了原独立服务页自身已有的拼接错误，例如 Project Management 开头的两种句式粘连。这是原站质量问题随迁移保留下来；本轮找到了更通顺的原站聚合版本，后续应逐项比对整理并记录版本来源。

## 5. 图片与图片内信息

| 口径 | 数量 |
|---|---:|
| 基线中有效图片 URL | 81 |
| 本轮扩展发现的有效图片 URL | 3 |
| 有效原图片 URL 合计 | **84** |
| 按文件内容去重后的原图 | **76** |
| 新站实际使用的不同原图 | **37** |
| 没有在新站使用的不同原图 | **39** |

37 张已用图对应 41 个直接引用 URL，另有 4 个来源 URL 与已用图字节完全相同，按已覆盖处理；没有把重复 URL 重复计算为遗漏。新站自制图形、Lucide 图标不计为原图复用。

| 未使用类别 | 不同原图数量 |
|---|---:|
| 原首页轮播大图 | 3 |
| 原导航下拉背景 | 5 |
| Contact / Resources / Team 顶部大图 | 3 |
| 联系 CTA 电话配图 | 1 |
| 历史资源缩略图 | 3 |
| 原装饰背景 | 2 |
| 原搜索、菜单、联系、文章元信息等小图标 | 19 |
| 扩展页 CRO 品牌横幅 | 1 |
| 扩展页测试苹果图和“暂无图片”占位图 | 2 |
| 合计 | **39** |

原首页三张图及扩展品牌横幅中含有 “CRO for IVD and MedTech Innovations” 字样。这些原图及该完整口号没有原样出现在新站；CRO、IVD 和医疗器械的定位已有文字表达，但不能据此说原图片信息全部已使用。

两张测试/占位图片的未使用属于应明确记录的排除项，不宜机械放进正式页面；其他装饰图也可重排或替换，但应先在迁移清单说明，而不是把“原文件保存在目录”当作展示验收通过。

额外发现原站内联 CSS 引用了已 404 的 `/images/inbannerbg1.png`；此前已有 `/images/202202231610531.png` 404（同名 `/upload/` 图片可用）。这些失败引用不计入有效图片数量。此前“97 个素材地址、96 个保存成功”还包含 JS、CSS 和浏览计数 HTML 请求，不能作为图片数量或图片复用率。

## 6. 后续修复清单

1. 补全发现范围与映射：给重复详情建立合理落点；对空组件、历史版本、测试记录分别说明处理方式，补齐有效旧 URL 跳转。
2. 补齐原联系页、资源介绍、项目历史概述等独有文字；核对 29/30/32 三份更通顺的聚合服务版本，修复已沿用的拼接错误并保留来源。
3. 为未用原图建立明确页面位置或排除理由；优先处理真实品牌横幅、首页图片、资源缩略图、Team/Contact 图。
4. 修复两个 Preclinical Research 链接；明确旧资源分类的对应关系，补足需要保留的文章顺序导航。
5. 单独完成咨询/订阅真实接收，才能对相应业务功能验收；本次未发送任何表单或邮件。

以上是检查发现的未完成工作，不代表本轮已经修复。

## 7. 证据文件

- `review.html`：可筛选图片使用状态、浏览遗漏图片、查看模块和扩展记录的本地报告。
- `all-image-usage.csv`：84 个图片地址的完整合并清单；`image-usage.csv` / `extra-images.csv` 为基线与扩展拆分。
- `navigation-modules.csv`：32 个末级导航入口及对应新站路由。
- `industry-subsections.csv`：36 个子栏目正文与链接核验。
- `page-coverage.csv` / `extra-page-coverage.csv`：基线及新增 91 个详情地址对照。
- `text-differences-reviewed.csv`：基线 39 组字符串差异及人工分类。
- `extra-text-blocks.csv`：扩展详情正文逐段对应；`extra-reviewed-differences.csv` 包含相近新文案及人工分类。
- `resource-filters.csv`：12 个原分类选项。
- `browser-verification.json`：浏览器实际加载、展开及历史资源筛选结果。
- `extra-redirect-check.json`：91 个扩展旧地址在新站返回 404 的逐项证据。
- `coverage.json` / `extra-resources.json` / `extra-coverage.json`：机器可读检查记录。
- `source-live/`、`new-live/`、`extra-source-pages/`、`additional-assets/`：本轮读取的页面及新增图片原件。

复现顺序：`audit_content_coverage.py` → `audit_content_details.py` → `audit_discover_resources.py` → `audit_extra_coverage.py` → `audit_content_browser.mjs` → `build_audit_review.py`。所有脚本仅检查公开页面并生成本地报告，不修改业务内容，不触发部署。
