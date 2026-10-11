<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 网站内容的长期原则：宁缺勿错

以下原则适用于今后所有网站修改，包括可见文案、图片说明、SEO 元数据和结构化数据：

- 任何没有来源、未经确认的事实都不要写；缺少依据时省略或留待确认，不推断、不编造。
- 不要暗示 HMC 与约翰霍普金斯大学（Johns Hopkins University）有关系。
- 不要把合作方（HML、DiaCarta 等）的资质、认证或获批记录写成 HMC 自己的；提及这些事实时，必须有来源并清楚标明所属主体。

## 网站修改的固定验收原则

- 每项改动通过开发分支提交 PR，不直接向 `main` 提交。按主分支保护要求，至少获得 1 个有权限审核人的批准，并通过 CI 后才能合并；不得绕过这些要求。
- 每个新增或修改的 JSON-LD 都必须通过 Google Rich Results Test 或 Schema Markup Validator 校验，并在 PR 中记录校验结果。结构校验不能代替事实与来源核实。
- 改完后向毛提供修改说明、预览链接和验收结果，由毛决定是否打开索引。未经毛明确同意，保持 `SITE_INDEXABLE` 关闭，不通过 robots 或其他设置变相开放抓取或索引；代码完成或 PR 合并不等于获准开放索引。

## 暂时不要做

- 不要打开 `SITE_INDEXABLE`，不要改动 `hopkinsmedtech.com` 的 DNS 或域名配置，等待毛明确决定。
- 不要写“与约翰霍普金斯大学无关／有关”等声明；肯定或否定关联的声明都要等待毛确认事实。
- 不要写公司登记号，目前尚未确认。
- 2026-10-10 用户转达毛确认：Jeff Wu 是联合创始人，本人 LinkedIn 为 https://www.linkedin.com/in/jeffwu774/。可恢复团队页、团队展示、站内搜索和 sitemap；2026-10-10 晚毛要求把他 LinkedIn 上的履历（NeoVentech、Johnson & Johnson、Arkema、学历，来自毛 10-04 提供的个人主页截图）写进他的个人页，取代此前「不补履历」；仍不写照片、专利、观点或引语，也不写 NeoVentech 与 Hopkins 的关系。
- 2026-10-10 用户转达毛确认：8 个岗位输出 JobPosting，工作方式写 Remote / Onsite；不写是否仍接受申请或首次发布日期，不推断具体地址、远程国家范围或全远程。Schema 校验通过不等于满足 Google 招聘富媒体结果的必填项，验收报告必须说明区别。
- 2026-10-11 毛确认：公司在招 4 个全职岗位（Director, Regulatory Affairs；Quality Systems Manager；Senior Manager, Data Engineering and AI；Clinical Project Manager），内容在 `content/full-time-roles.json`，Careers 页全职在前、实习在后；不写薪酬、地点和工作方式（未确认），未输出 JobPosting 结构化数据。About 页同时展示公司和团队；团队页只有 Homer Wu 用头像（取自他本人 LinkedIn 公开头像），Jeff Wu 与 Homer Wu 放大成一行，其余成员只列姓名和职位。
