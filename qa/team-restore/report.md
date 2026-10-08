# 五人团队恢复与发布验收

日期：2026-10-08。用户先同意本地修改与表单只读核查，随后明确批准发布。五人版本已更新至 Vercel；GitHub 上传继续暂停，没有提交咨询或订阅测试。

## 团队修改

按旧站顺序恢复五人，沿用当前卡片、个人详情和首页预览模板：

| 姓名 | 原站职位 |
|---|---|
| Homer Wu, Ph.D. | Chief Scientist |
| Jennifer Stanford | Director of Clinical Operation |
| Wendy Zhou, Ph.D. | Director of Laboratory Services |
| Andrew Wayland | Director of Business Development |
| Qian Cheng, Ph.D. | Chief Biostatistician |

- 五份完整简介共 21 段，与此次只读取得的原站 Team 页面逐段匹配。
- 头像统一显示姓名首字母，等待用户提供照片；已有头像原件留作旧版本素材，当前页面不引用。
- Jeff 及四位虚构人物不再出现在团队、首页预览、人物搜索和 sitemap；五个已移除人物详情路径返回 404。
- 原五位成员详情恢复普通人员页展示，不再标注虚构示例或历史人物。
- 当前五人展示由 `lib/team.ts` 读取原成员资料；来源数据及其余业务内容保持原样。卡片摘要只对截断的末词做省略处理，个人详情保留全文。
- 类型检查排除 `qa/` 内的旧代码快照，避免已停用快照参与当前代码编译。

## 本地验证

- TypeScript 与生产构建通过：252 个静态输出。
- 内容与修复保护测试 9 项通过；本轮未运行提交传输测试。
- 390 / 768 / 1440 三种宽度 × 首页、团队页、五个人物详情，共 21 组布局通过。
- 4 项浏览器检查通过：五人顺序与首字母、完整简介与职位、退役页面、首页/搜索/sitemap。
- 团队列表、Homer、Jennifer 三页 axe 自动检查无违规，无浏览器脚本错误。
- 浏览器检查仅执行 GET/HEAD，未触发表单提交。

证据：[本地浏览器记录](local-report.json)、[原文逐段核对](biography-source-check.json)、[桌面预览](local-team-1440.png)、[手机预览](local-team-390.png)。

## Contact Us

详细结果见 [表单只读核查](contact-submission-findings.md)。旧站前端将字段通过 GET 发送至旧站 `/Check/CheckSubmit.aspx`，实际存储或收件邮箱无法从公开前端确认。新站使用自身 `/api/contact`，目前仍显示未接通，尚未对接旧后台；两者请求和响应格式不同，需要另外适配与验证。

## 发布状态

用户已批准发布，状态 READY。当前版本 `dpl_9tomzhFkGzDPVtxprLG6VmuUmnCq`，上一版本 `dpl_ExWskmEg9oSYZpRCnUG9E374fax4`。入口：[团队页](https://hopkins-medtech.vercel.app/about/team)。线上 21 组布局、4 项功能及 3 页 axe 检查通过，无脚本错误，验证仅使用 GET/HEAD。证据见 [线上复核](live-report.json)、[部署记录](deployment.json)。真实表单提交测试仍需另外授权。
