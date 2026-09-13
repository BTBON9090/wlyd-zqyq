import { z } from "zod";
import { asset, site } from "../../lib/config";

const bannerSchema = z.object({
  id: z.string(),
  label: z.string(),
  title: z.string(),
  emphasis: z.string(),
  description: z.string(),
  image: z.string().default(""),
  mobileImage: z.string().default(""),
  imageOnly: z.boolean().default(false),
  actionLabel: z.string(),
  target: z.enum(["services", "onboarding", "capabilities"]),
});
export const homeContentSchema = z.object({
  banners: z.array(bannerSchema).min(1).max(6),
  capabilityImages: z.record(z.string(), z.string()).default({}),
  campaignImage: z.string().default(""),
  businessImages: z.record(z.string(), z.string()).default({}),
  productImages: z.record(z.string(), z.string()).default({}),
  serviceBannerImage: z.string().default(""),
  authImage: z.string().default(""),
  resourceImages: z.record(z.string(), z.string()).default({}),
  partnerImages: z.record(z.string(), z.string()).default({}),
});
export type HomeContent = z.infer<typeof homeContentSchema>;
export const defaultHomeContent: HomeContent = {
  banners: [
    {
      id: "platform",
      label: "政企协同 · 产业互联",
      title: "汇聚产业好资源",
      emphasis: "成就企业好生意",
      description: "连接园区、企业与专业服务商，让服务、商机与成长在这里相遇。",
      image: site.hero,
      mobileImage: "",
      imageOnly: false,
      actionLabel: "发现平台服务",
      target: "capabilities",
    },
    {
      id: "services",
      label: "企业服务 · 专业同行",
      title: "经营中的每个需求",
      emphasis: "都有专业力量回应",
      description:
        "工商财税、知识产权、品牌设计与数字化服务，按需寻找合适的合作伙伴。",
      image: "",
      mobileImage: "",
      imageOnly: false,
      actionLabel: "进入企业服务",
      target: "services",
    },
    {
      id: "park",
      label: "园区共建 · 企业共生",
      title: "从一家企业",
      emphasis: "到一个产业生态",
      description: "聚合产业信息与上下游资源，拓展企业之间的连接与合作。",
      image: "",
      mobileImage: "",
      imageOnly: false,
      actionLabel: "办理企业入驻",
      target: "onboarding",
    },
  ],
  businessImages: {},
  productImages: {},
  serviceBannerImage: "",
  authImage: "",
  capabilityImages: {},
  campaignImage: "",
  resourceImages: {},
  partnerImages: {},
};

export async function loadHomeContent(
  signal: AbortSignal,
): Promise<HomeContent> {
  const url =
    import.meta.env.VITE_HOMEPAGE_CONTENT_URL || asset("content/homepage.json");
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
  });
  if (!response.ok) throw new Error("首页内容加载失败");
  return homeContentSchema.parse(await response.json());
}

export const capabilities = [
  {
    id: "services",
    title: "企业服务",
    brand: "万大圣",
    subtitle: "把专业的事，交给专业的人",
    description: "从企业开办到经营发展，寻找适合自己的服务与合作伙伴。",
    tags: ["工商财税", "知识产权", "品牌设计", "软件开发"],
    features: [
      ["按需选服务", "查看服务介绍、商家资料与参考价格。"],
      ["沟通更清楚", "了解服务范围与交付要求，再确认合作方案。"],
    ],
  },
  {
    id: "logistics",
    title: "智慧物流",
    brand: "万连通",
    subtitle: "连接货物与运力，让流通更顺畅",
    description: "围绕企业发运与运输协同，衔接货主、运力和物流服务资源。",
    tags: ["货源匹配", "运力协同", "运输管理", "费用结算"],
    features: [
      ["运输资源连接", "围绕发货路线与运输需求匹配运力。"],
      ["业务协同", "承接运输执行、进度跟踪与结算管理。"],
    ],
  },
  {
    id: "ai",
    title: "AI 赋能",
    brand: "AI 智能体",
    subtitle: "让智能能力，走进真实业务场景",
    description: "面向企业办公与经营场景，探索智能体、大模型应用与定制化方案。",
    tags: ["智能办公", "知识管理", "业务智能体", "模型定制"],
    features: [
      ["从场景出发", "识别企业高频、重复的业务工作。"],
      ["衔接现有系统", "围绕数据与流程规划适合的应用方案。"],
    ],
  },
  {
    id: "finance",
    title: "数智金融",
    brand: "科创助贷",
    subtitle: "连接金融资源，支持企业经营",
    description:
      "汇集企业融资与供应链金融相关信息，帮助企业了解适用产品和申请条件。",
    tags: ["产品信息", "融资需求", "供应链金融", "机构对接"],
    features: [
      ["了解准入条件", "先了解产品适用对象与所需资料。"],
      ["对接金融机构", "具体额度和结果以金融机构审核为准。"],
    ],
  },
  {
    id: "trade",
    title: "商品交易",
    brand: "大宗物资",
    subtitle: "汇聚供需，让采购更有选择",
    description:
      "连接产业链上下游采购与供应信息，服务企业大宗物资与经营采购需求。",
    tags: ["大宗物资", "集中采购", "供需撮合", "行情信息"],
    features: [
      ["找货与找商家", "从品类和规格出发发现供应资源。"],
      ["采购协同", "围绕询价、方案确认和履约建立连接。"],
    ],
  },
  {
    id: "news",
    title: "产业资讯",
    brand: "产业政策",
    subtitle: "读懂产业变化，把握发展机会",
    description: "关注园区政策、行业动态与产业信息，为企业经营提供信息参考。",
    tags: ["政策解读", "行业动态", "园区资讯", "产业观察"],
    features: [
      ["政策信息", "按产业与企业关注点组织政策内容。"],
      ["行业观察", "聚合与产业链和企业经营相关的信息。"],
    ],
  },
];
export const resourceViews = [
  {
    id: "enterprise",
    title: "企业地图",
    headline: "发现身边的企业与合作伙伴",
    description: "从区域、行业与企业信息出发，了解园区企业分布。",
    points: ["企业分布与基本信息", "所属行业与经营方向", "园区位置与资源连接"],
  },
  {
    id: "industry",
    title: "产业地图",
    headline: "看清产业链，找到连接点",
    description: "围绕产业集群与上下游关系，呈现园区的产业布局。",
    points: ["重点产业与企业集群", "产业链上下游关系", "区域产业资源概览"],
  },
  {
    id: "supply",
    title: "供需地图",
    headline: "让优势资源与真实需求相遇",
    description: "汇集企业供给、采购及合作意向，发现产业协同的机会。",
    points: ["企业优势供给", "采购与合作需求", "产业合作机会"],
  },
];
