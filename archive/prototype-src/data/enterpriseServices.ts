import type { ServiceItem } from "../data";

export type ServiceCategoryId =
  | "ip"
  | "finance_tax"
  | "legal"
  | "hr"
  | "software"
  | "brand"
  | "marketing"
  | "consulting"
  | "inspection"
  | "general"
  | "overseas";

export type EnterpriseService = ServiceItem & {
  categoryId: ServiceCategoryId;
  categoryL2: string;
  categoryL3: string;
  overview: string;
  features: string[];
  delivery: string;
  tone: string;
  hot?: boolean;
  /** 筛选用最低价（元） */
  priceMin: number;
  publishedAt: string;
  /** 综合评分 0–5 */
  rating: number;
  /** 服务商评级 0–5 */
  providerRating: number;
  /** 热度参考销量 */
  salesCount: number;
};

export type CategoryLevel = {
  id: string;
  label: string;
  children?: CategoryLevel[];
};

export const serviceCategories: { id: ServiceCategoryId | "all"; label: string; icon: string }[] = [
  { id: "all", label: "全部服务", icon: "☰" },
  { id: "ip", label: "知识产权", icon: "©" },
  { id: "finance_tax", label: "工商财税", icon: "¥" },
  { id: "legal", label: "法律服务", icon: "⚖" },
  { id: "hr", label: "人力资源", icon: "👥" },
  { id: "software", label: "软件与信息化", icon: "💻" },
  { id: "brand", label: "品牌与设计", icon: "🎨" },
  { id: "marketing", label: "营销推广", icon: "📣" },
  { id: "consulting", label: "咨询培训", icon: "📊" },
  { id: "inspection", label: "检验检测", icon: "🔬" },
  { id: "general", label: "企业综合", icon: "🏢" },
  { id: "overseas", label: "出海企服", icon: "🌐" },
];

/** L1 → L2 → L3 级联树（大厅筛选） */
export const serviceCategoryTree: Record<ServiceCategoryId, CategoryLevel[]> = {
  ip: [
    {
      id: "trademark_patent",
      label: "商标专利",
      children: [
        { id: "trademark_reg", label: "商标注册" },
        { id: "patent_apply", label: "专利申请" },
      ],
    },
  ],
  finance_tax: [
    {
      id: "bookkeeping",
      label: "代理记账",
      children: [
        { id: "general_taxpayer", label: "一般纳税人记账" },
        { id: "small_taxpayer", label: "小规模纳税人记账" },
      ],
    },
  ],
  legal: [
    {
      id: "contract_affairs",
      label: "合同事务",
      children: [
        { id: "contract_review", label: "合同审查与起草" },
        { id: "labor_dispute", label: "劳动争议" },
      ],
    },
  ],
  hr: [
    {
      id: "social_security",
      label: "社保公积金",
      children: [
        { id: "agency_pay", label: "代缴代办" },
        { id: "recruit", label: "招聘外包" },
      ],
    },
  ],
  software: [
    {
      id: "sys_integration",
      label: "系统集成",
      children: [
        { id: "erp_connect", label: "ERP 对接" },
        { id: "oa_build", label: "OA 搭建" },
      ],
    },
  ],
  brand: [
    {
      id: "visual_design",
      label: "视觉设计",
      children: [
        { id: "brand_material", label: "品牌物料" },
        { id: "packaging", label: "包装设计" },
      ],
    },
    {
      id: "digital_product",
      label: "数字产品设计",
      children: [
        { id: "ui_design", label: "UI 界面设计" },
        { id: "ux_prototype", label: "交互原型" },
      ],
    },
  ],
  marketing: [
    {
      id: "content_ops",
      label: "内容运营",
      children: [
        { id: "short_video", label: "短视频代运营" },
        { id: "live_commerce", label: "直播带货" },
      ],
    },
  ],
  consulting: [
    {
      id: "mgmt_consult",
      label: "管理咨询",
      children: [
        { id: "strategy", label: "战略规划" },
        { id: "org_design", label: "组织设计" },
      ],
    },
    {
      id: "digital_transform",
      label: "数字化转型",
      children: [
        { id: "roadmap", label: "转型路线图" },
        { id: "system_select", label: "系统选型" },
      ],
    },
  ],
  inspection: [
    {
      id: "quality_test",
      label: "质量检测",
      children: [
        { id: "third_party", label: "第三方认证" },
        { id: "lab_test", label: "实验室检测" },
      ],
    },
  ],
  general: [
    {
      id: "safety_fire",
      label: "安防消防",
      children: [
        { id: "fire_acceptance", label: "消防验收咨询" },
        { id: "safety_audit", label: "安评辅导" },
      ],
    },
  ],
  overseas: [
    {
      id: "overseas_entity",
      label: "海外主体",
      children: [
        { id: "company_reg", label: "公司注册与合规" },
        { id: "bank_open", label: "银行开户" },
      ],
    },
  ],
};

export const servicePillars = [
  { id: "brand", title: "品牌设计", desc: "品牌营销 · 品效合一", tone: "p-purple", to: "/services/hall?cat=brand" },
  { id: "proc", title: "园区集采", desc: "全链路工业品采购", tone: "p-orange", to: "/procurement" },
  { id: "agent", title: "AI 经纪人", desc: "智能解析 · 精准匹配", tone: "p-blue", to: "#ai-assistant" },
  { id: "marketing", title: "营销推广", desc: "精准获客 · 全案策划", tone: "p-cyan", to: "/services/hall?cat=marketing" },
  { id: "news", title: "产业情报", desc: "政策解读 · 行业动态", tone: "p-navy", to: "/news" },
  { id: "hr", title: "人力资源", desc: "人才引流 · 一站式解决", tone: "p-red", to: "/services/hall?cat=hr" },
];

export const serviceValueProps = [
  { title: "3 秒响应", desc: "AI 需求解析与匹配" },
  { title: "95%+ 准确率", desc: "严选服务商资源池" },
  { title: "里程碑付款", desc: "电子合同 · 资金托管" },
  { title: "全链路履约", desc: "节点管控 · 结果核验" },
];

export const enterpriseServices: EnterpriseService[] = [
  {
    id: "s1",
    categoryId: "ip",
    category: "知识产权",
    categoryL2: "商标专利",
    categoryL3: "商标注册",
    name: "商标注册全程代办",
    desc: "检索评估 · 递交申请 · 异议答辩",
    overview: "覆盖商标近似检索、申请材料撰写、官方进度跟踪与异议答辩辅导，适合首次注册与品牌布局企业。",
    price: "1,280 起",
    priceMin: 1280,
    provider: "万联知产",
    image: "/services/s1.svg",
    features: ["近似检索", "材料撰写", "进度跟踪"],
    delivery: "15–30 个工作日",
    tone: "t1",
    hot: true,
    publishedAt: "2026-08-28",
    rating: 4.9,
    providerRating: 4.8,
    salesCount: 860,
  },
  {
    id: "s2",
    categoryId: "finance_tax",
    category: "工商财税",
    categoryL2: "代理记账",
    categoryL3: "一般纳税人记账",
    name: "代理记账 · 报税",
    desc: "月度账务 · 增值税申报 · 汇算清缴",
    overview: "面向一般纳税人的月度账务处理、增值税及附加税申报、汇算清缴辅导，含专属财务顾问答疑。",
    price: "680 / 月",
    priceMin: 680,
    provider: "正衡会计",
    image: "/services/s2.svg",
    features: ["凭证整理", "纳税申报", "财务咨询"],
    delivery: "按月服务",
    tone: "t2",
    hot: true,
    publishedAt: "2026-08-20",
    rating: 4.8,
    providerRating: 4.7,
    salesCount: 1240,
  },
  {
    id: "s3",
    categoryId: "legal",
    category: "法律服务",
    categoryL2: "合同事务",
    categoryL3: "合同审查与起草",
    name: "合同审查与起草",
    desc: "采购 / 劳动 / 保密协议专业审阅",
    overview: "针对采购、劳动、保密等常见合同提供风险标注、条款优化与电子签章对接，降低履约纠纷。",
    price: "800 / 份",
    priceMin: 800,
    provider: "临港律所",
    image: "/services/s3.svg",
    features: ["风险标注", "条款优化", "电子签章"],
    delivery: "3–5 个工作日",
    tone: "t3",
    publishedAt: "2026-08-10",
    rating: 4.7,
    providerRating: 4.6,
    salesCount: 420,
  },
  {
    id: "s4",
    categoryId: "hr",
    category: "人力资源",
    categoryL2: "社保公积金",
    categoryL3: "代缴代办",
    name: "社保公积金代缴",
    desc: "参保增减员 · 公积金缴存 · 台账",
    overview: "支持多城市参保增减员、公积金缴存与台账同步，适合用工波动较大的制造与服务业企业。",
    price: "30 / 人",
    priceMin: 30,
    provider: "园服人力",
    image: "/services/s4.svg",
    features: ["合规申报", "异动办理", "月度报表"],
    delivery: "T+1 办理",
    tone: "t4",
    publishedAt: "2026-08-05",
    rating: 4.6,
    providerRating: 4.5,
    salesCount: 980,
  },
  {
    id: "s5",
    categoryId: "brand",
    category: "品牌与设计",
    categoryL2: "视觉设计",
    categoryL3: "品牌物料",
    name: "宣传物料策划与设计",
    desc: "画册 / 海报 / 展会物料一体化设计",
    overview: "从创意策划到视觉设计与印刷对接，覆盖企业画册、海报与展会物料，统一品牌视觉语言。",
    price: "2,000 起",
    priceMin: 2000,
    provider: "象限设计",
    image: "/services/s5.svg",
    features: ["创意策划", "视觉设计", "印刷对接"],
    delivery: "7–10 个工作日",
    tone: "t1",
    hot: true,
    publishedAt: "2026-08-22",
    rating: 4.8,
    providerRating: 4.9,
    salesCount: 510,
  },
  {
    id: "s6",
    categoryId: "brand",
    category: "品牌与设计",
    categoryL2: "数字产品设计",
    categoryL3: "UI 界面设计",
    name: "UI 界面设计",
    desc: "Web / 小程序 / 管理后台界面设计",
    overview: "提供 Web、小程序与管理后台的交互原型、视觉规范与切图交付，适配多端一致性体验。",
    price: "8,000 起",
    priceMin: 8000,
    provider: "象限设计",
    image: "/services/s6.svg",
    features: ["交互原型", "视觉规范", "切图交付"],
    delivery: "按里程碑",
    tone: "t2",
    publishedAt: "2026-07-30",
    rating: 4.7,
    providerRating: 4.9,
    salesCount: 190,
  },
  {
    id: "s7",
    categoryId: "software",
    category: "软件与信息化",
    categoryL2: "系统集成",
    categoryL3: "ERP 对接",
    name: "ERP 与集采平台对接",
    desc: "订单 / 库存 / 对账数据互通开发",
    overview: "打通 ERP 与园区集采平台的订单、库存与对账数据，含需求调研、接口开发与联调上线。",
    price: "8–12 万",
    priceMin: 80000,
    provider: "智造云科",
    image: "/services/s7.svg",
    features: ["需求调研", "接口开发", "联调上线"],
    delivery: "6–8 周",
    tone: "t3",
    publishedAt: "2026-08-01",
    rating: 4.5,
    providerRating: 4.6,
    salesCount: 66,
  },
  {
    id: "s8",
    categoryId: "marketing",
    category: "营销推广",
    categoryL2: "内容运营",
    categoryL3: "短视频代运营",
    name: "短视频账号代运营",
    desc: "脚本策划 · 拍摄剪辑 · 投流优化",
    overview: "覆盖脚本策划、拍摄剪辑与投流优化，按月复盘数据，帮助企业账号持续获客。",
    price: "5,000 / 月",
    priceMin: 5000,
    provider: "新媒工场",
    image: "/services/s8.svg",
    features: ["内容策划", "数据分析", "月度复盘"],
    delivery: "按月服务",
    tone: "t4",
    publishedAt: "2026-08-18",
    rating: 4.6,
    providerRating: 4.4,
    salesCount: 230,
  },
  {
    id: "s9",
    categoryId: "consulting",
    category: "咨询培训",
    categoryL2: "管理咨询",
    categoryL3: "战略规划",
    name: "企业战略规划咨询",
    desc: "行业分析 · 业务组合 · 实施路径",
    overview: "通过高管访谈与竞品分析，输出业务组合建议与可落地实施路径，服务成长型企业管理层。",
    price: "3 万起",
    priceMin: 30000,
    provider: "远策咨询",
    image: "/services/s9.svg",
    features: ["高管访谈", "竞品分析", "书面方案"],
    delivery: "4–6 周",
    tone: "t1",
    publishedAt: "2026-07-20",
    rating: 4.8,
    providerRating: 4.7,
    salesCount: 48,
  },
  {
    id: "s10",
    categoryId: "consulting",
    category: "咨询培训",
    categoryL2: "数字化转型",
    categoryL3: "转型路线图",
    name: "数字化转型路线图",
    desc: "现状评估 · 系统选型 · 分阶段实施",
    overview: "评估企业数字化现状，给出系统选型建议与分阶段实施路线，可选实施陪跑服务。",
    price: "2.5 万起",
    priceMin: 25000,
    provider: "智造云科",
    image: "/services/s10.svg",
    features: ["流程梳理", "ROI 测算", "实施陪跑"],
    delivery: "3–4 周",
    tone: "t2",
    publishedAt: "2026-08-08",
    rating: 4.6,
    providerRating: 4.6,
    salesCount: 72,
  },
  {
    id: "s11",
    categoryId: "inspection",
    category: "检验检测",
    categoryL2: "质量检测",
    categoryL3: "第三方认证",
    name: "产品第三方检测认证",
    desc: "质量检测 · 报告出具 · 认证辅导",
    overview: "提供产品质量检测、合规报告出具与认证辅导，支持复检与整改建议。",
    price: "按项报价",
    priceMin: 1500,
    provider: "华测检测",
    image: "/services/s11.svg",
    features: ["样品检测", "合规报告", "复检支持"],
    delivery: "7–15 个工作日",
    tone: "t3",
    publishedAt: "2026-08-12",
    rating: 4.5,
    providerRating: 4.8,
    salesCount: 155,
  },
  {
    id: "s12",
    categoryId: "general",
    category: "企业综合",
    categoryL2: "安防消防",
    categoryL3: "消防验收咨询",
    name: "厂区消防验收咨询",
    desc: "规范解读 · 整改方案 · 验收陪同",
    overview: "解读消防验收规范，出具整改清单并陪同验收，帮助厂区快速通过合规检查。",
    price: "1.5 万内",
    priceMin: 8000,
    provider: "安盾工程",
    image: "/services/s12.svg",
    features: ["现场勘查", "整改清单", "资料准备"],
    delivery: "2–3 周",
    tone: "t4",
    publishedAt: "2026-07-25",
    rating: 4.4,
    providerRating: 4.5,
    salesCount: 88,
  },
  {
    id: "s13",
    categoryId: "overseas",
    category: "出海企服",
    categoryL2: "海外主体",
    categoryL3: "公司注册与合规",
    name: "海外公司注册与合规",
    desc: "主体设立 · 银行开户 · 税务合规",
    overview: "覆盖海外主体设立、银行开户与税务合规辅导，提供属地选型建议与秘书服务。",
    price: "1.2 万起",
    priceMin: 12000,
    provider: "跨境企服",
    image: "/services/s13.svg",
    features: ["属地选型", "材料代办", "秘书服务"],
    delivery: "15–30 个工作日",
    tone: "t1",
    publishedAt: "2026-08-15",
    rating: 4.7,
    providerRating: 4.6,
    salesCount: 110,
  },
  {
    id: "s14",
    categoryId: "finance_tax",
    category: "工商财税",
    categoryL2: "代理记账",
    categoryL3: "小规模纳税人记账",
    name: "小规模纳税人代记账",
    desc: "凭证编制 · 月度申报 · 年末汇算",
    overview: "专为小规模纳税人设计的代记账服务，含票据整理、月度申报与年末汇算、顾问答疑。",
    price: "1,000 / 月",
    priceMin: 1000,
    provider: "正衡会计",
    image: "/services/s14.svg",
    features: ["票据整理", "税务申报", "顾问答疑"],
    delivery: "7 天起服务",
    tone: "t2",
    hot: true,
    publishedAt: "2026-08-25",
    rating: 4.9,
    providerRating: 4.7,
    salesCount: 760,
  },
];

export const serviceOrders = [
  { id: "o1", name: "商标注册全程代办", status: "履约中", node: "材料已递交", time: "今天" },
  { id: "o2", name: "代理记账 · 报税", status: "待付款", node: "7 月服务账单", time: "08-18" },
  { id: "o3", name: "合同审查与起草", status: "已完成", node: "成果已交付", time: "08-10" },
];

export const priceRangeFilters = [
  { id: "all", label: "价格不限" },
  { id: "p1", label: "¥1,000 以内", max: 1000 },
  { id: "p2", label: "¥1,000 – ¥5,000", min: 1000, max: 5000 },
  { id: "p3", label: "¥5,000 – ¥1 万", min: 5000, max: 10000 },
  { id: "p4", label: "¥1 万以上", min: 10000 },
] as const;

export const publishedWithinFilters = [
  { id: "all", label: "发布时间不限" },
  { id: "d7", label: "近 7 天", days: 7 },
  { id: "d30", label: "近 30 天", days: 30 },
  { id: "d90", label: "近 90 天", days: 90 },
] as const;

export const ratingFilters = [
  { id: "all", label: "评分不限" },
  { id: "r45", label: "4.5 分及以上", min: 4.5 },
  { id: "r40", label: "4.0 分及以上", min: 4.0 },
  { id: "r35", label: "3.5 分及以上", min: 3.5 },
] as const;

export const sortOptions = [
  { id: "comprehensive", label: "综合排序" },
  { id: "price_asc", label: "价格从低到高" },
  { id: "price_desc", label: "价格从高到低" },
  { id: "rating_desc", label: "评分优先" },
  { id: "newest", label: "最新发布" },
] as const;

export type ServiceHallFilters = {
  categoryId: ServiceCategoryId | "all";
  categoryL2: string;
  categoryL3: string;
  query: string;
  /** 快捷选项 id；自定义输入后为 custom */
  pricePreset: string;
  priceMin: string;
  priceMax: string;
  publishedPreset: string;
  publishedFrom: string;
  publishedTo: string;
  ratingPreset: string;
  ratingLo: string;
  ratingHi: string;
  sort: string;
};

export const defaultHallFilters: ServiceHallFilters = {
  categoryId: "all",
  categoryL2: "",
  categoryL3: "",
  query: "",
  pricePreset: "all",
  priceMin: "",
  priceMax: "",
  publishedPreset: "all",
  publishedFrom: "",
  publishedTo: "",
  ratingPreset: "all",
  ratingLo: "",
  ratingHi: "",
  sort: "comprehensive",
};

const FILTER_TODAY = "2026-09-07";

function toIsoDaysAgo(days: number, today = FILTER_TODAY) {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function parseOptNum(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function applyPricePreset(presetId: string): Pick<ServiceHallFilters, "pricePreset" | "priceMin" | "priceMax"> {
  const pr = priceRangeFilters.find((f) => f.id === presetId);
  if (!pr || pr.id === "all") return { pricePreset: "all", priceMin: "", priceMax: "" };
  return {
    pricePreset: pr.id,
    priceMin: "min" in pr && pr.min != null ? String(pr.min) : "",
    priceMax: "max" in pr && pr.max != null ? String(pr.max) : "",
  };
}

export function applyPublishedPreset(
  presetId: string,
): Pick<ServiceHallFilters, "publishedPreset" | "publishedFrom" | "publishedTo"> {
  const pw = publishedWithinFilters.find((f) => f.id === presetId);
  if (!pw || pw.id === "all") return { publishedPreset: "all", publishedFrom: "", publishedTo: "" };
  return {
    publishedPreset: pw.id,
    publishedFrom: toIsoDaysAgo(pw.days),
    publishedTo: FILTER_TODAY,
  };
}

export function applyRatingPreset(presetId: string): Pick<ServiceHallFilters, "ratingPreset" | "ratingLo" | "ratingHi"> {
  const rr = ratingFilters.find((f) => f.id === presetId);
  if (!rr || rr.id === "all") return { ratingPreset: "all", ratingLo: "", ratingHi: "" };
  return {
    ratingPreset: rr.id,
    ratingLo: "min" in rr ? String(rr.min) : "",
    ratingHi: "",
  };
}

function hotScore(s: EnterpriseService) {
  return (s.hot ? 25 : 0) + s.rating * 12 + s.providerRating * 8 + s.salesCount / 20;
}

export function getHotServices(limit = 8) {
  return [...enterpriseServices].sort((a, b) => hotScore(b) - hotScore(a)).slice(0, limit);
}

export function getL2Options(categoryId: ServiceCategoryId | "all") {
  if (categoryId === "all") return [] as CategoryLevel[];
  return serviceCategoryTree[categoryId] ?? [];
}

export function getL3Options(categoryId: ServiceCategoryId | "all", l2Label: string) {
  return getL2Options(categoryId).find((n) => n.label === l2Label)?.children ?? [];
}

export function categoryPathLabel(filters: Pick<ServiceHallFilters, "categoryId" | "categoryL2" | "categoryL3">) {
  if (filters.categoryId === "all") return "全部服务";
  const l1 = serviceCategories.find((c) => c.id === filters.categoryId)?.label ?? "";
  return [l1, filters.categoryL2, filters.categoryL3].filter(Boolean).join(" / ");
}

export function filterEnterpriseServices(filters: ServiceHallFilters) {
  let list = [...enterpriseServices];

  if (filters.categoryId !== "all") {
    list = list.filter((s) => s.categoryId === filters.categoryId);
  }
  if (filters.categoryL2) {
    list = list.filter((s) => s.categoryL2 === filters.categoryL2);
  }
  if (filters.categoryL3) {
    list = list.filter((s) => s.categoryL3 === filters.categoryL3);
  }

  const q = filters.query.trim().toLowerCase();
  if (q) {
    list = list.filter((s) => {
      const bag = [
        s.name,
        s.desc,
        s.overview,
        s.provider,
        s.category,
        s.categoryL2,
        s.categoryL3,
        ...s.features,
      ]
        .join(" ")
        .toLowerCase();
      return bag.includes(q);
    });
  }

  const pMin = parseOptNum(filters.priceMin);
  const pMax = parseOptNum(filters.priceMax);
  if (pMin != null || pMax != null) {
    list = list.filter((s) => {
      if (pMin != null && s.priceMin < pMin) return false;
      if (pMax != null && s.priceMin > pMax) return false;
      return true;
    });
  }

  if (filters.publishedFrom || filters.publishedTo) {
    list = list.filter((s) => {
      if (filters.publishedFrom && s.publishedAt < filters.publishedFrom) return false;
      if (filters.publishedTo && s.publishedAt > filters.publishedTo) return false;
      return true;
    });
  }

  const rLo = parseOptNum(filters.ratingLo);
  const rHi = parseOptNum(filters.ratingHi);
  if (rLo != null || rHi != null) {
    list = list.filter((s) => {
      if (rLo != null && s.rating < rLo) return false;
      if (rHi != null && s.rating > rHi) return false;
      return true;
    });
  }

  switch (filters.sort) {
    case "price_asc":
      list.sort((a, b) => a.priceMin - b.priceMin);
      break;
    case "price_desc":
      list.sort((a, b) => b.priceMin - a.priceMin);
      break;
    case "rating_desc":
      list.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      break;
    default:
      list.sort((a, b) => hotScore(b) - hotScore(a));
  }

  return list;
}

export function servicesCatalogSummary(): ServiceItem[] {
  return enterpriseServices.slice(0, 4).map(({ id, category, name, desc, price, provider }) => ({
    id,
    category,
    name,
    desc,
    price,
    provider,
  }));
}

export const categoryLabelMap: Record<ServiceCategoryId, string> = Object.fromEntries(
  serviceCategories.filter((c) => c.id !== "all").map((c) => [c.id, c.label]),
) as Record<ServiceCategoryId, string>;
