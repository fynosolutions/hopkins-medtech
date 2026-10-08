# Our Team 头像与示例人物更新

日期：2026-10-08。页面：[Our Team](https://hopkins-medtech.vercel.app/about/team)。

## 用户确认的范围

- 图 1 指定为 Jeff Wu，图 2 指定为 Homer Wu，均使用用户提供的原文件。
- 用户确认后四个展示位替换为四位虚构示例人物，采用两位白人、两位黑人合成人像，并明确标注示例身份。
- 原站 Jennifer Stanford、Wendy Zhou、Andrew Wayland、Qian Cheng 的资料保留为历史记录，不与新合成人像关联。

## 当前展示

| 人物 | 头像 | 资料 |
|---|---|---|
| Jeff Wu | 用户提供原图 | 保留指定 LinkedIn；职务与简介仍待确认 |
| Homer Wu, Ph.D. | 用户提供原图 | 保留原 Chief Scientist 职位及完整简介 |
| Emma Whitmore | 白人女性合成人像 | Clinical Operations 示例岗位与职责 |
| Daniel Reed | 白人男性合成人像 | Laboratory Services 示例岗位与职责 |
| Maya Brooks | 黑人女性合成人像 | Business Development 示例岗位与职责 |
| Marcus Bennett | 黑人男性合成人像 | Biostatistics & Clinical Data 示例岗位与职责 |

四位虚构人物的卡片和详情页显示 `Fictional example · AI portrait`。详情标题、正文和搜索结果也区分示例人物；不附真实人员 LinkedIn、不套用原成员履历、不声称实际任职或拥有真实学历资质。Jeff、Homer 不带示例标记。

团队列表、六个个人详情及首页人员预览同步更新。图片保持原始比例，使用 Next.js 图片优化。用户提供的两张原文件字节未改动。

## 原内容保留

原成员数据继续保存在 `content/site.json`；当前展示通过 `lib/team.ts` 与 `content/team-examples.json` 组合。原四位成员的旧详情页仍可访问，标题与正文标注历史记录。完整原团队资料仍在[公开档案](https://hopkins-medtech.vercel.app/archive/records/hmc-38)。

论文、洞察、岗位、服务和原站档案未改写。原内容保护测试继续通过。

## 验证记录

- TypeScript 检查与本地生产构建通过，257 个静态输出。
- 原有 13 项测试通过，包含原内容保护与原图哈希检查。
- 本地 390 / 768 / 1440 三种宽度 × 首页、团队列表、六个个人详情，共 24 组布局通过；无横向溢出、坏图或 H1 数量异常。
- 六项浏览器检查通过，覆盖六张头像、四个示例标识、Jeff 提示、原四人资料、首页与搜索标识、照片文件完整性。
- 团队列表、Jeff 详情、示例人物详情三页 axe 自动检查无违规；无浏览器脚本错误。
- 实际 Vercel 部署已完成：`dpl_ExWskmEg9oSYZpRCnUG9E374fax4`。线上重复验证 24 组布局、六项功能、三页 axe，全部通过；两张用户原图与线上文件字节完全一致。最终记录见 `live-report.json`，部署信息见 `deployment.json`。

头像原件和哈希：[portrait-provenance.json](portrait-provenance.json)。本地验证：[local-report.json](local-report.json)。

复核命令：设置 `QA_ORIGIN` 和 `QA_LABEL` 后运行 `node scripts/qa_team.mjs`。所有截图与验证记录保存在本目录；不部署 QA 文件。
