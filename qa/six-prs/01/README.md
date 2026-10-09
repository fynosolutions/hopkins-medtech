# 1/6 结构化数据与抓取准备

从 main 独立整理 Organization、Person、Article、Service、JobPosting 生成逻辑和可见实习 FAQ/FAQPage；原始来源信息在文章顶部展示。公司身份使用同一份已确认数据。Service 先输出名称与提供方，具体摘要在第 2 个 PR 中完善。

按毛最新一页版要求提供 public/llms.txt。robots 仍 Disallow: /，页面和文本响应继续由全站 X-Robots-Tag 设置 noindex，不改变 SITE_INDEXABLE、域名或 DNS。sitemap 使用记录的更新时间，不按构建时间刷新。

没有自行补事实：8 个岗位开放状态、发布日期和地点未确认，当前不输出 JobPosting；38 篇本站摘要缺少确认的署名与首发日期，字段省略。五位团队成员只输出已有本人链接。没有新增管理层、头像或大学关系声明。

验证：22 项测试、类型检查、生产构建通过。Schema Markup Validator 代码输入报告见 schema/report.json；Google Rich Results Test 的三个指定页面结果在 PR 描述记录。岗位缺少真实开放信息时，即使其他标记通过校验，也不能声称 JobPosting 已完成。

所有旧成果完整保存在 codex/backup-before-six-prs；本地另有 .git/before-six-prs.bundle。依赖保护要求为至少一个有权限审核人的批准与 CI；不自动合并。
