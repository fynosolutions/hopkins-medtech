# Issue #1：逐项修改前后对比

日期：2026-10-09。对比基线：`5e6fd62`。范围仅为用户确认的七类要求；未新增 FAQ、ItemList、学员评价、项目成果或员工反馈，也未做全站文案重写。

## 1. 结构化数据

| 项目 | 修改前 | 修改后 | 状态 |
|---|---|---|---|
| Organization | 无 JSON-LD，公司资料分散 | 共用 `content/company.json`；全站输出法人名、品牌名/简称、纽约办公室、电话、公司域名邮箱和 LinkedIn；其他实体引用同一 `@id` | 已实现，外部校验通过 |
| Person | 团队仅有可见介绍 | 原有五位成员增加姓名、原职位、worksFor；只有已有本人 LinkedIn 的成员输出 sameAs；团队页及详情均接入 | 已实现，外部校验待完成 |
| JobPosting | 八份岗位说明未标成正在招聘 | 已实现 INTERN、hiringOrganization、真实编号及推荐渠道的生成逻辑；开放状态、发布日期、地点/远程范围和确认来源齐全才输出 | 八岗位均待事实确认，当前不输出；未声称完成发布 |
| Article | 44 个资源详情页无结构化数据 | 区分本站文章与引用来源，加入 publisher、citation、isBasedOn；6 篇历史文章使用已记录的原作者/日期 | 已实现，部分外部校验待完成 |
| 摘要作者与日期 | 数据中的 author/date 主要属于原论文或原帖 | 38 篇本站摘要不把来源作者/日期冒充本站首发信息；原信息放在引用来源中；论文所属期刊用 Periodical 表达 | 本站作者、首发日期待确认，字段暂缺 |
| Service | 无服务结构化数据 | 27 个服务详情页输出 Service，provider 统一指向 HMC；不写合作方认证 | 已实现，外部校验待完成 |

岗位编号沿用原稿与负责人补充说明中的 `JD-HMT-A01–A04`、`JD-HMT-B01–B04`，没有改为 A01–A08。

## 2. 标题与描述

| 页面 | 修改前 | 修改后 |
|---|---|---|
| 实习列表 title | Careers | Medical Device, IVD and Digital Health Internships |
| 实习列表 H1 | Bring your curiosity. Build your experience. | 与上述核心 title 一致 |
| 实习列表 description | Learn through meaningful work in Healthcare & MedTech and AI & Digital Health. | Educational partner internship referrals at HMC, a medical device and IVD CRO with a New York office. Explore eight roles and supervision arrangements. |
| 八个岗位 | title 使用完整长岗位名，description 直接截取摘要 | H1/title 共用简洁的 internship 标题；description 说明 educational partner、medical device、IVD、CRO 和公司 New York office；页面正文保留完整岗位名 |

title 的品牌后缀仍为 `| Hopkins MedTech`。纽约只描述公司办公室，不推断为岗位工作地点。

八个岗位的完整逐页 title/description 对比见 [careers-before-after.json](careers-before-after.json)。原岗位数据、15 个章节和 PDF 文件均保持不变。

## 3. 事实展示

| 项目 | 修改前 | 修改后 |
|---|---|---|
| 项目一览 | 带教、节奏、协议等分散在段落和条款中 | 增加带 caption、行列标题的六行表格；只整理原有内容 |
| 页脚 | 品牌名、地址、电话和 LinkedIn，部分硬编码 | 增加 Hopkins MedTech Group LLC；地址和联系方式读取共用数据，联系页主地址同步 |
| Company updates | 七篇公司动态混在资源内容里 | `/resources#company-updates` 集中列出七条，按原 LinkedIn 日期排序，标题直达原帖，并链接本站摘要 |
| 合作方 | 合作事实在文章内 | `/resources#documented-partnerships` 展示 HML、DiaCarta、2023-07-24 日期和原公告；明确 HMC/HML 为不同主体 |
| Public record | FDA 和 EMMA 来源分散 | `/resources#public-record` 集中列出三场 FDA 记录及五篇 EMMA 历史文章，链接原始发布者 |
| 首页业务 | 五张业务卡片 | 四张卡片，各一句说明：临床性能研究、FDA/欧盟申报支持、质量与合规体系、通过合作方提供的实验室配套 |
| FDA 场次背景 | 现有摘要将三场统称 COVID-19 背景 | 按原始记录将 2022-09-21 标为 monkeypox，摘要改为 COVID-19 与猴痘公共卫生紧急事件；仅同步这一条保护快照 |

公开记录没有被写成 FDA 对 HMC 的背书；EMMA 文章没有被写成对 HMC 的评价。原站历史档案保留历史标记及原文，未把旧记录包装成现行资质。

## 4. 资质与证书

| 位置 | 修改前 | 修改后 |
|---|---|---|
| 服务详情 | 资质归属提醒不集中 | 明确 510(k)、EUA、CE marking、IVDR 是客户服务路径；实验室认证归实际提供方 |
| CGMP | “Our accreditation with ANSI-ASQ and ANSI…” | 删除未确认的本公司认证主张；审计工作改述为质量体系及可追溯性审查 |
| Clinical Operations | “…advanced technology, and full certifications.” | 改为具体研究需要确认实验室及其他提供方的资格 |
| Preclinical Research | “more than 120 laboratories and centers”及节省时间/费用保证 | 删除未确认数字和保证；按项目确认实验室、研究要求与服务范围 |
| Quality Systems | “FDA-approved Master Device Profile (DMR)” | “device master record (DMR) documentation” |
| Regulatory Submission | 对业务结果、准确及时申报和快速获批的保证 | 改成材料准备与问题协调支持；审批决定由审查机构作出 |
| 客户获批编号/认证样张 | 无已获授权、已确认的新材料 | 未添加编号、认证徽章、数字或样张 |

五个服务页面的完整原句与替换结果见 [service-claim-changes.json](service-claim-changes.json)。这部分是资质与事实纠正，不是全站语言风格改写。

## 5. 管理层与个人资料

- Homer Wu, Ph.D. 的 Chief Scientist 头衔和原履历保留，未推断为其他职务。
- Homer 的已记录本人 LinkedIn 从简介上方移至简介末尾；其他四人没有确认链接，未猜测补充。
- 第二位创始人/管理层资料尚未收到，未新增。
- Jeff Wu 仍未出现在团队页、站内人物搜索或 sitemap 中。

## 6. 图片

- 原有首字母头像保留，未使用 AI 人像或虚构办公室照片。
- 真实头像组件的 alt 模板由仅姓名改为“姓名、职位、Hopkins MedTech Compliance”，待真实照片确认后使用。
- About 中原站接待区品牌图的 alt 改为描述素材内容，不声称是已核实的现场办公室。
- 构建页面共检查 875 个图片引用，缺失 alt 为 0；三个装饰或重复图片引用保留空 alt。见 [image-alt-audit.json](image-alt-audit.json)。
- 完成证书样张尚未提供并审阅，因此没有展示。

## 7. 抓取准备

| 项目 | 修改前 | 修改后 |
|---|---|---|
| llms.txt | 无 | `docs/search-readiness/llms.txt` 准备公司一句话介绍及核心页面链接；没有公开路由 |
| robots 允许规则 | 仅现行索引开关逻辑 | 非公开目录准备四种指定爬虫的允许规则；生产逻辑和关闭状态不变 |
| sitemap | 仅 url | 去重后的 244 个页面均有 lastmod；使用记录在内容文件中的真实共享结构化数据更新日期，构建时不会自动刷新 |

没有改 `SITE_INDEXABLE`、`hopkinsmedtech.com` 的域名或 DNS，也没有发布大学关联声明、公司登记号。

## 验证与仍需完成的验收

- 本地：22 项测试、类型检查、生产构建通过。
- 浏览器：15 个页面 × 桌面 1440 / 手机 390 两种尺寸，共 30 次检查通过；无页面脚本错误、横向溢出或缺失 alt。
- 实习表格与公开记录在禁用 JavaScript 时仍可读取。
- robots 保持 `Disallow: /`，页面保持 noindex；`/llms.txt` 和 `/about/team/jeff-wu` 返回 404。
- JSON-LD：最终构建有 78 份不同 payload。早期 45 份曾通过 Schema Markup Validator；之后纠正了 27 份论文引用中“期刊不是出版机构”的表达，因此最终当前版本有 18 份可复用的通过结果，其余 60 份需要补验。外部校验器已触发人工验证，未绕过、未把待验项标成通过。
- 可将 [pending-code-input.html](schema/pending-code-input.html) 的代码粘贴至 Schema Markup Validator 补验；逐 payload 状态见 [schema/report.json](schema/report.json)。本地 JSON 解析和回归测试不能代替这项外部验收。
- 岗位事实、本站摘要作者/首发日期、新管理层、照片、个人链接和证书仍待确认。
- GitHub API 核查时未返回 main 的分支保护或生效 ruleset；本轮按用户要求执行 PR、至少一人批准与 CI，未自行修改仓库管理设置。需要仓库管理员核对强制保护配置。
- Vercel 预览部署返回 `Not authorized`，未创建线上预览，也未更改生产部署。可在本机通过 `http://localhost:3102` 审阅本轮版本，截图与代码通过 PR 提供；恢复项目访问后再生成预览。

所有 PR 均为草稿，不自动合并；后续按依赖顺序审核。验收完成后由毛决定是否打开索引。

## 视觉对照

- [首页修改前](before/home.png) / [首页修改后](after/home-1440.png)
- [实习页修改前](before/careers.png) / [实习页修改后](after/careers-1440.png)
- [资源页修改前](before/resources.png) / [资源页修改后](after/resources-1440.png)
- [Homer 简介修改前](before/homer.png) / [Homer 简介修改后](after/about-team-homer-wu-1440.png)

来源入口：原始 issue、公司既有资料、DiaCarta 2023-07-24 公告、三份 FDA 原始 transcript、五篇 EMMA 原文；具体 URL 记录在 `content/company.json`、`content/public-evidence.json` 和既有文章来源字段中。
