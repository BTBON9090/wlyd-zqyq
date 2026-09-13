export type NewsCategory = "policy" | "notice" | "industry" | "event" | "report";

export type IndustryArticle = {
  id: string;
  category: NewsCategory;
  typeLabel: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  timeLabel: string;
  tags: string[];
  readCount: number;
  urgent?: boolean;
  featured?: boolean;
  coverTone?: string;
};

export type PolicyItem = {
  id: string;
  title: string;
  level: "国家级" | "市级" | "区级" | "园区级";
  department: string;
  category: string;
  summary: string;
  matchScore: number;
  subsidyMax: string;
  deadline: string;
  deadlineDays: number;
  status: "可申报" | "即将截止" | "已截止";
  tags: string[];
};

export type ParkEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  format: "线下" | "线上" | "混合";
  seats: number;
  registered: number;
  host: string;
  summary: string;
};

export type PolicyDeadline = {
  id: string;
  title: string;
  date: string;
  daysLeft: number;
  level: string;
};

export const newsCategoryFilters = [
  { id: "all", label: "全部资讯" },
  { id: "policy", label: "政策速递" },
  { id: "notice", label: "园区公告" },
  { id: "industry", label: "行业动态" },
  { id: "event", label: "活动沙龙" },
  { id: "report", label: "研报洞察" },
] as const;

export const policyLevelFilters = [
  { id: "all", label: "全部层级" },
  { id: "国家级", label: "国家级" },
  { id: "市级", label: "上海市" },
  { id: "区级", label: "浦东新区" },
  { id: "园区级", label: "临港园区" },
];

export const newsTopics = [
  { id: "rd", label: "研发加计", on: true },
  { id: "finance", label: "供应链金融", on: true },
  { id: "ip", label: "知识产权", on: false },
  { id: "export", label: "出海合规", on: false },
  { id: "energy", label: "绿色低碳", on: true },
  { id: "talent", label: "人才补贴", on: false },
];

export const industryArticles: IndustryArticle[] = [
  {
    id: "a1",
    category: "policy",
    typeLabel: "政策",
    title: "研发费用加计扣除申报将于 8 月 31 日截止",
    summary: "符合条件的企业需在电子税务局完成 2025 年度研发加计扣除备案，园区企服中心提供材料清单与 AI 预审服务。",
    source: "国家税务总局 · 园区转载",
    publishedAt: "2026-08-19",
    timeLabel: "今天 09:20",
    tags: ["研发加计", "财税", "申报提醒"],
    readCount: 2840,
    urgent: true,
    featured: true,
    coverTone: "p1",
  },
  {
    id: "a2",
    category: "notice",
    typeLabel: "公告",
    title: "园区东区 8 月 20 日 22:00–24:00 计划停电检修",
    summary: "受影响范围：智造大道 18–26 号栋。请提前保存数据，应急发电车已就位，如有特殊产线需求请联系物业值班。",
    source: "临港智造园物业",
    publishedAt: "2026-08-18",
    timeLabel: "昨天 16:40",
    tags: ["园区公告", "运维"],
    readCount: 1260,
    urgent: true,
    coverTone: "n1",
  },
  {
    id: "a3",
    category: "industry",
    typeLabel: "动态",
    title: "临港精密制造完成 B 轮融资，加码伺服产线",
    summary: "本轮融资由产业资本领投，资金将用于五轴加工中心扩产与海外渠道建设，预计新增产能 30%。",
    source: "36氪 · 园区情报",
    publishedAt: "2026-08-16",
    timeLabel: "08-16",
    tags: ["精密制造", "融资", "产业链"],
    readCount: 980,
    coverTone: "i1",
  },
  {
    id: "a4",
    category: "event",
    typeLabel: "活动",
    title: "周四 14:00 供应链金融沙龙 · 可在线报名",
    summary: "邀请银行、保理与核心企业分享票据池、订单融资实践案例，现场提供一对一额度测算。",
    source: "园区产服中心",
    publishedAt: "2026-08-15",
    timeLabel: "08-15",
    tags: ["金融", "沙龙", "报名"],
    readCount: 640,
    coverTone: "e1",
  },
  {
    id: "a5",
    category: "policy",
    typeLabel: "政策",
    title: "浦东新区「专精特新」高质量发展专项申报启动",
    summary: "面向认定有效期内企业，支持数字化改造、品牌培育与产能升级，最高补贴 200 万元。",
    source: "浦东新区科经委",
    publishedAt: "2026-08-14",
    timeLabel: "08-14",
    tags: ["专精特新", "补贴"],
    readCount: 1520,
    coverTone: "p2",
  },
  {
    id: "a6",
    category: "report",
    typeLabel: "研报",
    title: "2026 临港智能制造产业链白皮书（节选）",
    summary: "涵盖伺服系统、工业软件、检测装备三大细分赛道市场规模、国产替代率与招引图谱。",
    source: "园区产业研究院",
    publishedAt: "2026-08-13",
    timeLabel: "08-13",
    tags: ["研报", "智能制造"],
    readCount: 890,
    coverTone: "r1",
  },
  {
    id: "a7",
    category: "industry",
    typeLabel: "动态",
    title: "工信部发布工业机器人行业规范条件（2026 版）",
    summary: "新版规范强化安全与能效指标，对系统集成商资质提出更高要求，9 月 1 日起施行。",
    source: "工信部官网",
    publishedAt: "2026-08-12",
    timeLabel: "08-12",
    tags: ["机器人", "合规"],
    readCount: 720,
    coverTone: "i2",
  },
  {
    id: "a8",
    category: "notice",
    typeLabel: "公告",
    title: "园区食堂 8 月升级营业，新增轻食与夜宵窗口",
    summary: "B 座 1 层食堂 8 月 22 日起试营业，支持企业团餐预订与电子餐券，详情见内网通知。",
    source: "园区后勤",
    publishedAt: "2026-08-11",
    timeLabel: "08-11",
    tags: ["后勤", "公告"],
    readCount: 430,
    coverTone: "n2",
  },
  {
    id: "a9",
    category: "policy",
    typeLabel: "政策",
    title: "上海市中小企业「免申即享」资金直达第二批清单公布",
    summary: "纳入清单企业无需主动申报，资金将按账户信息自动拨付，请核对企业收款账户。",
    source: "上海市经信委",
    publishedAt: "2026-08-10",
    timeLabel: "08-10",
    tags: ["免申即享", "资金直达"],
    readCount: 1100,
    coverTone: "p3",
  },
  {
    id: "a10",
    category: "event",
    typeLabel: "活动",
    title: "知识产权布局与海外维权实务培训",
    summary: "面向出海企业，讲解 PCT 申请、海关备案与侵权应对，含案例演练与免费咨询时段。",
    source: "园区法务中心",
    publishedAt: "2026-08-09",
    timeLabel: "08-09",
    tags: ["知识产权", "培训"],
    readCount: 560,
    coverTone: "e2",
  },
  {
    id: "a11",
    category: "industry",
    typeLabel: "动态",
    title: "长三角绿色工厂认定名单公示，园区 3 家企业入选",
    summary: "入选企业将优先对接绿色信贷与碳足迹核算补贴，园区产服提供申报辅导绿色通道。",
    source: "园区产服",
    publishedAt: "2026-08-08",
    timeLabel: "08-08",
    tags: ["绿色制造", "认定"],
    readCount: 670,
    coverTone: "i3",
  },
  {
    id: "a12",
    category: "report",
    typeLabel: "研报",
    title: "8 月园区企业用工与薪酬指数简报",
    summary: "技工类岗位需求环比 +12%，平均薪酬持平；零工平台接单量持续走高。",
    source: "园区 HR 联盟",
    publishedAt: "2026-08-07",
    timeLabel: "08-07",
    tags: ["用工", "指数"],
    readCount: 410,
    coverTone: "r2",
  },
  {
    id: "a13",
    category: "notice",
    typeLabel: "公告",
    title: "园区智慧门禁系统升级，8 月 25 日起启用新卡",
    summary: "旧卡将于 8 月 24 日失效，请至物业中心免费换领，支持人脸与二维码双模通行。",
    source: "园区物业",
    publishedAt: "2026-08-06",
    timeLabel: "08-06",
    tags: ["门禁", "公告"],
    readCount: 890,
    coverTone: "n3",
  },
  {
    id: "a14",
    category: "policy",
    typeLabel: "政策",
    title: "临港新片区跨境数据流动负面清单（试行）解读",
    summary: "明确一般数据、重要数据与核心数据分类管理要求，提供合规自测清单模板。",
    source: "临港管委会",
    publishedAt: "2026-08-05",
    timeLabel: "08-05",
    tags: ["数据合规", "出海"],
    readCount: 1340,
    coverTone: "p4",
  },
  {
    id: "a15",
    category: "event",
    typeLabel: "活动",
    title: "「AI + 制造」场景对接会 · 需求方开放报名",
    summary: "10 家制造企业与 6 家 AI 服务商现场路演，支持发布具体改造需求并预约洽谈。",
    source: "园区科创中心",
    publishedAt: "2026-08-04",
    timeLabel: "08-04",
    tags: ["AI", "对接会"],
    readCount: 780,
    coverTone: "e3",
  },
  {
    id: "a16",
    category: "industry",
    typeLabel: "动态",
    title: "全国工业母机产业投资基金二期方案披露",
    summary: "重点投向高档数控机床、核心功能部件与工业软件，园区 2 家供应商进入备选库。",
    source: "证券时报",
    publishedAt: "2026-08-03",
    timeLabel: "08-03",
    tags: ["工业母机", "基金"],
    readCount: 620,
    coverTone: "i4",
  },
];

export const matchedPolicies: PolicyItem[] = [
  {
    id: "pol1",
    title: "高新技术企业认定奖励（复评）",
    level: "区级",
    department: "浦东新区科经委",
    category: "资质认定",
    summary: "通过复评的高新技术企业给予 20 万元奖励，需无重大违法违规记录。",
    matchScore: 96,
    subsidyMax: "20 万",
    deadline: "2026-09-30",
    deadlineDays: 42,
    status: "可申报",
    tags: ["高新", "奖励"],
  },
  {
    id: "pol2",
    title: "研发费用加计扣除",
    level: "国家级",
    department: "国家税务总局",
    category: "税收优惠",
    summary: "制造业企业可按 100% 加计扣除研发费用，需规范归集辅助账与项目台账。",
    matchScore: 94,
    subsidyMax: "按实扣除",
    deadline: "2026-08-31",
    deadlineDays: 12,
    status: "即将截止",
    tags: ["研发", "加计扣除"],
  },
  {
    id: "pol3",
    title: "临港新片区集成电路流片补贴",
    level: "园区级",
    department: "临港管委会",
    category: "产业补贴",
    summary: "支持首次流片与 MPW 拼片，按实际费用 30% 补贴，单家企业年度上限 300 万。",
    matchScore: 72,
    subsidyMax: "300 万",
    deadline: "2026-10-15",
    deadlineDays: 57,
    status: "可申报",
    tags: ["集成电路", "流片"],
  },
  {
    id: "pol4",
    title: "中小企业数字化转型券",
    level: "市级",
    department: "上海市经信委",
    category: "数字化",
    summary: "发放数字化改造券，可用于购买 MES、ERP 及上云服务，面值最高 50 万。",
    matchScore: 88,
    subsidyMax: "50 万",
    deadline: "2026-11-30",
    deadlineDays: 103,
    status: "可申报",
    tags: ["数字化", "改造券"],
  },
  {
    id: "pol5",
    title: "绿色工厂节能改造补贴",
    level: "园区级",
    department: "园区产服中心",
    category: "绿色低碳",
    summary: "对空压机、冷却塔等设备节能改造项目给予 15%–25% 补贴。",
    matchScore: 81,
    subsidyMax: "80 万",
    deadline: "2026-09-15",
    deadlineDays: 27,
    status: "可申报",
    tags: ["节能", "绿色工厂"],
  },
  {
    id: "pol6",
    title: "出口信用保险保费扶持",
    level: "市级",
    department: "上海市商务委",
    category: "外贸",
    summary: "对中小外贸企业投保信保给予保费扶持，重点支持新兴市场开拓。",
    matchScore: 65,
    subsidyMax: "30 万",
    deadline: "2026-12-31",
    deadlineDays: 134,
    status: "可申报",
    tags: ["外贸", "信保"],
  },
];

export const parkEvents: ParkEvent[] = [
  {
    id: "ev1",
    title: "供应链金融沙龙：票据池与订单融资",
    date: "2026-08-21",
    time: "14:00–16:30",
    location: "园区路演厅 A · 3 层",
    format: "线下",
    seats: 80,
    registered: 56,
    host: "园区产服 × 万连融",
    summary: "银行、保理机构现场答疑，携带财务报表可获额度初评。",
  },
  {
    id: "ev2",
    title: "研发加计扣除材料规范培训",
    date: "2026-08-22",
    time: "10:00–11:30",
    location: "线上直播 + 回放",
    format: "线上",
    seats: 500,
    registered: 312,
    host: "园区财税中心",
    summary: "讲解辅助账设置、项目归集与常见驳回原因。",
  },
  {
    id: "ev3",
    title: "知识产权海外布局 Workshop",
    date: "2026-08-26",
    time: "09:30–12:00",
    location: "法务中心 2 号会议室",
    format: "混合",
    seats: 40,
    registered: 28,
    host: "园区法务中心",
    summary: "PCT 策略、马德里体系与海关备案实操。",
  },
  {
    id: "ev4",
    title: "「AI + 制造」场景对接会",
    date: "2026-08-28",
    time: "13:30–17:00",
    location: "科创中心多功能厅",
    format: "线下",
    seats: 120,
    registered: 89,
    host: "园区科创中心",
    summary: "制造企业与 AI 服务商一对一洽谈，支持现场发布需求。",
  },
];

export const policyDeadlines: PolicyDeadline[] = [
  { id: "d1", title: "研发加计扣除申报", date: "08-31", daysLeft: 12, level: "国家级" },
  { id: "d2", title: "绿色工厂节能改造", date: "09-15", daysLeft: 27, level: "园区级" },
  { id: "d3", title: "高新复评奖励", date: "09-30", daysLeft: 42, level: "区级" },
  { id: "d4", title: "集成电路流片补贴", date: "10-15", daysLeft: 57, level: "园区级" },
];

export const newsValueProps = [
  { title: "AI 政策匹配", desc: "基于企业画像智能推荐可申报政策", icon: "🎯" },
  { title: "申报日历", desc: "截止提醒 · 材料清单 · 进度跟踪", icon: "📅" },
  { title: "园区快讯", desc: "公告停电检修 · 活动报名 · 办事指南", icon: "📢" },
  { title: "行业情报", desc: "融资动态 · 研报洞察 · 产业链监测", icon: "📊" },
];

export function newsCatalogSummary() {
  return industryArticles.slice(0, 4).map((a) => ({
    id: a.id,
    type: a.typeLabel,
    title: a.title,
    time: a.timeLabel,
    urgent: a.urgent,
  }));
}

export function newsHomePreview(limit = 4) {
  return industryArticles.slice(0, limit);
}
