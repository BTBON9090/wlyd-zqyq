# V2 延展交接 · 2026-09-13

## 当前设计决定

客户已认可首页 V2 商城平台方向。本轮沿用构图、紧凑信息密度与图片位，延展到服务与个人中心。默认品牌蓝为 `#2460d2`；所有主按钮使用纯色，不再使用渐变或顶部内高光。顶部选中导航用下划线，保持 58px 导航高度及 1px Logo 双行间距。

首页新增数智金融、商品交易、智慧物流三个独立楼层。金融是产品方向和办理路径介绍，未提供实际授信或报价；集采陈列示例商品及采购方式；物流依据原型的找车发货、智能调度、运单跟踪、运费结算组织。对应业务专区仍留空，后续另行实现。

## 原型依据与业务边界

本轮读取原型 `ServicesHotPage`、`ServicesHallPage`、`ServiceDetailPage`、`AccountLayout`、`ProfilePage`、`financeProducts`、`procurement` 与客户端已对齐供应商 A1 的 `publishedServices` 模型。未发现独立供应商项目，因此没有审查或开发独立供应商端。

- `/services` 为推荐页，`/services/hall` 为可搜索和筛选的服务大厅。桌面五列图片服务卡；较窄屏依次减少列数，手机保持两列。侧栏提供原型服务分类；大厅支持三级分类、价格、评分、排序与 URL 状态。
- 列表和详情共享服务数据，原型 14 项发布数据只放在 `src/dev/prototype/services.json`。不要将示例数据引入 production 业务模块。
- 详情展示相册、规格、数量、价格、商家资料、案例、评价、FAQ、交付标准及分期比例。切换规格同步价格、周期、交付标准和阶段金额。
- “确认服务方案”进入需求申请，带 `version` 与 `quantity`，未登录时完整保留查询参数。提交记录包含规格名称和数量。此步骤不收款，不表示合同成立或服务已经启动；正式交易仍需后端订单和支付状态机。
- 个人中心只展示当前账号的申请与需求。未接入的金融/采购记录、成员与角色有明确空状态；不伪造交易数量或管理员权限。
- 登录与企业入驻不同。未登录点击入驻 → 带入驻上下文的登录/注册 → 选择创建企业、加入企业或邀请码 → 填资料 → 核对 → 提交审核。登录不等于企业认证。

## 修改入口

- `tokens.css`：品牌色、状态色、基础尺寸和阴影。
- `controls.css`：全站按钮、导航、搜索框。避免在页面样式重复定义按钮颜色。
- `commerce-v2.css`：本轮楼层、服务、账号与认证页面布局；只覆盖所属页面，保留 V1 供对比。
- `ContentImage`：只接受本地路径与 HTTP(S) 图片；缺图/失败时呈现 `placeholderIcon` + 文字的缺省位。缺省位是空状态，其余宣传图位置禁止使用 SVG icon 代替图片。
- `src/dev/prototype/services.json`：演示商品 s1/s2/s3 的 `image` 与 `published.coverUrl` 指向 `media/services/` 下的示例封面，用于对比有图与缺省两种卡片。
- `design/media/`：Banner 与缺省封面的 SVG 源码；`bash design/render-media.sh` 渲染到 `public/media/`（需要 Chrome 与 cwebp）。
- `public/content/homepage.json`：新增 `businessImages`、`productImages`、`serviceBannerImage`、`authImage`。字段允许留空，建议先填宣传图再做最终视觉验收。
- `lib/publishedService.ts`：发布模型 Zod 契约。`Service.published` 为可选，旧服务接口仍可降级展示基础信息。
- `features/account/AccountPage.tsx`：个人中心页面及申请详情。姓名修改返回完整 Session；服务记录与需求 queryKey 带账号 id，会话切换清理缓存。
- `features/services/ConsultDialog.tsx`：卡片「电话咨询」弹窗，只展示服务商在平台发布的名称与电话，演示模式标注演示号码且不外呼。
- `styles/tokens.css`：`--color-price` 为卡片金额与评分的暖色强调，不随品牌主题变化。

## 新增接口约定（待后端实现）

| 接口                                         | 输入 / 输出                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /api/demands/mine`                      | 当前账号的 `Demand[]`                                                                          |
| `POST /api/demands`                          | JSON `{title, category, requirement, budget}`，返回 Demand；携带 Idempotency-Key               |
| `PATCH /api/account/profile`                 | JSON `{name}`，返回完整 Session                                                                |
| `POST /api/service-requests`                 | 原 multipart 输入增加 `versionId`、`quantity`；响应增加 `versionId`、`versionName`、`quantity` |
| `GET /api/services`、`GET /api/services/:id` | 可增加 `published`，详见 Zod 契约                                                              |

Demand 含 id、title、category（分类 id）、requirement、budget、createdAt、status（published/closed）。图片地址由商家/CMS 返回；不能把商家提交的详情文本作为不受控 HTML 渲染。后端负责身份权限、字段校验、规格有效性、真实金额计算及幂等，前端计算只用于展示。生产版本不打包 mock 或验收按钮。

## 本轮验证

通过 TypeScript 检查与正式构建隔离检查。浏览器检查了规格价格联动、保留规格与数量的登录回跳、服务申请提交与个人中心详情、发布需求与个人中心需求记录。首页、详情、登录与个人中心在约 433px 的 CSS 视口无页面级横向溢出。提交均为本地演示数据，无真实短信、商家通知或付款。保持定点检查，不为样式反复建立冗长验证流程。
