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

## 网站定位：公司官网，不是卖实习的网站（毛 2026-10-11 定，长期）

- 这是 HMC 的公司官网：服务、行业、团队、资料、全职岗位、实习，都是公司信息的一部分。实习只是 Careers 里的一个部分，不能成为全站的主角。
- 靠内容本身做到专业，不靠声明：不写「我们不卖实习」「本站不是培训项目」这类辩解句；用真实的公司内容（业务、团队、公开记录、全职岗位）把比重拉回来。
- 首页、About、Services、Industries、Resources、Contact、页脚、站点标题和描述里，实习只在 Careers 提到。
- **申请方式只写「投简历」（毛 2026-10-11 定，取代此前「只在三处写」）**：全站任何地方（页面、岗位说明、岗位 PDF、FAQ、结构化数据、llms.txt、页面描述）都不出现 education partner、referral、中介、DBC、转介绍一类说法。公司就是一家正常招聘的公司；学生从哪里来是业务层面的事，不写在网站上。
- Careers 的顺序固定为：公司与业务 → 全职岗位 → 实习项目。新增内容先想「一家正常的 CRO 官网会不会这样写」。
- 不留半成品痕迹：没接通的表单、订阅框、死链接、「即将上线」提示不上线。

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
- 2026-10-11 毛定：全站联系邮箱统一为 info@hopkinsmedtech.com（包括原网站档案页），不再出现个人邮箱 HomerWu@。只改 `content/company.json` 即可带动页面主要位置。
