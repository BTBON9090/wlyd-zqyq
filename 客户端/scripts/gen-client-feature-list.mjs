import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @typedef {{ m1: string, m2: string, code: string, name: string, desc: string, p: "P0"|"P1"|"P2", note?: string }} Feat */

/** @type {Feat[]} */
const features = [
  // 一、注册登录
  { m1: "一、注册登录", m2: "1.1 账号开通与登录", code: "A-001", name: "手机号+短信验证码登录", desc: "客户端唯一登录路径：填写11位手机号，获取并校验短信验证码后进入。登录页不展示密码登录，也不在此创建企业主体。", p: "P0" },
  { m1: "一、注册登录", m2: "1.1 账号开通与登录", code: "A-002", name: "未注册自动开通个人账号", desc: "验证码通过且手机号未注册时，自动创建个人账号；同一手机号全局唯一。个人账号与企业主体分离。", p: "P0", note: "演示验证码123456" },
  { m1: "一、注册登录", m2: "1.1 账号开通与登录", code: "A-003", name: "已注册账号登录", desc: "本机同号恢复会话与企业关联；换号登录清空旧会话并新建个人账号。", p: "P0" },
  { m1: "一、注册登录", m2: "1.1 账号开通与登录", code: "A-004", name: "验证码发送与倒计时", desc: "发送验证码、60秒倒计时重发、号码/验证码错误提示；生产环境需频控与风控。", p: "P0" },
  { m1: "一、注册登录", m2: "1.1 账号开通与登录", code: "A-005", name: "可选登录密码", desc: "个人中心可设置/修改密码（至少6位）。登录页当前仍只走验证码，密码为增强安全预留。", p: "P1" },
  { m1: "一、注册登录", m2: "1.2 会话与落地", code: "A-006", name: "登录落地分流", desc: "无已入驻企业→入驻首页；有已入驻企业→平台首页；有待审/已驳回申请可查看进度或重提。", p: "P0" },
  { m1: "一、注册登录", m2: "1.2 会话与落地", code: "A-007", name: "退出登录", desc: "清除本机会话返回登录页；服务端企业关联关系保留。", p: "P0" },
  { m1: "一、注册登录", m2: "1.2 会话与落地", code: "A-008", name: "多企业多园区切换", desc: "同一账号可创建或加入多家企业；顶栏按「省·市·园区·企业」切换当前入驻上下文。", p: "P0" },
  { m1: "一、注册登录", m2: "1.2 会话与落地", code: "A-009", name: "登录设备与异地提醒", desc: "展示登录设备列表，支持踢下线；异常登录提醒。", p: "P2" },
  { m1: "一、注册登录", m2: "1.3 权限门槛", code: "A-010", name: "未入驻无交易权限", desc: "无有效企业成员关系时，不可进入首页及集采/金融/企服/需求/地图/资讯；仅可进入驻与个人中心。", p: "P0" },
  { m1: "一、注册登录", m2: "1.3 权限门槛", code: "A-011", name: "无企业/审核中菜单裁剪", desc: "无企业或入驻审核中进入个人中心时，一级菜单仅保留个人中心；二级仅企业档案、个人信息。订单类菜单隐藏。", p: "P0" },

  // 二、企业入驻
  { m1: "二、企业入驻", m2: "2.1 入驻入口", code: "B-001", name: "入驻首页", desc: "个人账号展示三种入口：创建企业、邀请码入驻、加入已有企业；提示待审数量，支持查看进度。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.1 入驻入口", code: "B-002", name: "创建企业", desc: "发起新主体入驻，进入四步向导；审核通过后创建人成为企业管理员。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.1 入驻入口", code: "B-003", name: "邀请码入驻", desc: "校验运营发放的邀请码并锁定园区，随后与创建企业走同一套四步向导，提交园区运营审核。", p: "P0", note: "演示码PARK2026-NEW01 / PARK2026-A4B2" },
  { m1: "二、企业入驻", m2: "2.1 入驻入口", code: "B-004", name: "加入已有企业", desc: "先选省市园区，再按名称/信用代码查询该园区企业，填写姓名、显示手机号与角色后提交。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.1 入驻入口", code: "B-005", name: "草稿待审与继续办理", desc: "入驻首页/企业档案展示待审、驳回与未完成创建；驳回单可回向导重提。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.2 四步向导", code: "B-006", name: "基本信息（第1步）", desc: "选择入驻园区、客户类型、上传必传证件并OCR回填主体名称/证件号/有效期等；填写经办人姓名、电话、邮箱与显示名称。邀请码路径园区锁定。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.2 四步向导", code: "B-007", name: "经营信息（第2步）", desc: "按国标GB/T 4754选择行业四分类；企业性质/规模、主营描述、主体简介；地图选址；所属产业三级与产业链环节、企业标签。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.2 四步向导", code: "B-008", name: "协议签署（第3步）", desc: "勾选入驻协议、扫码人脸识别、电子签章，三者完成后进入提交。主体信息变更需重签。", p: "P0", note: "演示环境模拟刷脸与电签" },
  { m1: "二、企业入驻", m2: "2.2 四步向导", code: "B-009", name: "确认提交（第4步）", desc: "核对档案摘要后提交，状态变为pending，进入园区运营审核；通过前无经营权限。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.2 四步向导", code: "B-010", name: "主体查重拦截", desc: "创建/邀请码提交时若信用代码已在平台存在，禁止重复建档，引导申请加入该企业。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.3 审核跟踪", code: "B-011", name: "入驻进度查询", desc: "展示创建/邀请码/加入申请的审核链路、时间轴、审核意见与附件签署记录。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.3 审核跟踪", code: "B-012", name: "园区运营审核（创建/邀请码）", desc: "创建企业与邀请码入驻由园区运营审核资质与签署；通过启用企业账号，驳回可重提。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.3 审核跟踪", code: "B-013", name: "驳回后修改重提", desc: "仅rejected可带申请单回四步向导，从第1步完整确认后重新提交。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.3 审核跟踪", code: "B-014", name: "入驻结果通知", desc: "通过/驳回后向注册手机号发送短信；站内消息为后期。", p: "P1" },
  { m1: "二、企业入驻", m2: "2.4 加入已有", code: "B-015", name: "园区内企业查询", desc: "必须先选园区，再按关键词查询，不默认列出园区全部企业。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.4 加入已有", code: "B-016", name: "自选角色提交申请", desc: "申请人自选企业管理员/采购员/财务/法务/普通成员；已是成员或已有待审则拦截。", p: "P0" },
  { m1: "二、企业入驻", m2: "2.4 加入已有", code: "B-017", name: "企业管理员审批加入", desc: "加入申请由该企业管理员通过/拒绝，不改角色；通过后按申请角色加入。管理员在企业档案处理待审名单。", p: "P0" },

  // 三、企业档案
  { m1: "三、企业档案", m2: "3.1 档案与变更", code: "C-001", name: "当前企业档案查看", desc: "展示与入驻提交一致的主体、经营、产业、签署与附件信息；显示当前角色与园区。", p: "P0" },
  { m1: "三、企业档案", m2: "3.1 档案与变更", code: "C-002", name: "提交档案变更审核", desc: "已入驻企业可提交档案变更；审核期间交易权限不受影响。", p: "P0" },
  { m1: "三、企业档案", m2: "3.1 档案与变更", code: "C-003", name: "档案变更审核跟踪", desc: "展示变更审核中状态，支持演示模拟通过。", p: "P0" },
  { m1: "三、企业档案", m2: "3.1 档案与变更", code: "C-004", name: "按入驻向导编辑档案", desc: "打开入驻表单修改后重提。当前仅驳回的创建/邀请申请可回填编辑。", p: "P1" },
  { m1: "三、企业档案", m2: "3.1 档案与变更", code: "C-005", name: "无企业/审核中空态", desc: "无企业引导去入驻；审核中引导查看进度；有创建草稿可继续填写。", p: "P0" },
  { m1: "三、企业档案", m2: "3.2 退出与注销", code: "C-006", name: "退出企业", desc: "解除当前用户与该企业关联，不影响企业本身继续经营。", p: "P1" },
  { m1: "三、企业档案", m2: "3.2 退出与注销", code: "C-007", name: "企业注销", desc: "仅管理员可注销企业主体并解绑全部成员。", p: "P2" },
  { m1: "三、企业档案", m2: "3.3 成员审批", code: "C-008", name: "待审批加入申请", desc: "企业管理员在企业档案查看并处理外部用户的加入申请（通过/拒绝）。", p: "P0" },

  // 四、个人中心
  { m1: "四、个人中心", m2: "4.1 个人信息", code: "D-001", name: "个人资料展示", desc: "展示显示名称、绑定手机号、是否已设密码。", p: "P0" },
  { m1: "四、个人中心", m2: "4.1 个人信息", code: "D-002", name: "手机号换绑", desc: "新手机号+验证码更新登录凭证。", p: "P0" },
  { m1: "四、个人中心", m2: "4.1 个人信息", code: "D-003", name: "设置/修改密码", desc: "设置或修改登录密码，两次输入须一致且不少于6位。", p: "P1" },
  { m1: "四、个人中心", m2: "4.1 个人信息", code: "D-004", name: "注销个人账号", desc: "清除本机会话与企业关联后注销个人账号，不可恢复。", p: "P2" },
  { m1: "四、个人中心", m2: "4.2 业务单据", code: "D-005", name: "集采订单查询", desc: "电商/协议/询价单据列表与详情入口（需已入驻）。", p: "P0" },
  { m1: "四、个人中心", m2: "4.2 业务单据", code: "D-006", name: "金融服务记录", desc: "金融申请、融资、对账记录查询（需已入驻）。", p: "P0" },
  { m1: "四、个人中心", m2: "4.2 业务单据", code: "D-007", name: "企业服务订单", desc: "严选服务履约订单查询（需已入驻）。", p: "P0" },
  { m1: "四、个人中心", m2: "4.2 业务单据", code: "D-008", name: "接单记录", desc: "需求大厅报价与中标记录查询（需已入驻）。", p: "P0" },

  // 五、工作台首页
  { m1: "五、工作台首页", m2: "5.1 工作台", code: "E-001", name: "身份问候与待办", desc: "按当前企业展示问候语、待办（订单/付款/金融/政策/审核）并跳转办理。", p: "P0" },
  { m1: "五、工作台首页", m2: "5.1 工作台", code: "E-002", name: "运营轮播位", desc: "首页Hero轮播展示平台活动与业务引导，支持自动播放与手动切换。", p: "P0" },
  { m1: "五、工作台首页", m2: "5.1 工作台", code: "E-003", name: "六大业务入口", desc: "集采商城、金融服务、企业服务、需求大厅、产业地图、产业资讯一键进入。", p: "P0" },
  { m1: "五、工作台首页", m2: "5.2 业务预览", code: "E-004", name: "精选集采/金融/企服预览", desc: "首页展示热门商品、金融产品、严选服务卡片，跳转对应大厅。", p: "P0" },
  { m1: "五、工作台首页", m2: "5.2 业务预览", code: "E-005", name: "需求与资讯预览", desc: "首页展示需求大厅精选与资讯/政策匹配预览。", p: "P0" },
  { m1: "五、工作台首页", m2: "5.2 业务预览", code: "E-006", name: "政策匹配入口", desc: "根据企业画像展示可申报政策与截止日期，跳转产业资讯。", p: "P0" },
  { m1: "五、工作台首页", m2: "5.3 全局导航", code: "E-007", name: "顶栏全局搜索", desc: "已入驻后顶栏可搜索商品/服务/金融/企业。当前为入口占位，二期接跨模块检索。", p: "P1" },
  { m1: "五、工作台首页", m2: "5.3 全局导航", code: "E-008", name: "站内消息入口", desc: "顶栏消息铃铛展示未读数。一期为入口演示，二期接审核结果、订单、政策提醒。", p: "P1" },

  // 六、集采服务
  { m1: "六、集采服务", m2: "6.1 商城浏览", code: "F-001", name: "分类浏览与搜索排序", desc: "按商品分类筛选，支持关键词搜索、默认/价格升序/降序排序。", p: "P0" },
  { m1: "六、集采服务", m2: "6.1 商城浏览", code: "F-002", name: "商品卡片与加入购物车", desc: "展示规格、协议价、供应商；支持加入购物车并调整数量。", p: "P0" },
  { m1: "六、集采服务", m2: "6.2 下单询价", code: "F-003", name: "购物车结算", desc: "查看购物车明细、合计金额，提交后进入订单（演示）。", p: "P0" },
  { m1: "六、集采服务", m2: "6.2 下单询价", code: "F-004", name: "发布询价", desc: "发起询价单，向园区供应商征集报价。", p: "P0" },
  { m1: "六、集采服务", m2: "6.2 下单询价", code: "F-005", name: "批量下单", desc: "批量导入或勾选商品一次性下单。", p: "P0" },
  { m1: "六、集采服务", m2: "6.3 订单协同", code: "F-006", name: "电商/协议/询价订单入口", desc: "商城页按电商、协议、询价切换订单摘要，跳转个人中心集采订单。", p: "P0" },
  { m1: "六、集采服务", m2: "6.3 订单协同", code: "F-007", name: "园区客服热线", desc: "集采页展示园区客服电话，便于人工协助。", p: "P0" },
  { m1: "六、集采服务", m2: "6.3 订单协同", code: "F-008", name: "收货对账与结算", desc: "确认收货、对账结算、开票协同（接真实履约后完善）。", p: "P1" },

  // 七、金融服务
  { m1: "七、金融服务", m2: "7.1 产品大厅", code: "G-001", name: "金融产品分类检索", desc: "按信贷/保险/票据/通证等分类浏览，支持关键词搜索。", p: "P0" },
  { m1: "七、金融服务", m2: "7.1 产品大厅", code: "G-002", name: "产品详情与在线申请", desc: "查看额度、利率、合作机构，提交融资/投保申请。", p: "P0" },
  { m1: "七、金融服务", m2: "7.2 办理能力", code: "G-003", name: "扫码跳转合作机构", desc: "部分产品以二维码跳转银行/保险机构办理。", p: "P0" },
  { m1: "七、金融服务", m2: "7.2 办理能力", code: "G-004", name: "票据OCR比价", desc: "上传银票影像识别票面要素，多家机构报价比价。", p: "P0" },
  { m1: "七、金融服务", m2: "7.2 办理能力", code: "G-005", name: "通证/供应链票据演示", desc: "园区通证流转、供应链票据签发与转让演示。", p: "P1" },
  { m1: "七、金融服务", m2: "7.3 记录", code: "G-006", name: "融资申请记录", desc: "查看申请进度、放款与对账记录。", p: "P0" },

  // 八、企业服务
  { m1: "八、企业服务", m2: "8.1 服务大厅", code: "H-001", name: "严选服务分类检索", desc: "按知产、财税、人力、出海等分类浏览，支持搜索。", p: "P0" },
  { m1: "八、企业服务", m2: "8.1 服务大厅", code: "H-002", name: "服务详情与下单", desc: "查看服务说明、价格、服务商，下单进入履约。", p: "P0" },
  { m1: "八、企业服务", m2: "8.2 需求与经纪人", code: "H-003", name: "发布服务需求", desc: "发布定制服务需求，由服务商报价承接。", p: "P0" },
  { m1: "八、企业服务", m2: "8.2 需求与经纪人", code: "H-004", name: "AI经纪人跟进", desc: "对话式描述需求，由AI经纪人匹配服务并跟进。", p: "P0" },
  { m1: "八、企业服务", m2: "8.2 需求与经纪人", code: "H-005", name: "服务履约跟踪", desc: "查看里程碑交付进度与服务订单状态。", p: "P0" },

  // 九、需求大厅
  { m1: "九、需求大厅", m2: "9.1 找需求", code: "I-001", name: "需求列表筛选分页", desc: "按类目、周期、预算、关键词筛选需求，分页浏览。", p: "P0" },
  { m1: "九、需求大厅", m2: "9.1 找需求", code: "I-002", name: "需求详情", desc: "查看需求说明、预算、周期、标签与发布企业。", p: "P0" },
  { m1: "九、需求大厅", m2: "9.2 发布与接单", code: "I-003", name: "发布需求", desc: "企业发布采购/服务/合作需求，进入大厅供接单。", p: "P0" },
  { m1: "九、需求大厅", m2: "9.2 发布与接单", code: "I-004", name: "接单报价", desc: "对需求提交报价，进入选标履约。", p: "P0" },
  { m1: "九、需求大厅", m2: "9.2 发布与接单", code: "I-005", name: "我的报价与中标", desc: "查看已提交报价与中标结果。", p: "P0" },
  { m1: "九、需求大厅", m2: "9.2 发布与接单", code: "I-006", name: "需求AI经纪人", desc: "用自然语言描述需求，演示解析后推荐可接单服务或生成需求草稿。", p: "P0" },

  // 十、产业地图
  { m1: "十、产业地图", m2: "10.1 多视图", code: "J-001", name: "园区全景漫游", desc: "园区全景拖拽环视，热点跳转正门/展厅/广场等点位。", p: "P0" },
  { m1: "十、产业地图", m2: "10.1 多视图", code: "J-002", name: "企业分布定位", desc: "地图展示企业位置，点击查看档案与供需角色。", p: "P0" },
  { m1: "十、产业地图", m2: "10.1 多视图", code: "J-003", name: "供需热力", desc: "按需求/供给密度展示热力图。", p: "P0" },
  { m1: "十、产业地图", m2: "10.1 多视图", code: "J-004", name: "产业链脑图", desc: "上下游环节穿透展开，定位链上企业。", p: "P0" },
  { m1: "十、产业地图", m2: "10.1 多视图", code: "J-005", name: "产业片区", desc: "跨区域产业集群范围与集聚分析。", p: "P0" },
  { m1: "十、产业地图", m2: "10.2 筛选与对接", code: "J-006", name: "地理范围切换", desc: "园区/城市/区域范围切换企业与片区数据。", p: "P0" },
  { m1: "十、产业地图", m2: "10.2 筛选与对接", code: "J-007", name: "产业环节角色筛选", desc: "按一级产业、产业链环节、供需角色筛选企业。", p: "P0" },
  { m1: "十、产业地图", m2: "10.2 筛选与对接", code: "J-008", name: "企业详情与链上匹配", desc: "查看企业信息、所属链、推荐供需匹配对象。", p: "P0" },
  { m1: "十、产业地图", m2: "10.2 筛选与对接", code: "J-009", name: "发起集采/发布对接需求", desc: "从地图企业或园区详情一键跳转集采对接或发布需求。", p: "P0" },
  { m1: "十、产业地图", m2: "10.2 筛选与对接", code: "J-010", name: "导出产业报告", desc: "一键导出当前范围产业报告（演示）。", p: "P0" },

  // 十一、产业资讯
  { m1: "十一、产业资讯", m2: "11.1 资讯与政策", code: "K-001", name: "资讯频道与搜索", desc: "推荐/政策/公告/行业/活动/研报频道浏览与关键词搜索。", p: "P0" },
  { m1: "十一、产业资讯", m2: "11.1 资讯与政策", code: "K-002", name: "政策匹配", desc: "按企业画像匹配政策并按级别筛选，展示匹配分与申报条件。", p: "P0" },
  { m1: "十一、产业资讯", m2: "11.1 资讯与政策", code: "K-003", name: "申报日历", desc: "政策截止日期倒计时，临期高亮提醒。", p: "P0" },
  { m1: "十一、产业资讯", m2: "11.2 活动与订阅", code: "K-004", name: "活动报名", desc: "园区沙龙/路演活动查看与报名。", p: "P0" },
  { m1: "十一、产业资讯", m2: "11.2 活动与订阅", code: "K-005", name: "收藏与主题订阅", desc: "收藏资讯/政策，订阅关注主题。", p: "P0" },
  { m1: "十一、产业资讯", m2: "11.2 活动与订阅", code: "K-006", name: "资讯AI问答", desc: "对政策/资讯提问，演示生成解读要点。", p: "P0" },

  // 十二、园区AI助手
  { m1: "十二、园区AI助手", m2: "12.1 助手能力", code: "L-001", name: "全局悬浮助手", desc: "全站悬浮入口，展示政策匹配提示，打开对话抽屉。", p: "P0" },
  { m1: "十二、园区AI助手", m2: "12.1 助手能力", code: "L-002", name: "快捷问题与多轮对话", desc: "预设「查订单/政策/金融/采购需求」等快捷问法，支持自由提问。", p: "P0" },
  { m1: "十二、园区AI助手", m2: "12.1 助手能力", code: "L-003", name: "业务意图路由", desc: "将问答路由到下单、查询、政策申报等业务模块（一期演示，二期接智能体）。", p: "P1" },
  { m1: "十二、园区AI助手", m2: "12.1 助手能力", code: "L-004", name: "企业画像+知识库RAG", desc: "基于企业档案、政策库与操作指南作答。", p: "P1" },
];

const xml = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const modules = [...new Set(features.map((f) => f.m1))];
const summary = modules.map((m) => {
  const rows = features.filter((f) => f.m1 === m);
  return {
    m,
    n: rows.length,
    p0: rows.filter((f) => f.p === "P0").length,
    p1: rows.filter((f) => f.p === "P1").length,
    p2: rows.filter((f) => f.p === "P2").length,
  };
});
const tot = summary.reduce(
  (a, s) => ({ n: a.n + s.n, p0: a.p0 + s.p0, p1: a.p1 + s.p1, p2: a.p2 + s.p2 }),
  { n: 0, p0: 0, p1: 0, p2: 0 },
);

const row = (f, i) => {
  const pri = f.p;
  const mvp = f.p === "P0" ? "MVPYes" : "MVPNo";
  const mvpText = f.p === "P0" ? "是" : "否";
  return `   <Row ss:Height="42">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${i + 1}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${xml(f.m1)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${xml(f.m2)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${xml(f.code)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${xml(f.name)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${xml(f.desc)}</Data></Cell>
    <Cell ss:StyleID="${pri}"><Data ss:Type="String">${pri}</Data></Cell>
    <Cell ss:StyleID="${mvp}"><Data ss:Type="String">${mvpText}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">客户端</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${xml(f.note ?? "")}</Data></Cell>
   </Row>`;
};

const summaryRows = summary
  .map(
    (s) => `   <Row>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${xml(s.m)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${s.n}</Data></Cell>
    <Cell ss:StyleID="P0"><Data ss:Type="Number">${s.p0}</Data></Cell>
    <Cell ss:StyleID="P1"><Data ss:Type="Number">${s.p1}</Data></Cell>
    <Cell ss:StyleID="P2"><Data ss:Type="Number">${s.p2}</Data></Cell>
    <Cell ss:StyleID="MVPYes"><Data ss:Type="Number">${s.p0}</Data></Cell>
   </Row>`,
  )
  .join("\n");

const xls = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>政企园区服务平台-客户端-产品功能清单</Title>
  <Author>Cursor</Author>
  <Created>2026-08-20T00:00:00Z</Created>
  <Version>1.0</Version>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="16" ss:Bold="1"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E40AF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
   </Borders>
  </Style>
  <Style ss:ID="Cell">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="P0">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="P1">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#B45309"/>
   <Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="P2">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#475569"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="MVPYes">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="MVPNo">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Color="#94A3B8"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="Section">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="产品功能清单">
  <Table ss:ExpandedColumnCount="10" ss:ExpandedRowCount="${features.length + 3}" x:FullColumns="1" x:FullRows="1">
   <Column ss:Index="1" ss:Width="40"/>
   <Column ss:Index="2" ss:Width="110"/>
   <Column ss:Index="3" ss:Width="90"/>
   <Column ss:Index="4" ss:Width="55"/>
   <Column ss:Index="5" ss:Width="150"/>
   <Column ss:Index="6" ss:Width="380"/>
   <Column ss:Index="7" ss:Width="50"/>
   <Column ss:Index="8" ss:Width="55"/>
   <Column ss:Index="9" ss:Width="70"/>
   <Column ss:Index="10" ss:Width="140"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="9" ss:StyleID="Title"><Data ss:Type="String">政企园区服务平台 · 客户端 · 产品功能清单</Data></Cell>
   </Row>
   <Row ss:Height="36">
    <Cell ss:MergeAcross="9" ss:StyleID="SubTitle"><Data ss:Type="String">范围：注册登录 / 企业入驻 / 企业档案 / 个人中心 / 工作台 / 集采 / 金融 / 企服 / 需求 / 产业地图 / 资讯 / AI助手　|　版本：v1.0　|　适用端：客户端 PC　|　P0=一期/MVP必做（当前可演示）　P1=二期　P2=三期</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">序号</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">一级模块</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">二级模块</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">编号</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">功能名称</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">功能描述</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">优先级</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">是否MVP</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">端侧</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">备注</Data></Cell>
   </Row>
${features.map(row).join("\n")}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>3</SplitHorizontal>
   <TopRowBottomPane>3</TopRowBottomPane>
  </WorksheetOptions>
 </Worksheet>

 <Worksheet ss:Name="优先级与MVP汇总">
  <Table>
   <Column ss:Width="140"/>
   <Column ss:Width="70"/>
   <Column ss:Width="55"/>
   <Column ss:Width="55"/>
   <Column ss:Width="55"/>
   <Column ss:Width="80"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="5" ss:StyleID="Title"><Data ss:Type="String">优先级与MVP汇总</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">一级模块</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">功能数</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">P0</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">P1</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">P2</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">MVP纳入</Data></Cell>
   </Row>
${summaryRows}
   <Row>
    <Cell ss:StyleID="Section"><Data ss:Type="String">合计</Data></Cell>
    <Cell ss:StyleID="Section"><Data ss:Type="Number">${tot.n}</Data></Cell>
    <Cell ss:StyleID="Section"><Data ss:Type="Number">${tot.p0}</Data></Cell>
    <Cell ss:StyleID="Section"><Data ss:Type="Number">${tot.p1}</Data></Cell>
    <Cell ss:StyleID="Section"><Data ss:Type="Number">${tot.p2}</Data></Cell>
    <Cell ss:StyleID="Section"><Data ss:Type="Number">${tot.p0}</Data></Cell>
   </Row>
   <Row/>
   <Row>
    <Cell ss:MergeAcross="5" ss:StyleID="SubTitle"><Data ss:Type="String">说明：以「产品功能清单」工作表逐行为准。MVP纳入=是否MVP为「是」的行数（与本册P0一致）。可用 Excel 自动筛选按优先级/是否MVP排期。</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">优先级定义</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="Header"><Data ss:Type="String">说明</Data></Cell>
   </Row>
   <Row ss:Height="42">
    <Cell ss:StyleID="P0"><Data ss:Type="String">P0</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="Cell"><Data ss:Type="String">一期/MVP必做：当前客户端可演示走通的能力。闭环为「登录→入驻审核→工作台→集采/金融/企服/需求/地图/资讯」。</Data></Cell>
   </Row>
   <Row ss:Height="36">
    <Cell ss:StyleID="P1"><Data ss:Type="String">P1</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="Cell"><Data ss:Type="String">二期重要：真实短信/OCR/电签对接、站内消息、密码登录打通、档案在线编辑、收货对账、RAG智能体落地等。</Data></Cell>
   </Row>
   <Row ss:Height="36">
    <Cell ss:StyleID="P2"><Data ss:Type="String">P2</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="Cell"><Data ss:Type="String">三期增强：企业注销合规、个人账号注销、设备管理、操作日志、多角色权限细拆等。</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="最小MVP">
  <Table>
   <Column ss:Width="80"/>
   <Column ss:Width="480"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="1" ss:StyleID="Title"><Data ss:Type="String">客户端最小MVP范围与验收口径</Data></Cell>
   </Row>
   <Row ss:Height="48">
    <Cell ss:MergeAcross="1" ss:StyleID="SubTitle"><Data ss:Type="String">目标：个人用户手机号登录后完成企业入驻，审核通过即可使用工作台及六大业务。创建/邀请码走四步向导+运营审核；加入已有由企业管理员审批。无企业时菜单裁剪。</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">类别</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">内容</Data></Cell>
   </Row>
   <Row ss:Height="160">
    <Cell ss:StyleID="MVPYes"><Data ss:Type="String">必须包含</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">1) 手机号验证码登录+自动注册+落地分流&#10;2) 创建企业/邀请码入驻：同一套四步向导，提交园区运营审核&#10;3) 加入已有：园区查询+自选角色，企业管理员审批&#10;4) 无企业/审核中仅个人中心企业档案+个人信息&#10;5) 企业档案查看、变更审核、加入申请处理&#10;6) 工作台六大入口&#10;7) 集采浏览下单询价、金融申请/票据比价、企服下单、需求发布接单&#10;8) 产业地图多视图与对接、资讯政策匹配、AI助手快捷问答&#10;9) 多企业多园区切换</Data></Cell>
   </Row>
   <Row ss:Height="80">
    <Cell ss:StyleID="MVPNo"><Data ss:Type="String">可延后</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">密码登录打通、站内消息、真实短信/OCR/电签、已通过档案在线编辑、收货对账结算、企业注销合规、个人账号注销、设备/日志、RAG智能体生产接入。</Data></Cell>
   </Row>
   <Row ss:Height="120">
    <Cell ss:StyleID="P0"><Data ss:Type="String">验收口径</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">① 新用户验证码登录→创建企业四步向导→运营通过→进入首页办理集采&#10;② 邀请码验证后同样走四步向导并经运营审核&#10;③ 加入已有提交后，目标企业管理员在企业档案通过/拒绝&#10;④ 无企业或审核中访问个人中心，看不到经营一级菜单和订单二级菜单&#10;⑤ 同一账号可切换多家已入驻「园区+企业」</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="文档说明">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="500"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="1" ss:StyleID="Title"><Data ss:Type="String">文档说明</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">文档名称</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">政企园区服务平台-客户端-产品功能清单</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">版本</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">v1.0</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">适用端</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">客户端 PC（企业端）</Data></Cell>
   </Row>
   <Row ss:Height="48">
    <Cell ss:StyleID="Cell"><Data ss:Type="String">范围</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">账号域（注册登录/企业入驻/企业档案/个人中心）+ 经营域（工作台/集采/金融/企服/需求/地图/资讯/AI助手）</Data></Cell>
   </Row>
   <Row ss:Height="72">
    <Cell ss:StyleID="Cell"><Data ss:Type="String">格式来源</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">列结构对齐《政企园区服务平台-供应商端-账号域产品功能清单-v2.1.xls》：序号、一级模块、二级模块、编号、功能名称、功能描述、优先级、是否MVP、端侧、备注。</Data></Cell>
   </Row>
   <Row ss:Height="72">
    <Cell ss:StyleID="Cell"><Data ss:Type="String">与供应商端差异</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">客户端入驻是四步向导（非五步）；创建/邀请码均经园区运营审核；加入已有由企业管理员审批（非运营审）。经营侧覆盖集采、金融、企服、需求、地图、资讯与AI助手。</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">统计</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">共 ${modules.length} 大模块 · ${tot.n} 项功能（P0:${tot.p0} / P1:${tot.p1} / P2:${tot.p2}）</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>
`;

writeFileSync(join(root, "政企园区服务平台-客户端-产品功能清单-v1.0.xls"), xls, "utf8");
console.log(`xls written: ${tot.n} features P0=${tot.p0} P1=${tot.p1} P2=${tot.p2}`);

const colors = {
  "一、注册登录": { cls: "m-auth", icon: "登" },
  "二、企业入驻": { cls: "m-onboard", icon: "驻" },
  "三、企业档案": { cls: "m-merchant", icon: "档" },
  "四、个人中心": { cls: "m-acct", icon: "设" },
  "五、工作台首页": { cls: "m-home", icon: "台" },
  "六、集采服务": { cls: "m-proc", icon: "采" },
  "七、金融服务": { cls: "m-fin", icon: "金" },
  "八、企业服务": { cls: "m-svc", icon: "服" },
  "九、需求大厅": { cls: "m-demand", icon: "需" },
  "十、产业地图": { cls: "m-map", icon: "图" },
  "十一、产业资讯": { cls: "m-news", icon: "讯" },
  "十二、园区AI助手": { cls: "m-ai", icon: "智" },
};

const grouped = modules.map((m) => {
  const rows = features.filter((f) => f.m1 === m);
  const subs = [...new Set(rows.map((r) => r.m2))];
  return { m, meta: colors[m], subs: subs.map((s) => ({ s, rows: rows.filter((r) => r.m2 === s) })) };
});

let htmlSections = "";
for (const g of grouped) {
  htmlSections += `<div class="module ${g.meta.cls}">
    <div class="mod-head">
      <div class="mod-icon">${g.meta.icon}</div>
      <div>
        <div class="mod-title">${g.m}</div>
        <div class="mod-desc">${g.subs.map((s) => s.s.replace(/^\d+\.\d+\s/, "")).join(" · ")}</div>
      </div>
    </div>
    <div class="mod-body">
`;
  for (const sub of g.subs) {
    const num = sub.s.split(" ")[0];
    htmlSections += `      <div class="sub-section">
        <div class="sub-head"><span class="num">${num}</span>${sub.s.replace(/^\S+\s/, "")}</div>
        <table>
          <thead><tr><th>#</th><th>功能名称</th><th>功能描述</th><th>优先级</th></tr></thead>
          <tbody>
`;
    sub.rows.forEach((r, i) => {
      htmlSections += `            <tr><td>${i + 1}</td><td>${r.name}</td><td>${r.desc}${r.note ? `（${r.note}）` : ""}</td><td><span class="pri pri-${r.p.toLowerCase()}">${r.p}</span></td></tr>\n`;
    });
    htmlSections += `          </tbody>
        </table>
      </div>
`;
  }
  htmlSections += `    </div>
  </div>
`;
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>政企园区服务平台 · 客户端 · 产品功能清单 v1.0</title>
<style>
  :root {
    --c-auth: #0f766e; --c-onboard: #3b82f6; --c-merchant: #d97706; --c-acct: #64748b;
    --c-home: #0d4ea3; --c-proc: #c2410c; --c-fin: #0f766e; --c-svc: #7c3aed;
    --c-demand: #be185d; --c-map: #0369a1; --c-news: #b45309; --c-ai: #4338ca;
    --p0: #ef4444; --p1: #f59e0b; --p2: #64748b;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #f1f5f9; color: #1e293b; padding: 20px 12px; }
  .doc { max-width: 1080px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px 36px 40px; }
  .doc-title { font-size: 22px; font-weight: 800; text-align: center; color: #0f172a; margin-bottom: 4px; }
  .doc-sub { font-size: 13px; text-align: center; color: #64748b; margin-bottom: 24px; line-height: 1.6; }
  .doc-meta { display: flex; gap: 12px; justify-content: center; margin-bottom: 28px; flex-wrap: wrap; }
  .doc-meta .tag { font-size: 12px; padding: 3px 12px; border-radius: 99px; font-weight: 600; }
  .tag.scope { background: #eff6ff; color: #2563eb; }
  .tag.mode { background: #f0fdf4; color: #16a34a; }
  .tag.ver { background: #faf5ff; color: #7c3aed; }
  .legend-bar { display: flex; gap: 16px; justify-content: center; margin-bottom: 28px; flex-wrap: wrap; font-size: 12px; color: #64748b; }
  .legend-bar .item { display: flex; align-items: center; gap: 5px; }
  .legend-bar .dot { width: 10px; height: 10px; border-radius: 3px; }
  .dot-p0 { background: var(--p0); } .dot-p1 { background: var(--p1); } .dot-p2 { background: var(--p2); }
  .module { margin-bottom: 28px; border-radius: 14px; overflow: hidden; border: 2px solid; }
  .mod-head { padding: 14px 20px; display: flex; align-items: center; gap: 12px; }
  .mod-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: #fff; flex-shrink: 0; background: rgba(255,255,255,0.25); }
  .mod-title { font-size: 17px; font-weight: 800; color: #fff; }
  .mod-desc { font-size: 12px; color: rgba(255,255,255,0.85); margin-top: 2px; }
  .mod-body { padding: 16px 20px 20px; background: #fff; }
  .sub-section { margin-bottom: 18px; }
  .sub-section:last-child { margin-bottom: 0; }
  .sub-head { font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
  .sub-head .num { width: auto; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 10px; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
  th:first-child { width: 42px; text-align: center; }
  th:nth-child(2) { width: 180px; }
  th:nth-child(4) { width: 70px; text-align: center; }
  td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; line-height: 1.6; }
  td:first-child { text-align: center; color: #cbd5e1; font-weight: 600; font-size: 12px; }
  td:nth-child(2) { font-weight: 600; color: #1e293b; }
  td:nth-child(4) { text-align: center; }
  .pri { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; }
  .pri-p0 { background: #fef2f2; color: var(--p0); border: 1px solid #fecaca; }
  .pri-p1 { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
  .pri-p2 { background: #f8fafc; color: var(--p2); border: 1px solid #e2e8f0; }
  .m-auth { border-color: #99f6e4; } .m-auth .mod-head { background: var(--c-auth); } .m-auth .sub-head .num { background: var(--c-auth); }
  .m-onboard { border-color: #bfdbfe; } .m-onboard .mod-head { background: var(--c-onboard); } .m-onboard .sub-head .num { background: var(--c-onboard); }
  .m-merchant { border-color: #fde68a; } .m-merchant .mod-head { background: var(--c-merchant); } .m-merchant .sub-head .num { background: var(--c-merchant); }
  .m-acct { border-color: #cbd5e1; } .m-acct .mod-head { background: var(--c-acct); } .m-acct .sub-head .num { background: var(--c-acct); }
  .m-home { border-color: #93c5fd; } .m-home .mod-head { background: var(--c-home); } .m-home .sub-head .num { background: var(--c-home); }
  .m-proc { border-color: #fdba74; } .m-proc .mod-head { background: var(--c-proc); } .m-proc .sub-head .num { background: var(--c-proc); }
  .m-fin { border-color: #99f6e4; } .m-fin .mod-head { background: var(--c-fin); } .m-fin .sub-head .num { background: var(--c-fin); }
  .m-svc { border-color: #ddd6fe; } .m-svc .mod-head { background: var(--c-svc); } .m-svc .sub-head .num { background: var(--c-svc); }
  .m-demand { border-color: #fbcfe8; } .m-demand .mod-head { background: var(--c-demand); } .m-demand .sub-head .num { background: var(--c-demand); }
  .m-map { border-color: #7dd3fc; } .m-map .mod-head { background: var(--c-map); } .m-map .sub-head .num { background: var(--c-map); }
  .m-news { border-color: #fde68a; } .m-news .mod-head { background: var(--c-news); } .m-news .sub-head .num { background: var(--c-news); }
  .m-ai { border-color: #c7d2fe; } .m-ai .mod-head { background: var(--c-ai); } .m-ai .sub-head .num { background: var(--c-ai); }
  .summary-box { background: #f8fafc; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; border: 1px solid #e2e8f0; }
  .summary-box h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .summary-card { background: #fff; border-radius: 8px; padding: 12px 14px; border: 1px solid #e2e8f0; text-align: center; }
  .summary-card .num { font-size: 24px; font-weight: 800; color: #1e293b; }
  .summary-card .lbl { font-size: 12px; color: #64748b; margin-top: 2px; }
  .summary-card.p0 .num { color: var(--p0); } .summary-card.p1 .num { color: var(--p1); } .summary-card.p2 .num { color: var(--p2); } .summary-card.mod .num { color: #3b82f6; }
  .note-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; color: #92400e; line-height: 1.7; }
  .flow-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; color: #075985; line-height: 1.8; }
  .flow-step { display: inline-block; padding: 2px 10px; border-radius: 6px; font-weight: 600; margin: 0 2px; }
  .flow-arrow { color: #0ea5e9; margin: 0 4px; }
  .mvp-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px 22px; margin-top: 8px; margin-bottom: 28px; }
  .mvp-box h3 { font-size: 15px; font-weight: 800; color: #065f46; margin-bottom: 10px; }
  .mvp-box p { font-size: 13px; color: #047857; line-height: 1.7; margin-bottom: 12px; }
  .mvp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .mvp-card { background: #fff; border: 1px solid #d1fae5; border-radius: 10px; padding: 12px 14px; }
  .mvp-card h4 { font-size: 13px; font-weight: 800; color: #064e3b; margin-bottom: 6px; }
  .mvp-card ul { margin: 0; padding-left: 18px; font-size: 12px; color: #065f46; line-height: 1.7; }
  .mvp-out { margin-top: 12px; font-size: 12px; color: #6b7280; background: #fff; border: 1px dashed #d1d5db; border-radius: 8px; padding: 10px 12px; line-height: 1.7; }
  .foot { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.7; }
  @media print { body { background: #fff; padding: 0; } .doc { box-shadow: none; border-radius: 0; max-width: none; } }
  @media (max-width: 720px) { .summary-grid, .mvp-grid { grid-template-columns: 1fr 1fr; } .doc { padding: 20px 16px 28px; } }
</style>
</head>
<body>
<div class="doc">
  <div class="doc-title">政企园区服务平台 · 客户端功能清单</div>
  <div class="doc-sub">注册登录 · 企业入驻 · 企业档案 · 个人中心 · 工作台 · 集采 · 金融 · 企服 · 需求 · 产业地图 · 资讯 · AI助手<br>对齐当前客户端系统设计 · 格式参照《供应商端-账号域产品功能清单-v2.1》</div>
  <div class="doc-meta">
    <span class="tag scope">适用端：客户端 PC</span>
    <span class="tag mode">范围：账号域 + 经营域全模块</span>
    <span class="tag ver">版本：v1.0</span>
  </div>
  <div class="legend-bar">
    <div class="item"><span class="dot dot-p0"></span> P0 核心功能（一期 / MVP 必做）</div>
    <div class="item"><span class="dot dot-p1"></span> P1 重要功能（二期规划）</div>
    <div class="item"><span class="dot dot-p2"></span> P2 增强功能（三期迭代）</div>
  </div>
  <div class="summary-box">
    <h3>功能总览</h3>
    <div class="summary-grid">
      <div class="summary-card mod"><div class="num">${modules.length}</div><div class="lbl">功能模块</div></div>
      <div class="summary-card p0"><div class="num">${tot.p0}</div><div class="lbl">P0 核心功能</div></div>
      <div class="summary-card p1"><div class="num">${tot.p1}</div><div class="lbl">P1 重要功能</div></div>
      <div class="summary-card p2"><div class="num">${tot.p2}</div><div class="lbl">P2 增强功能</div></div>
    </div>
  </div>
  <div class="note-box">
    <strong>设计说明：</strong>① 手机号验证码登录，个人账号与企业主体分离；② 创建企业与邀请码入驻共用四步向导，提交后由园区运营审核；③ 加入已有企业由该企业管理员审批；④ 无企业或审核中仅可使用入驻与个人中心（企业档案+个人信息）；⑤ 已入驻后开通工作台及六大经营能力。
  </div>
  <div class="flow-box">
    <strong>客户端主链路：</strong>
    <span class="flow-step" style="background:#ccfbf1;color:#115e59;">手机号登录</span><span class="flow-arrow">→</span>
    <span class="flow-step" style="background:#dbeafe;color:#1e40af;">创建/邀请码四步向导</span><span class="flow-arrow">→</span>
    <span class="flow-step" style="background:#ede9fe;color:#5b21b6;">运营审核启用</span><span class="flow-arrow">→</span>
    <span class="flow-step" style="background:#fef3c7;color:#92400e;">工作台经营</span>
  </div>
${htmlSections}
  <div class="mvp-box">
    <h3>最小 MVP 版本（客户端）</h3>
    <p>目标：个人用户能用手机号登录，完成企业入驻并开通工作台与六大业务。<b>只做本册 P0</b>。</p>
    <div class="mvp-grid">
      <div class="mvp-card">
        <h4>必须包含（P0）</h4>
        <ul>
          <li>手机号验证码登录 + 自动注册 + 菜单裁剪</li>
          <li>创建 / 邀请码：同一套四步向导 + 运营审核</li>
          <li>加入已有：企业管理员审批</li>
          <li>企业档案、个人资料、多企业切换</li>
          <li>工作台 + 集采/金融/企服/需求/地图/资讯</li>
          <li>AI 助手快捷问答</li>
        </ul>
      </div>
      <div class="mvp-card">
        <h4>MVP 可延后（P1/P2）</h4>
        <ul>
          <li>密码登录打通、真实短信/电签生产对接</li>
          <li>已通过档案在线编辑、收货对账结算</li>
          <li>企业注销合规、个人账号注销</li>
          <li>设备管理、操作日志、RAG 智能体生产接入</li>
        </ul>
      </div>
    </div>
    <div class="mvp-out">
      <strong>MVP 验收口径：</strong>
      ① 新用户登录 → 四步创建企业 → 运营通过 → 首页办理集采；
      ② 邀请码验证后同样走四步向导；
      ③ 加入已有由企业管理员在企业档案审批；
      ④ 无企业/审核中个人中心仅档案+个人信息；
      ⑤ 同一账号可切换多家「园区+企业」。
    </div>
  </div>
  <div class="foot">
    政企园区服务平台 · 客户端 · 产品功能清单 v1.0<br>
    共 ${modules.length} 大模块 · ${tot.n} 项功能（P0:${tot.p0} / P1:${tot.p1} / P2:${tot.p2}）· 格式对齐供应商端账号域清单 v2.1
  </div>
</div>
</body>
</html>
`;

writeFileSync(join(root, "政企园区服务平台-客户端-产品功能清单.html"), html, "utf8");
console.log("html written");
