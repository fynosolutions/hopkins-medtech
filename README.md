# Hopkins MedTech Compliance 网站重做

英文网站，采用 HMC 原有青绿、深绿、蓝和黄绿色；参考 RQM+ 的大字号、分区、卡片、导航与 CTA 组织方式。Next.js App Router + TypeScript，内容存储在本地 JSON，适合后续迁移 CMS。

网站：[hopkinsmedtechcompliance.com](https://hopkinsmedtechcompliance.com/)（Vercel 团队 `fynosolutions`，项目 `hopkins-medtech`，main 分支自动部署；早期预览 hopkins-medtech.vercel.app 在 `wei34` 账号下，保留作回退）；公开代码仓库：[fynosolutions/hopkins-medtech](https://github.com/fynosolutions/hopkins-medtech)。

仓库包含应用代码、网站内容和图片、下载文件、测试及验收资料。原始工作文档、`source-archive/`、本地环境变量、账号配置、依赖和构建缓存不进入版本控制。网站运行、构建和单元测试不依赖这些本地资料；历史采集与内容生成脚本需要原始资料，不能在全新克隆中直接重跑。

## 运行

环境：Node.js 24、npm。版本以 `package-lock.json` 为准。

```powershell
npm ci
$env:NEXT_TELEMETRY_DISABLED='1'
npm run dev
```

生产构建与验证：

```powershell
npm run check
npm test
npm run build
npm run start -- --port 3002
```

另一个终端执行浏览器验证（首次安装浏览器运行 `npx playwright install chromium`）：

```powershell
$env:QA_ORIGIN='http://127.0.0.1:3002'
npm run qa
node scripts/qa_content_repair.mjs
python scripts/verify_content_repair.py
```

Python 采集、审计工具使用 requests、beautifulsoup4、PyMuPDF、Pillow。这些是辅助工具，网站运行和 Vercel 构建只依赖 npm。不要直接重跑原始采集脚本覆盖已经校对的内容。

## 内容和页面

- `content/site.json`：27 个服务页面、5 个行业、6 份原始团队记录、8 个岗位、6 篇历史内容；当前展示的五人团队由 `lib/team.ts` 选取。
- `lib/team.ts`：当前线上团队已恢复旧站五位成员及原顺序，头像均使用姓名首字母，等待用户上传。首页、列表、详情及搜索同步；Jeff 和四位虚构人物不再展示。此前示例资料与图片仅保留为旧版本素材，当前页面不引用。用户已批准发布，版本见 `qa/deployment.json`。
- `content/research.json`：27 篇不同 DOI 的论文阅读笔记；记录作者、期刊、论文日期、来源、阅读范围。未把论文发表日期冒充网站编辑日期。
- `content/insights.json`：7 篇 Company Insights、4 篇 Science；保留原 LinkedIn 发布日期、公司署名和主要证据来源。
- `public/downloads/`：8 份原始岗位 PDF，均为 2 页。HTML 详情保留每份 PDF 的 15 个内容/条款部分。
- `source-archive/`：原站 HTML、完整提取文字、LinkedIn 正文和元数据、论文元数据、截图与来源记录，仅本地交付，不部署为公开目录。
- `public/media/`：原站素材及 WebP 副本。大图优化副本用于页面，原件保留。
- `content-manifest.json`、`asset-manifest.json`、`content-migration-map.csv`：迁移与素材对照。
- `content/legacy-ui.json`、`content/archive.json`：恢复的五组服务目录、十个项目入口、原资源分类，以及 138 份公开原站记录和 76 张原图。
- `qa/content-repair/restoration-manifest.json`、`restored-page-map.csv`、`restored-image-map.csv`：在原迁移基线上的完整修复补充清单。
- `redirect-map.json`、`lib/legacy.mjs`、`proxy.ts`：138 条发现范围内的旧地址映射。根据路径和 ClassID/ID 匹配，非根地址使用 308；搜索参数优先进入 `/search`；原资源分类进入对应历史资源筛选；未知 ID 返回 404。

资源中心支持类型、主题、关键词、分页；站内搜索覆盖服务、行业、团队、岗位和文章。职位通过教育合作伙伴推荐，不创建虚构直接申请流程，也未使用会暗示职位正在开放的 JobPosting 结构化数据。

## 咨询与订阅接入

用户已确认暂不接入在线咨询和订阅后台。当前部署保留未接通提示，接口返回 503，不显示虚假成功。电话与邮件链接可以直接使用。以下变量说明供后续用户要求接入时使用，不代表本轮待完成工作。

接口：`POST /api/contact` 和 `POST /api/newsletter`，仅接收 JSON。

咨询字段：`subject`、`name`、`email`、`phone`、`company`、`message`、隐藏字段 `website`。邮箱或电话至少一项；姓名、主题、正文必填。订阅字段：`email`、`website`。

在 Vercel 配置以下服务端变量，然后重新部署：

| 变量 | 用途 |
|---|---|
| `CONTACT_WEBHOOK_URL` | 实际咨询收件服务的 HTTPS 地址 |
| `NEWSLETTER_WEBHOOK_URL` | 实际订阅系统的 HTTPS 地址 |
| `FORM_WEBHOOK_SECRET` | 可选 Bearer 凭据，永不暴露给前端 |
| `SITE_URL` | 可选规范站点地址；默认取 Vercel 项目生产域名 |
| `SITE_INDEXABLE` | 仅正式公开上线时设置 `true`；当前默认禁止索引 |

上游收到 `{kind, ...已校验字段}`。成功必须返回 HTTP 2xx 和 `{"ok":true,"requestId":"真实持久化回执"}`；仅 HTTP 200 不足以确认成功。8 秒超时、无回执、服务错误均保持失败并保留输入。使用已授权的受控测试确认真实接收后再称为接通。当前测试仅使用本地 mock，不向公司发送测试邮件。

接口具有输入校验、同源检查、蜜罐和实例内限流。正式开放表单时应配置共享限流/反滥用服务，并确认隐私说明、收件人、数据保留与删除规则。现有实例内计数不等于跨 Vercel 实例的全局限流。

## Vercel 部署与回滚

预览地址：https://hopkins-medtech.vercel.app

账户范围 `wei34`；独立项目 `hopkins-medtech`。用户直接请求部署至 Vercel，因此执行部署；附件中未指定平台的默认说明不覆盖用户本次授权。未改动旧站域名/DNS。

```powershell
npx vercel link --yes --project hopkins-medtech --scope wei34
npx vercel deploy --prod --yes --scope wei34
```

`vercel.json` 明确指定 Next.js 预设和构建命令，避免新建项目的 Other 默认预设导致页面 404。`.env.local`、`.vercel/` 不进入版本控制；源资料与 QA 截图通过 `.vercelignore` 排除。不要公开任何环境变量文件或 OIDC 令牌。

每次部署产生独立版本。后续需要回滚时，在 Vercel 项目 Deployments 中将已验收旧版本重新提升为 Production；不要删除原版本。初次部署前无该项目的旧版本。域名正式迁移应作为单独工作处理。

## 验收与已知事项

最新结果见 [内容修复与部署验收](qa/content-repair/report.md)：线上 656 个去重原站文字片段、76 张有效原图、138 个旧地址及 246 个内容/搜索页面全部通过检查。普通业务内容补回相应页面；测试占位与 2022 年客户数量声明按用户确认保存在[公开原站档案](https://hopkins-medtech.vercel.app/archive)。16 张旧界面小图标亦在公开图库可见，现有新站图标保留。原站两条已失效图片引用在报告中单独记录。

[原始差异报告](qa/content-audit/report.md)和[原可视化审阅](qa/content-audit/review.html)保留为修复前证据。已有新增文章、岗位、团队、实验室内容及动效均保留。

详细检查见 `qa/acceptance-report.md`；事实待确认项见 `qa/known-gaps.md`。当前 Vercel 版本用于审阅，保持禁止索引。团队等待用户上传头像；表单后台暂不接入，正式隐私政策仍需公司确认。GitHub 仓库用于源代码交付；上传代码与 Vercel 发布分别操作。

## 动效更新

已补充首屏分阶段动画、持续品牌圆弧、滚动触发、客户评价轮播、资源滑动和导航动态；支持全局暂停及系统减少动态效果。实现与验证说明见 `qa/motion-notes.md`。
