# 前后端接口契约

当前接口是已实现前端适配层所期待的契约，**不是已存在后端的声明**。后端可按此实现，或仅修改 `src/lib/api.ts` 对齐现有接口。组件不应感知接口路径差异。

## 通用约定

- 默认前缀 `/api`，通过 `VITE_API_BASE_URL` 在构建时配置。
- JSON 响应使用直接对象／数组，无额外 `data` 包装。204 表示无返回数据。
- Cookie 会话：前端所有请求 `credentials: include`。服务端设置 HttpOnly、Secure、合理的 SameSite 与会话有效期。
- 除查询外，请求前调用 `GET /auth/csrf` 获取 `{ "token": "..." }`，随后发送 `X-CSRF-Token`。
- 前端超时 15 秒；成功响应经过 Zod 契约校验。事务不自动重试，用户明确点击后再重试。
- 服务申请、企业入驻携带 `Idempotency-Key: UUID`。同一表单在失败后重试保持同一个 key，后端按用户、业务、key 保存结果；相同 key 内容不同应返回 409。页面刷新后的新 key 不能代替后端业务级去重。
- 401 会清除当前界面身份并要求登录。403 权限不足，404 不存在／下架，409 冲突，413 文件太大，429 频繁操作。其他错误显示稳定的用户提示；服务端错误正文不直接渲染到界面。
- 所有枚举、金额、资源权限、营业执照真实性、文件 MIME、扩展名与实际内容、账号状态、企业资格、验证码、协议版本必须由后端校验。前端仅提供输入体验。

## 接口列表

| 方法与路径                      | 输入                                               | 成功输出                                 |
| ------------------------------- | -------------------------------------------------- | ---------------------------------------- |
| GET `/auth/csrf`                | 无                                                 | `{ token: string }`                      |
| GET `/auth/session`             | Cookie                                             | `Session` 或 `null`；未登录也可 401      |
| POST `/auth/otp`                | `{phone,purpose}`，purpose 为 login/register/reset | 204                                      |
| POST `/auth/login`              | `{phone,mode,otp?,password?,agreed}`               | `Session`，设置会话 Cookie               |
| POST `/auth/logout`             | `{}`                                               | 204，销毁服务端会话                      |
| POST `/auth/reset-password`     | `{phone,otp,password}`                             | 204，使旧会话失效                        |
| GET `/services`                 | 无                                                 | `Service[]`                              |
| GET `/services/:id`             | 服务 ID                                            | `Service`                                |
| GET `/enterprises?q=关键词`     | 企业名称关键词                                     | `Enterprise[]`，仅返回允许申请加入的企业 |
| POST `/enterprise-applications` | multipart，见下方                                  | `Session`（enterpriseStatus=pending）    |
| POST `/service-requests`        | multipart，见下方                                  | `Receipt`                                |
| GET `/service-requests`         | Cookie                                             | 当前用户可访问的 `Receipt[]`             |

`/services` 当前按试点小规模目录一次性加载，并在前端筛选／分页。正式目录较大时需升级为服务端分页接口（q、cat、sort、price、page、pageSize），返回 items/total，保留页面 URL 结构。不要在几万条服务的场景继续全量下载。

## 数据结构

以 `src/lib/models.ts` 为类型与运行时约束唯一来源。

```ts
type Session = {
  id: string;
  phone: string;
  name: string;
  enterprise?: string;
  enterpriseStatus: "none" | "pending" | "approved" | "rejected";
  applicationId?: string;
  reviewNote?: string;
};

type Service = {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  desc: string;
  overview: string;
  features: string[];
  price: string; // 如 "1,280 起"、"680 / 月"、"按项报价"
  priceMin: number; // 用于筛选；不能作为收银台应付金额
  provider: string;
  delivery: string; // 参考周期
  hot?: boolean;
  publishedAt: string; // YYYY-MM-DD
  image?: string;
};

type Enterprise = { id: string; name: string; park: string };

type Receipt = {
  id: string;
  serviceId: string;
  serviceName: string;
  createdAt: string; // ISO 8601
  status: "submitted" | "contacting" | "closed";
  contactName: string;
  phone: string;
  requirement: string;
};
```

服务类别：`ip`、`finance_tax`、`legal`、`hr`、`software`、`brand`、`marketing`、`consulting`、`inspection`、`general`、`overseas`。

### 企业入驻 multipart

```text
type: create | join | invite
enterprise: 企业名称
enterpriseId: join 时的企业 ID
creditCode: create/invite 时的统一社会信用代码
contactName: 经办人姓名
inviteCode: invite 时必填
agreed: "true"
file: create/invite 时的营业执照二进制
```

手机号、当前用户、园区上下文从服务端会话与部署配置取得，不能信任前端传入身份。join 申请不能直接产生 active membership；不得接受客户端提交的管理员角色。

### 服务申请 multipart

```text
serviceId: 服务 ID
contactName: 联系人
phone: 联系电话
requirement: 10–1000 字需求
agreed: "true"
file: 可选附件二进制
```

这是服务咨询申请，**没有金额、支付、电子签约或开始履约字段**。后续交易应引入独立订单模型和服务端定价，不能复用前端 `priceMin` 结算。

## 需要联调确认

- OTP 接口当前以 60 秒重发、5 分钟有效作为前端展示假设。正式后端需返回 TTL 或以统一约定实现，前端倒计时不构成限流。
- 协议版本号、授权记录、运营主体与申请业务条款在正式上线前补入接口，不能只保存前端布尔勾选。
- 企业状态当前由 session 查询返回。新鲜度 60 秒；重新进入需要时可刷新，最终审批不得由浏览器决定。
- 附件发送的是实际 File 数据，前端没有把文件名当成已上传对象。后端需返回可审计的附件关联关系。
- 全部 HTML 使用 React 文本渲染；若未来接入富文本服务详情，先定义可信格式与清洗策略，不直接增加 `dangerouslySetInnerHTML`。

## V2 首页内容读取

新增可配置的公开首页 JSON 读取入口。默认 URL 是静态 `content/homepage.json`，配置 `VITE_HOMEPAGE_CONTENT_URL` 后可改为运营后台发布的公开接口。结构见 `src/features/home/homeContent.ts` 中的 `homeContentSchema` 和 [V2 图片说明](HOMEPAGE_V2.md)。这个接口只读取宣传信息，不提交任何用户数据。

供应商发布模型的 `coverUrl` 需映射为当前服务接口的 `image` 字段；同一服务的列表与详情应使用同一张封面。当前接口仍未完整覆盖原型 PublishedService 的规格、商店与分期履约字段，后续应补齐适配，不应删去原型有效业务需求。

## V2 服务发布、需求与个人中心扩展

新增 `GET /demands/mine`、`POST /demands`、`PATCH /account/profile`。服务响应支持可选 `published` 完整发布模型；需求申请支持 `versionId`、`quantity` 并在回执返回规格名称。详细字段和兼容行为见 [V2 延展交接](V2_CONTINUATION.md)。这些接口为前端契约，尚未接入真实后台。
