import { enterpriseServices, type EnterpriseService } from "./enterpriseServices";

/** 客户端展示用：对齐供应商端 A1Service 发布模型（MVP mock） */

export type PriceUnit = "项" | "次" | "件";

export type DayType = "自然日" | "工作日";

export type FulfillmentType = "once_pay_once_accept" | "installment_pay_installment_accept";

export const FULFILLMENT_LABEL: Record<FulfillmentType, string> = {
  once_pay_once_accept: "一次性支付 · 一次性验收",
  installment_pay_installment_accept: "分期支付 · 分期验收",
};

export type PublishedMedia = {
  id: string;
  name: string;
  kind: "image" | "video" | "file";
  url?: string;
};

export type PublishedPhase = {
  id: string;
  name: string;
  settleRatio: number;
  deliveryCycleDays: number;
  deliveryStandard: string;
};

export type PublishedVersion = {
  id: string;
  name: string;
  sellingPoints: string;
  /** 规格亮点列表（右侧规格区展示） */
  highlights: string[];
  price: number;
  unit: PriceUnit;
  startAfterPayDays: number;
  startDayType: DayType;
  fulfillmentType: FulfillmentType;
  deliveryCycleDays: number;
  deliveryStandard: string;
  phases: PublishedPhase[];
};

export type PublishedCase = {
  id: string;
  categoryPath: string;
  title: string;
  intro: string;
  coverUrl?: string;
};

export type PublishedFaq = {
  id: string;
  question: string;
  answer: string;
};

export type PublishedReview = {
  id: string;
  /** 本服务评价 / 本店其他服务评价 */
  scope: "service" | "shop";
  buyerName: string;
  score: number;
  content: string;
  tags?: string[];
  createdAt: string;
  serviceName?: string;
  reply?: string;
};

/** 店铺资料（对齐供应商端 A1ShopProfile + 展示扩展） */
export type PublishedShop = {
  id: string;
  name: string;
  intro: string;
  phone: string;
  logoUrl?: string;
  bannerUrl?: string;
  badges: string[];
  score: number;
  halfYearDeals: number;
  employerCount: number;
  completeRate: number;
  introImages: PublishedMedia[];
  teamImages: PublishedMedia[];
};

export type PublishedService = {
  id: string;
  shop: PublishedShop;
  categoryL1: string;
  categoryL2: string;
  categoryL3: string;
  name: string;
  intro: string;
  serviceAreaLabel: string;
  coverUrl?: string;
  media: PublishedMedia[];
  taxRate: number;
  versions: PublishedVersion[];
  detailContent: string;
  detailGuarantee: string;
  detailImages: PublishedMedia[];
  relatedCases: PublishedCase[];
  faqs: PublishedFaq[];
  reviews: PublishedReview[];
  salesCount: number;
  rating: number;
};

export const categoryPath = (s: Pick<PublishedService, "categoryL1" | "categoryL2" | "categoryL3">) =>
  [s.categoryL1, s.categoryL2, s.categoryL3].filter(Boolean).join(" / ");

export const minVersionPrice = (s: PublishedService): { price: number; unit: PriceUnit } | null => {
  if (!s.versions.length) return null;
  const sorted = [...s.versions].sort((a, b) => a.price - b.price);
  const v = sorted[0];
  return { price: v.price, unit: v.unit };
};

export const formatPrice = (price: number, unit: PriceUnit) =>
  `¥${price.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/${unit}`;

export const formatMoney = (price: number) =>
  `¥${price.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const isInstallmentFulfillment = (v: PublishedVersion) =>
  v.fulfillmentType === "installment_pay_installment_accept" && v.phases.length > 0;

/** 订单待支付：一次性付全款；分期仅先付首笔（首期 settleRatio%） */
export function payableNow(orderTotal: number, v: PublishedVersion): {
  amount: number;
  mode: "full" | "first";
  firstPhaseName?: string;
  firstRatio?: number;
} {
  if (!isInstallmentFulfillment(v)) {
    return { amount: orderTotal, mode: "full" };
  }
  const first = v.phases[0];
  const amount = Math.round(((orderTotal * first.settleRatio) / 100) * 100) / 100;
  return {
    amount,
    mode: "first",
    firstPhaseName: first.name,
    firstRatio: first.settleRatio,
  };
}

export const versionHighlights = (v: PublishedVersion): string[] => {
  if (v.highlights?.length) return v.highlights;
  return v.sellingPoints
    .split(/[·、|/]/)
    .map((x) => x.trim())
    .filter(Boolean);
};

/** 本地封面：public/services 仅有 s1–s14.svg；-d1/-d2 用邻近封面做差异展示 */
function serviceAsset(id: string, suffix = "") {
  const n = Number(String(id).replace(/\D/g, "")) || 1;
  const clamped = ((n - 1) % 14) + 1;
  if (!suffix) return `/services/s${clamped}.svg`;
  const offset = suffix.includes("d2") ? 2 : 1;
  const alt = ((clamped - 1 + offset) % 14) + 1;
  return `/services/s${alt}.svg`;
}

const shopByProvider: Record<string, PublishedShop> = {
  万联知产: {
    id: "shop-wanlian",
    name: "万联知产",
    intro:
      "万联知产专注知识产权代理与维权，深耕园区制造与科技企业商标、专利与版权业务，材料一次齐、进度可查。",
    phone: "400-820-1180",
    logoUrl: serviceAsset("s1"),
    bannerUrl: serviceAsset("s1", "-d1"),
    badges: ["严选服务商", "园区入驻", "保证金已缴", "及时回复"],
    score: 4.8,
    halfYearDeals: 326,
    employerCount: 148,
    completeRate: 99,
    introImages: [{ id: "wl-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s1", "-d1") }],
    teamImages: [{ id: "wl-t1", name: "团队", kind: "image", url: serviceAsset("s1", "-d2") }],
  },
  正衡会计: {
    id: "shop-zhengheng",
    name: "正衡会计",
    intro: "工商财税一体化服务，熟悉园区政策与申报节奏，为入驻企业提供记账报税与顾问答疑。",
    phone: "400-821-2266",
    logoUrl: serviceAsset("s2"),
    bannerUrl: serviceAsset("s2", "-d1"),
    badges: ["严选服务商", "财税资质", "企业"],
    score: 4.7,
    halfYearDeals: 512,
    employerCount: 220,
    completeRate: 98,
    introImages: [{ id: "zh-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s2", "-d1") }],
    teamImages: [{ id: "zh-t1", name: "团队", kind: "image", url: serviceAsset("s14", "-d2") }],
  },
  临港律所: {
    id: "shop-lingang",
    name: "临港律所",
    intro: "商事合同与劳动合规团队，服务园区企业日常法务与专项审查。",
    phone: "021-5888-6600",
    logoUrl: serviceAsset("s3"),
    bannerUrl: serviceAsset("s3", "-d1"),
    badges: ["律师事务所", "园区合作", "专业靠谱"],
    score: 4.9,
    halfYearDeals: 186,
    employerCount: 96,
    completeRate: 100,
    introImages: [{ id: "lg-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s3", "-d1") }],
    teamImages: [{ id: "lg-t1", name: "团队", kind: "image", url: serviceAsset("s3", "-d2") }],
  },
  园服人力: {
    id: "shop-yuanfu",
    name: "园服人力",
    intro: "社保公积金与用工合规代办，覆盖园区入驻企业增减员与台账管理。",
    phone: "400-600-7788",
    logoUrl: serviceAsset("s4"),
    bannerUrl: serviceAsset("s4", "-d1"),
    badges: ["人力资源", "及时回复"],
    score: 4.6,
    halfYearDeals: 410,
    employerCount: 180,
    completeRate: 97,
    introImages: [{ id: "yf-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s4", "-d1") }],
    teamImages: [{ id: "yf-t1", name: "团队", kind: "image", url: serviceAsset("s4", "-d2") }],
  },
  象限设计: {
    id: "shop-xiangxian",
    name: "象限设计",
    intro: "品牌视觉与数字产品设计工作室，服务官网、小程序与管理后台体验升级。",
    phone: "400-900-3311",
    logoUrl: serviceAsset("s6"),
    bannerUrl: serviceAsset("s6", "-d1"),
    badges: ["设计严选", "回头客多", "保证金已缴"],
    score: 4.8,
    halfYearDeals: 94,
    employerCount: 52,
    completeRate: 98,
    introImages: [{ id: "xx-i1", name: "作品墙", kind: "image", url: serviceAsset("s5", "-d1") }],
    teamImages: [{ id: "xx-t1", name: "团队", kind: "image", url: serviceAsset("s6", "-d2") }],
  },
  智造云科: {
    id: "shop-zhizao",
    name: "智造云科",
    intro: "工业软件与企业数字化实施服务商，擅长 ERP / 集采对接与路线图规划。",
    phone: "400-712-0909",
    logoUrl: serviceAsset("s7"),
    bannerUrl: serviceAsset("s7", "-d1"),
    badges: ["数字化服务商", "园区入驻", "企业"],
    score: 4.7,
    halfYearDeals: 58,
    employerCount: 34,
    completeRate: 96,
    introImages: [{ id: "zz-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s7", "-d1") }],
    teamImages: [{ id: "zz-t1", name: "团队", kind: "image", url: serviceAsset("s10", "-d2") }],
  },
  新媒工场: {
    id: "shop-xinmei",
    name: "新媒工场",
    intro: "短视频与内容营销代运营团队，覆盖脚本、拍摄与投流优化。",
    phone: "400-555-1212",
    logoUrl: serviceAsset("s8"),
    bannerUrl: serviceAsset("s8", "-d1"),
    badges: ["营销严选", "及时回复"],
    score: 4.5,
    halfYearDeals: 120,
    employerCount: 40,
    completeRate: 95,
    introImages: [{ id: "xm-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s8", "-d1") }],
    teamImages: [{ id: "xm-t1", name: "团队", kind: "image", url: serviceAsset("s8", "-d2") }],
  },
  远策咨询: {
    id: "shop-yuance",
    name: "远策咨询",
    intro: "战略与管理咨询，服务成长型企业业务组合与实施路径设计。",
    phone: "400-333-7788",
    logoUrl: serviceAsset("s9"),
    bannerUrl: serviceAsset("s9", "-d1"),
    badges: ["咨询严选", "企业"],
    score: 4.8,
    halfYearDeals: 42,
    employerCount: 28,
    completeRate: 99,
    introImages: [{ id: "yc-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s9", "-d1") }],
    teamImages: [{ id: "yc-t1", name: "团队", kind: "image", url: serviceAsset("s9", "-d2") }],
  },
  华测检测: {
    id: "shop-huace",
    name: "华测检测",
    intro: "第三方检测认证与合规辅导，出具权威检测报告。",
    phone: "400-6788-333",
    logoUrl: serviceAsset("s11"),
    bannerUrl: serviceAsset("s11", "-d1"),
    badges: ["检测机构", "资质齐全"],
    score: 4.6,
    halfYearDeals: 210,
    employerCount: 130,
    completeRate: 98,
    introImages: [{ id: "hc-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s11", "-d1") }],
    teamImages: [{ id: "hc-t1", name: "团队", kind: "image", url: serviceAsset("s11", "-d2") }],
  },
  安盾工程: {
    id: "shop-andun",
    name: "安盾工程",
    intro: "消防与安防工程咨询服务，协助园区企业验收合规。",
    phone: "400-211-5566",
    logoUrl: serviceAsset("s12"),
    bannerUrl: serviceAsset("s12", "-d1"),
    badges: ["工程咨询", "园区合作"],
    score: 4.5,
    halfYearDeals: 66,
    employerCount: 40,
    completeRate: 97,
    introImages: [{ id: "ad-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s12", "-d1") }],
    teamImages: [{ id: "ad-t1", name: "团队", kind: "image", url: serviceAsset("s12", "-d2") }],
  },
  跨境企服: {
    id: "shop-kuajing",
    name: "跨境企服",
    intro: "海外主体设立与跨境合规服务，覆盖开户与税务合规辅导。",
    phone: "400-188-6688",
    logoUrl: serviceAsset("s13"),
    bannerUrl: serviceAsset("s13", "-d1"),
    badges: ["出海企服", "企业"],
    score: 4.7,
    halfYearDeals: 88,
    employerCount: 55,
    completeRate: 96,
    introImages: [{ id: "kj-i1", name: "店铺介绍", kind: "image", url: serviceAsset("s13", "-d1") }],
    teamImages: [{ id: "kj-t1", name: "团队", kind: "image", url: serviceAsset("s13", "-d2") }],
  },
};

/** 供应商端单位仅 项 / 次 / 件；列表文案中的月、人、份、个等映射到这三类 */
function parseLeadPrice(raw: string): { price: number; unit: PriceUnit } {
  const unitMatch = raw.match(/\/\s*(月|人|份|次|项|个|件)/);
  const unitMap: Record<string, PriceUnit> = {
    月: "次",
    人: "件",
    份: "项",
    次: "次",
    项: "项",
    个: "件",
    件: "件",
  };
  const unit = unitMatch ? unitMap[unitMatch[1]] ?? "项" : "项";
  const num = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (num) {
    let price = Number(num[1]);
    if (/万/.test(raw)) price *= 10000;
    return { price, unit };
  }
  return { price: 0, unit: "项" };
}

function splitHighlights(points: string, fallback: string[] = []): string[] {
  const fromPoints = points
    .split(/[·、|/]/)
    .map((x) => x.trim())
    .filter(Boolean);
  return fromPoints.length ? fromPoints : fallback;
}

function onceVersion(
  id: string,
  name: string,
  price: number,
  unit: PriceUnit,
  cycle: number,
  standard: string,
  points: string,
  highlights?: string[],
): PublishedVersion {
  return {
    id,
    name,
    sellingPoints: points,
    highlights: highlights ?? splitHighlights(points),
    price,
    unit,
    startAfterPayDays: 1,
    startDayType: "工作日",
    fulfillmentType: "once_pay_once_accept",
    deliveryCycleDays: cycle,
    deliveryStandard: standard,
    phases: [],
  };
}

function defaultReviews(serviceId: string, serviceName: string, shopName: string): PublishedReview[] {
  return [
    {
      id: `${serviceId}-r1`,
      scope: "service",
      buyerName: "张**",
      score: 5,
      content: `「${serviceName}」交付清晰，沟通顺畅，推荐园区企业选用。`,
      tags: ["专业靠谱", "响应及时"],
      createdAt: "2026-08-20 14:32",
      serviceName,
    },
    {
      id: `${serviceId}-r2`,
      scope: "service",
      buyerName: "李**",
      score: 4,
      content: "整体满意，材料准备清单很实用，补正一次就过。",
      tags: ["材料一次过"],
      createdAt: "2026-08-02 09:18",
      serviceName,
    },
    {
      id: `${serviceId}-r3`,
      scope: "shop",
      buyerName: "王**",
      score: 5,
      content: `在${shopName}采购过其他服务，服务态度好，会继续合作。`,
      tags: ["服务周到"],
      createdAt: "2026-07-18 16:45",
      serviceName: "本店其他服务",
    },
  ];
}

function synthesize(base: EnterpriseService): PublishedService {
  const l1 = base.category;
  const l2 = base.categoryL2;
  const l3 = base.categoryL3;
  const shop = shopByProvider[base.provider] ?? {
    id: `shop-${base.provider}`,
    name: base.provider,
    intro: `${base.provider} · 园区严选服务商`,
    phone: "400-000-0000",
    badges: ["严选服务商"],
    score: 4.6,
    halfYearDeals: 30,
    employerCount: 20,
    completeRate: 96,
    introImages: [],
    teamImages: [],
  };
  const { price, unit } = parseLeadPrice(base.price);
  const cycleHint = Number((base.delivery.match(/\d+/) ?? ["7"])[0]);
  const cover = serviceAsset(base.id);
  const d1 = serviceAsset(base.id, "-d1");
  const d2 = serviceAsset(base.id, "-d2");

  return {
    id: base.id,
    shop,
    categoryL1: l1,
    categoryL2: l2,
    categoryL3: l3,
    name: base.name,
    intro: base.desc,
    serviceAreaLabel: "全国 · 园区重点城市",
    coverUrl: cover,
    media: [
      { id: `${base.id}-cover`, name: "封面", kind: "image", url: cover },
      { id: `${base.id}-m1`, name: "展示图 1", kind: "image", url: d1 },
      { id: `${base.id}-m2`, name: "展示图 2", kind: "image", url: d2 },
    ],
    taxRate: 6,
    versions: [
      onceVersion(
        `${base.id}-v1`,
        "标准版",
        price || 1000,
        unit,
        cycleHint,
        `按约定完成「${base.name}」交付，含：${base.features.join("、")}。`,
        base.features.join(" · "),
        base.features,
      ),
    ],
    detailContent: [
      `【服务范围】`,
      ...base.features.map((f, i) => `${i + 1}. ${f}`),
      ``,
      `【交付说明】`,
      base.delivery,
      ``,
      `【适用对象】`,
      `园区入驻企业及相关经营主体。`,
    ].join("\n"),
    detailGuarantee:
      "工作日 4 小时内响应咨询；关键节点进度可查；材料需补正时 1 个工作日内协助处理。平台支持里程碑付款与验收。",
    detailImages: [
      { id: `${base.id}-d1`, name: "详情图 1", kind: "image", url: d1 },
      { id: `${base.id}-d2`, name: "详情图 2", kind: "image", url: d2 },
    ],
    relatedCases: [
      {
        id: `${base.id}-case-1`,
        categoryPath: `${l1} / ${l2} / ${l3}`,
        title: `${base.name} · 园区客户案例`,
        intro: `为园区企业完成「${base.name}」交付，周期可控、节点透明。`,
        coverUrl: d1,
      },
    ],
    faqs: [
      {
        id: `${base.id}-f1`,
        question: "如何确认服务范围？",
        answer: "请在右侧选择规格查看亮点与交付标准；确认购买意向后服务商将与您细化需求。",
      },
      {
        id: `${base.id}-f2`,
        question: "发票税率是多少？",
        answer: `本服务默认开具增值税发票，税率 ${6}%。`,
      },
    ],
    reviews: defaultReviews(base.id, base.name, shop.name),
    salesCount: base.salesCount,
    rating: base.rating,
  };
}

const richOverrides: Partial<Record<string, Partial<PublishedService>>> = {
  s1: {
    intro: "含近似检索、材料撰写递交与进度跟踪，支持异议阶段协同。",
    serviceAreaLabel: "全国",
    salesCount: 326,
    rating: 4.9,
    versions: [
      onceVersion(
        "s1-v1",
        "基础检索版",
        980,
        "项",
        20,
        "完成近似检索报告与申请材料递交，交付受理回执。",
        "近似检索 · 材料代写 · 递交受理",
        ["近似检索报告", "材料代写", "网申递交", "受理回执"],
      ),
      onceVersion(
        "s1-v2",
        "全程代办版",
        1280,
        "项",
        30,
        "含检索、递交、补正协同与进度跟踪至初审通知。",
        "异议答辩协同 · 进度专属跟进",
        ["近似检索", "材料撰写递交", "补正协同", "进度专属跟进", "异议阶段咨询"],
      ),
      onceVersion(
        "s1-v3",
        "加急辅导版",
        1980,
        "项",
        15,
        "优先排期撰写与递交，含一次补正辅导。",
        "优先排期 · 一次补正辅导",
        ["优先排期", "加急递交", "一次补正辅导", "专属顾问"],
      ),
    ],
    detailContent:
      "【服务范围】\n1. 商标近似检索与可行性评估\n2. 申请书与说明书撰写\n3. 网申递交与补正协同\n4. 关键节点进度反馈\n\n【服务说明】\n不含异议答辩代理诉讼费用（可另询）。",
    detailGuarantee:
      "工作日 2 小时内响应；递交后进度可查；官方补正通知 1 个工作日内同步。平台托管付款，节点验收后结算。",
    relatedCases: [
      {
        id: "case-s1-1",
        categoryPath: "知识产权 / 商标专利 / 商标注册",
        title: "某智能装备品牌 3 类商标注册",
        intro: "15 个工作日完成递交，初审一次通过。",
        coverUrl: serviceAsset("s1", "-d1"),
      },
      {
        id: "case-s1-2",
        categoryPath: "知识产权 / 商标专利 / 商标注册",
        title: "园区科技企业商标组合布局",
        intro: "主商标 + 系列商标分批申报，规避近似风险。",
        coverUrl: serviceAsset("s1", "-d2"),
      },
    ],
    faqs: [
      { id: "s1-f1", question: "是否含刻章？", answer: "不含，可另询代办。" },
      { id: "s1-f2", question: "多久出受理回执？", answer: "材料齐全通常 3–7 个工作日完成递交并取得回执。" },
    ],
  },
  s6: {
    categoryL1: "品牌与设计",
    categoryL2: "数字产品设计",
    categoryL3: "UI 界面设计",
    intro: "Web / 小程序 / 管理后台界面设计，含交互原型与视觉规范。",
    serviceAreaLabel: "全国（远程协作）",
    salesCount: 64,
    rating: 4.8,
    versions: [
      onceVersion(
        "s6-v1",
        "单端标准版",
        8000,
        "项",
        21,
        "交付完整视觉稿、基础切图与组件说明。",
        "交互原型 · 视觉规范 · 切图交付",
        ["交互原型", "视觉规范", "切图交付", "1 轮集中修改"],
      ),
      {
        id: "s6-v2",
        name: "双端里程碑版",
        sellingPoints: "Web + 小程序 · 分阶段验收 · 里程碑付款",
        highlights: ["Web + 小程序双端", "分阶段验收", "里程碑付款", "设计规范交付"],
        price: 16000,
        unit: "项",
        startAfterPayDays: 2,
        startDayType: "工作日",
        fulfillmentType: "installment_pay_installment_accept",
        deliveryCycleDays: 45,
        deliveryStandard: "按阶段交付原型、视觉与切图，并完成阶段验收。",
        phases: [
          {
            id: "s6-v2-p1",
            name: "需求与原型",
            settleRatio: 30,
            deliveryCycleDays: 10,
            deliveryStandard: "交互原型与信息架构确认。",
          },
          {
            id: "s6-v2-p2",
            name: "视觉设计",
            settleRatio: 40,
            deliveryCycleDays: 20,
            deliveryStandard: "全量视觉稿与设计规范。",
          },
          {
            id: "s6-v2-p3",
            name: "切图交付",
            settleRatio: 30,
            deliveryCycleDays: 15,
            deliveryStandard: "切图、标注与走查修改一轮。",
          },
        ],
      },
    ],
    detailContent:
      "【服务内容】\n1. 需求访谈与信息架构\n2. 交互原型（可点击）\n3. 视觉设计与组件规范\n4. 切图与标注交付\n\n【协作方式】\n线上评审 + 飞书/钉钉沟通，关键节点当面或视频确认。",
    detailGuarantee: "工作日 4 小时内响应；每阶段含 1 轮集中修改；延期风险提前 3 天预警。",
    relatedCases: [
      {
        id: "case-s6-1",
        categoryPath: "品牌与设计 / 数字产品设计 / UI 界面设计",
        title: "园区集采管理后台改版",
        intro: "统一组件库，缩短研发联调周期约 30%。",
        coverUrl: serviceAsset("s6", "-d1"),
      },
      {
        id: "case-s6-2",
        categoryPath: "品牌与设计 / 数字产品设计 / UI 界面设计",
        title: "企业服务小程序视觉升级",
        intro: "完成首页改版与下单流程优化，转化率提升。",
        coverUrl: serviceAsset("s5", "-d2"),
      },
    ],
    faqs: [
      { id: "s6-f1", question: "是否含前端开发？", answer: "默认不含开发，可另询联合交付。" },
      { id: "s6-f2", question: "分期如何付款？", answer: "双端里程碑版按阶段比例支付并验收，比例合计 100%。" },
    ],
  },
  s7: {
    categoryL1: "软件与信息化",
    categoryL2: "系统集成",
    categoryL3: "ERP 对接",
    intro: "订单 / 库存 / 对账数据互通开发，按里程碑交付。",
    serviceAreaLabel: "华东 · 华南 · 西南重点园区",
    salesCount: 28,
    rating: 4.7,
    versions: [
      {
        id: "s7-v1",
        name: "标准对接版",
        sellingPoints: "需求调研 · 接口开发 · 联调上线",
        highlights: ["需求调研", "接口开发", "联调上线", "文档移交"],
        price: 80000,
        unit: "项",
        startAfterPayDays: 3,
        startDayType: "工作日",
        fulfillmentType: "installment_pay_installment_accept",
        deliveryCycleDays: 56,
        deliveryStandard: "完成主数据与订单链路打通，提供联调报告。",
        phases: [
          {
            id: "s7-v1-p1",
            name: "调研与方案",
            settleRatio: 30,
            deliveryCycleDays: 14,
            deliveryStandard: "接口清单与实施方案确认。",
          },
          {
            id: "s7-v1-p2",
            name: "开发与联调",
            settleRatio: 50,
            deliveryCycleDays: 28,
            deliveryStandard: "接口开发完成并通过联调用例。",
          },
          {
            id: "s7-v1-p3",
            name: "上线与移交",
            settleRatio: 20,
            deliveryCycleDays: 14,
            deliveryStandard: "生产验证、文档移交与培训。",
          },
        ],
      },
      onceVersion(
        "s7-v2",
        "加急陪跑版",
        120000,
        "项",
        42,
        "含驻场/远程陪跑一周，优先排期联调。",
        "优先排期 · 上线陪跑一周",
        ["优先排期", "接口开发", "联调上线", "陪跑一周"],
      ),
    ],
    relatedCases: [
      {
        id: "case-s7-1",
        categoryPath: "软件与信息化 / 系统集成 / ERP 对接",
        title: "制造企业 ERP ↔ 园区集采打通",
        intro: "订单与对账自动化，月结时效缩短 2 天。",
        coverUrl: serviceAsset("s7", "-d1"),
      },
    ],
  },
};

const catalog: PublishedService[] = enterpriseServices.map((base) => {
  const synthesized = synthesize(base);
  const override = richOverrides[base.id];
  if (!override) return synthesized;
  return {
    ...synthesized,
    ...override,
    versions: override.versions ?? synthesized.versions,
    relatedCases: override.relatedCases ?? synthesized.relatedCases,
    faqs: override.faqs ?? synthesized.faqs,
    media: override.media ?? synthesized.media,
    detailImages: override.detailImages ?? synthesized.detailImages,
    shop: override.shop ?? synthesized.shop,
    reviews: override.reviews ?? synthesized.reviews,
  };
});

function listPriceLabel(p: PublishedService): string {
  if (!p.versions.length) return "—";
  const prices = p.versions.map((v) => v.price);
  const min = Math.min(...prices);
  const unit = minVersionPrice(p)?.unit ?? "项";
  const formatted = min.toLocaleString("zh-CN");
  if (prices.some((x) => x !== min)) return `${formatted} 起`;
  return `${formatted} / ${unit}`;
}

/** 以 Published 为真相源，回写列表字段，避免大厅与详情不一致 */
function hydrateEnterpriseFromPublished() {
  const byBaseId = Object.fromEntries(enterpriseServices.map((s) => [s.id, s]));
  for (const p of catalog) {
    const base = byBaseId[p.id];
    if (!base) continue;
    const lead = minVersionPrice(p);
    base.category = p.categoryL1;
    base.categoryL2 = p.categoryL2;
    base.categoryL3 = p.categoryL3;
    base.provider = p.shop.name;
    base.salesCount = p.salesCount;
    base.rating = p.rating;
    base.image = p.coverUrl || base.image;
    if (lead) {
      base.priceMin = lead.price;
      base.price = listPriceLabel(p);
    }
  }
}

hydrateEnterpriseFromPublished();

const byId = Object.fromEntries(catalog.map((s) => [s.id, s])) as Record<string, PublishedService>;

export function getPublishedService(id: string): PublishedService | undefined {
  return byId[id];
}

export function listPublishedServices(): PublishedService[] {
  return catalog;
}

/** 同店评价：本服务 + 本店其他服务评价 */
export function getServiceReviewGroups(service: PublishedService) {
  const serviceReviews = service.reviews.filter((r) => r.scope === "service");
  const shopReviews = [
    ...service.reviews.filter((r) => r.scope === "shop"),
    ...catalog
      .filter((s) => s.shop.id === service.shop.id && s.id !== service.id)
      .flatMap((s) =>
        s.reviews
          .filter((r) => r.scope === "service")
          .slice(0, 1)
          .map((r) => ({ ...r, scope: "shop" as const, serviceName: s.name })),
      ),
  ];
  return { serviceReviews, shopReviews };
}
