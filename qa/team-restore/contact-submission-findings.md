# Contact Us 提交链路：只读核查

日期：2026-10-08。范围：用户已同意只读检查新旧表单提交代码。本次仅读取公开页面及本地代码，没有点击 Submit，没有请求旧站提交接口，没有向新站提交表单或发送测试邮件。

## 旧站

读取的页面：[旧站 Contact Us](http://www.hopkinsmedtech.com/Contact.aspx?ClassID=82)，HTTP 200。页面中的 `send11()` 读取以下内容：

| 页面字段 | 发送字段 |
|---|---|
| Your theme | theme |
| Name | name |
| Mobile | mobile |
| Email | Email |
| Content | nr |

主题、姓名、正文需填写；手机与邮箱至少填一项。校验通过后，jQuery AJAX 以 GET 请求旧站同域的 `/Check/CheckSubmit.aspx`，将上述值拼接并编码后放入 `All` 查询参数。

接收端地址为 `http://www.hopkinsmedtech.com/Check/CheckSubmit.aspx`。这里只记录从页面代码解析出的地址，未向该地址发出请求。

前端收到文本 `success` 时才提示成功并刷新页面，否则提示失败。这能证明网页设计了向服务器提交的动作，不能证明此刻的后台确实成功入库、发送邮件或通知了工作人员。

项目中没有该 ASP.NET 接口的后台源码、数据库或邮件配置。公开前端也没有暴露实际收件邮箱。因此目前无法确认它保存在哪个管理后台、哪张数据库表，或是否转发至邮箱。页面展示的 `HomerWu@HopkinsMedtech.com` 是联系邮箱，不能据此认定它是表单收件人。

证据：`old-contact.html`、`old-contact-submit.js`、`contact-readonly-check.json`。

## 新站

只读访问 [Vercel 联系页](https://hopkins-medtech.vercel.app/contact) 返回 HTTP 200，并显示在线提交尚未接通的提示。

代码流程：`components/forms.tsx` 将表单以 POST JSON 发到同站 `/api/contact`；`app/api/contact/route.ts` 调用 `lib/submission.ts`。

接收适配器使用服务端变量 `CONTACT_WEBHOOK_URL`。未配置时返回 HTTP 503 与 `NOT_CONFIGURED`，明确告知消息未发送。配置后仅向 HTTPS 服务 POST JSON，并要求服务返回 `ok: true` 和非空 `requestId`，才显示成功。本轮没有读取或改动 Vercel 环境变量，也没有提交测试。

旧站要求 GET 与 `All` 字符串，新站目前要求 HTTPS POST JSON 与 JSON 回执，协议不同；不能只把旧接口 URL 直接填到现有变量就认为接通。

## 能否接到旧站同一接收处

如果旧后台仍在运行、允许新站接入，并能确认其真实接收与成功条件，可以编写对应的服务端适配。需要旧站维护方提供接口说明、必要权限及后台收件方式。若旧接口不可用，也可在用户选定接收邮箱或服务后另行配置。

本次没有更改任何表单提交代码。实际提交测试、后台接入及发布需要用户分别同意后执行。
