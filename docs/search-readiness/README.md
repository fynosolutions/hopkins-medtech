# 抓取准备稿（未启用）

这里的 `llms.txt` 与 `robots-allow.txt` 仅供 PR 审阅，不在 `public`、`app` 路由或生产 robots 中引用。

- 保持 `SITE_INDEXABLE=false`，当前 robots 继续 `User-Agent: * / Disallow: /`，页面继续 noindex。
- 不修改 `hopkinsmedtech.com` 的域名、DNS 或环境变量。
- 允许规则按本轮要求准备，不代表各爬虫用途相同，也不表示已获准开放。
- 毛决定开放前，核对最终规范网址、各爬虫用途和允许范围，再单独提交启用改动。不得为了外部校验临时打开索引。
- `llms.txt` 不是收录或 AI 引用保证。

Sitemap 的日期由 `content/page-updates.json` 提供。2026-10-09 新增全站 Organization JSON-LD，因此本轮所有页面有一次有依据的结构化数据更新；不会随着每次构建或访问自动刷新日期。以后单页有重要内容更新时，维护对应 `pages` 条目；只有真正修改全站共享结构化数据时才更新共享日期。
