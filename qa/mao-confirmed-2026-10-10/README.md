# 毛确认后的更新（2026-10-10）

来源：网站负责人在本次会话中转达毛的确认：第二位创始人为 Jeff Wu，本人 LinkedIn 为 https://www.linkedin.com/in/jeffwu774/；8 个岗位不写是否仍接受推荐/申请及首次发布日期，工作方式写 Remote / Onsite。

- Jeff 只显示已确认的 Co-founder、公司名称和本人链接，恢复团队页、团队展示、站内搜索及 sitemap；未填写学历、经历、其他职务或照片。Organization 的 founder 与 Person 指向同一个人物标识。旧的禁止恢复 Jeff 规则由本次明确确认替代，其余内容原则保留。
- 8 个 JobPosting 保留原岗位编号、职责、INTERN、雇佣主体及 educational partner referral 渠道。工作方式在可见页面和结构化描述中一致写为 Remote / Onsite。
- 不写 datePosted、申请开放状态、具体工作地址、远程适用国家或全远程标记。内部 approvedForStructuredData 只表示允许输出这些已确认内容，不代表确认岗位当前开放。
- 日期和具体地点缺失意味着不符合 Google 招聘富媒体结果的完整要求。Schema Markup Validator 通过只证明 Schema 结构可识别，不能在 PR 中宣称 Google Rich Results Test 已通过。参考：https://developers.google.com/search/docs/appearance/structured-data/job-posting
- SITE_INDEXABLE、robots、DNS、域名保持不变，所有 PR 仍需批准和 CI，不合并 main。原稿不新增到公开仓库。

本次按依赖顺序更新原六个 PR：#14 的结构化数据/人物确认，#15 的可见岗位事实和描述，#16 的项目概览，以及 #19 的整站验收；没有增加第七个 PR。
