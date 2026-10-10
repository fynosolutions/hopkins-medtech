# 1/6 结构化数据与抓取准备

从 main 独立整理 Organization、Person、Article、Service、JobPosting 生成逻辑和可见实习 FAQ/FAQPage；原始来源信息在文章顶部展示。公司身份使用同一份已确认数据。Service 先输出名称与提供方，具体摘要在第 2 个 PR 中完善。

按毛最新一页版要求提供 public/llms.txt。robots 仍 Disallow: /，页面和文本响应继续由全站 X-Robots-Tag 设置 noindex，不改变 SITE_INDEXABLE、域名或 DNS。sitemap 使用记录的更新时间，不按构建时间刷新。

2026-10-10 毛的新确认：增加 Jeff Wu 的 Co-founder、本人 LinkedIn 和对应 Person/Organization 关系；恢复其页面、团队、搜索、sitemap。8 个岗位输出 JobPosting，工作方式为 Remote / Onsite，不填申请状态、发布日期、具体地址或远程国家。38 篇本站摘要的未确认署名与首发日期仍省略；不补履历、其他职务或照片。

2026-10-10 更新后：23 项测试、类型检查、生产构建通过。新 Schema 校验见 qa/mao-confirmed-2026-10-10/schema-step1/report.json；原 schema/report.json 是旧版本记录。此次 JobPosting 按毛要求省略 datePosted 和具体地点，不满足 Google 招聘富媒体结果的完整字段要求，不声称 Google 专项验收通过。

所有旧成果完整保存在 codex/backup-before-six-prs；本地另有 .git/before-six-prs.bundle。依赖保护要求为至少一个有权限审核人的批准与 CI；不自动合并。
