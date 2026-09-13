import type { LatLngExpression } from "leaflet";
import { parkName } from "../data";

export type MapViewMode = "panorama" | "enterprise" | "heatmap" | "chain" | "zone";

export type GeoScope = "park" | "city" | "province" | "national";

export type EnterpriseRole = "demand" | "supply" | "both" | "park";

export type MapEnterprise = {
  id: string;
  name: string;
  role: EnterpriseRole;
  lat: number;
  lng: number;
  industryL1: string;
  industryL2: string;
  chainSegment: string;
  tags: string[];
  zoneId: string;
  employees: string;
  revenue: string;
  intro: string;
  demandSummary?: string;
  supplySummary?: string;
  upstream: string[];
  downstream: string[];
  matchScore?: number;
  /** 地理归属：园区 / 全市 / 全省 / 全国样本 */
  scope: GeoScope;
};

export type IndustryZone = {
  id: string;
  name: string;
  color: string;
  industry: string;
  enterpriseCount: number;
  boundary: LatLngExpression[];
  scope: GeoScope;
  regionLabel: string;
};

export type ChainLink = {
  from: string;
  to: string;
  relation: "供应" | "采购" | "协作" | "配套";
};

export type ClusterRank = {
  id: string;
  name: string;
  count: number;
  growth: string;
  share: number;
};

export type MapMatch = {
  id: string;
  fromId: string;
  toId: string;
  reason: string;
  score: number;
};

export type ParkPanoramaSpot = {
  id: string;
  title: string;
  desc: string;
  yaw: number;
  pitch: number;
  /** 点位实景图（相对 public） */
  image: string;
};

export type ChainMindNode = {
  id: string;
  label: string;
  kind: "root" | "upstream" | "mid" | "downstream";
  enterpriseIds: string[];
  children?: ChainMindNode[];
};

export const geoScopeOptions: { id: GeoScope; label: string; zoom: number; center: [number, number] }[] = [
  { id: "park", label: "本园区", zoom: 13, center: [30.8892, 121.9265] },
  { id: "city", label: "全市", zoom: 10, center: [31.23, 121.47] },
  { id: "province", label: "全省", zoom: 7.2, center: [31.2, 120.0] },
  { id: "national", label: "全国", zoom: 4.5, center: [35.0, 105.0] },
];

export const parkPanoramaImage = "/panorama/park-360.jpg";

export const parkPanoramaSpots: ParkPanoramaSpot[] = [
  {
    id: "gate",
    title: "园区正门",
    desc: "访客中心 · 安检通道",
    yaw: 12,
    pitch: -6,
    image: "/panorama/gate.jpg",
  },
  {
    id: "equip",
    title: "智造展厅",
    desc: "高端装备样板产线",
    yaw: 78,
    pitch: -2,
    image: "/panorama/equip.jpg",
  },
  {
    id: "plaza",
    title: "中央广场",
    desc: "路演与产业活动",
    yaw: 148,
    pitch: 0,
    image: "/panorama/plaza.jpg",
  },
  {
    id: "lab",
    title: "创新实验室",
    desc: "工业软件 / AI 联调",
    yaw: 212,
    pitch: -4,
    image: "/panorama/lab.jpg",
  },
  {
    id: "dock",
    title: "配套码头",
    desc: "海工与物流通道",
    yaw: 286,
    pitch: -8,
    image: "/panorama/dock.jpg",
  },
];

export const chainMindTree: ChainMindNode = {
  id: "root-equip",
  label: "智能制造装备产业链",
  kind: "root",
  enterpriseIds: [],
  children: [
    {
      id: "up-parts",
      label: "上游 · 核心零部件",
      kind: "upstream",
      enterpriseIds: ["e5", "e12"],
      children: [
        { id: "up-servo", label: "伺服 / 控制", kind: "upstream", enterpriseIds: ["e5"] },
        { id: "up-robot", label: "机器人本体", kind: "upstream", enterpriseIds: ["e12"] },
      ],
    },
    {
      id: "mid-asm",
      label: "中游 · 整机制造",
      kind: "mid",
      enterpriseIds: ["e1", "e3"],
      children: [
        { id: "mid-precision", label: "精密制造", kind: "mid", enterpriseIds: ["e1"] },
        { id: "mid-smart", label: "智造装备", kind: "mid", enterpriseIds: ["e3"] },
      ],
    },
    {
      id: "down-app",
      label: "下游 · 应用与配套",
      kind: "downstream",
      enterpriseIds: ["e2", "e6", "e9", "e8"],
      children: [
        { id: "down-marine", label: "海工装备", kind: "downstream", enterpriseIds: ["e2"] },
        { id: "down-soft", label: "工业软件", kind: "downstream", enterpriseIds: ["e6", "e11"] },
        { id: "down-test", label: "检测认证", kind: "downstream", enterpriseIds: ["e9"] },
        { id: "down-log", label: "仓配物流", kind: "downstream", enterpriseIds: ["e8"] },
      ],
    },
  ],
};

export const parkBoundary: LatLngExpression[] = [
  [30.912, 121.905],
  [30.914, 121.948],
  [30.878, 121.955],
  [30.865, 121.920],
  [30.875, 121.898],
];

export const industryZones: IndustryZone[] = [
  {
    id: "z-equip",
    name: "高端装备智造区",
    color: "#0d4ea3",
    industry: "智能制造装备",
    enterpriseCount: 86,
    scope: "park",
    regionLabel: "临港新片区",
    boundary: [
      [30.905, 121.908],
      [30.908, 121.942],
      [30.888, 121.945],
      [30.882, 121.915],
    ],
  },
  {
    id: "z-material",
    name: "新材料产业区",
    color: "#7c6a3b",
    industry: "先进基础材料",
    enterpriseCount: 52,
    scope: "park",
    regionLabel: "临港新片区",
    boundary: [
      [30.888, 121.915],
      [30.892, 121.948],
      [30.872, 121.950],
      [30.868, 121.922],
    ],
  },
  {
    id: "z-digital",
    name: "数字经济创新区",
    color: "#0f7a4a",
    industry: "工业软件 / AI",
    enterpriseCount: 48,
    scope: "park",
    regionLabel: "临港新片区",
    boundary: [
      [30.898, 121.918],
      [30.902, 121.938],
      [30.912, 121.935],
      [30.908, 121.912],
    ],
  },
  {
    id: "z-service",
    name: "产服配套区",
    color: "#5b4a9a",
    industry: "企服 / 物流",
    enterpriseCount: 34,
    scope: "park",
    regionLabel: "临港新片区",
    boundary: [
      [30.872, 121.922],
      [30.878, 121.948],
      [30.862, 121.940],
      [30.860, 121.910],
    ],
  },
  { id: "z-city-pd", name: "浦东智能装备带", color: "#2563eb", industry: "智能制造", enterpriseCount: 210, scope: "city", regionLabel: "上海市 · 浦东", boundary: [[31.24,121.50],[31.24,121.58],[31.18,121.58],[31.18,121.50]] },
  { id: "z-city-jd", name: "嘉定汽车电子廊", color: "#0891b2", industry: "汽车电子", enterpriseCount: 160, scope: "city", regionLabel: "上海市 · 嘉定", boundary: [[31.39,121.18],[31.39,121.28],[31.33,121.28],[31.33,121.18]] },
  { id: "z-city-mh", name: "闵行新材料港", color: "#ca8a04", industry: "新材料", enterpriseCount: 120, scope: "city", regionLabel: "上海市 · 闵行", boundary: [[31.14,121.34],[31.14,121.42],[31.08,121.42],[31.08,121.34]] },
  { id: "z-prov-sz", name: "苏南机器人集群", color: "#4f46e5", industry: "工业机器人", enterpriseCount: 380, scope: "province", regionLabel: "江苏省 · 苏州", boundary: [[31.38,120.65],[31.38,120.82],[31.26,120.82],[31.26,120.65]] },
  { id: "z-prov-wx", name: "苏南物联网走廊", color: "#059669", industry: "物联网", enterpriseCount: 290, scope: "province", regionLabel: "江苏省 · 无锡", boundary: [[31.60,120.24],[31.60,120.40],[31.48,120.40],[31.48,120.24]] },
  { id: "z-prov-nj", name: "宁镇扬海工带", color: "#db2777", industry: "海工装备", enterpriseCount: 150, scope: "province", regionLabel: "江苏省 · 南京", boundary: [[32.12,118.68],[32.12,118.90],[31.98,118.90],[31.98,118.68]] },
  { id: "z-nat-sz", name: "珠三角工业软件带", color: "#7c3aed", industry: "工业软件", enterpriseCount: 920, scope: "national", regionLabel: "广东 · 深圳", boundary: [[22.62,113.92],[22.62,114.22],[22.42,114.22],[22.42,113.92]] },
  { id: "z-nat-cd", name: "成渝精密制造圈", color: "#ea580c", industry: "精密制造", enterpriseCount: 540, scope: "national", regionLabel: "四川 · 成都", boundary: [[30.78,103.92],[30.78,104.22],[30.55,104.22],[30.55,103.92]] },
  { id: "z-nat-xa", name: "关中航空材料带", color: "#0d9488", industry: "航空材料", enterpriseCount: 310, scope: "national", regionLabel: "陕西 · 西安", boundary: [[34.38,108.82],[34.38,109.12],[34.16,109.12],[34.16,108.82]] },
];

export const mapEnterprises: MapEnterprise[] = [
  {
    id: "park",
    name: parkName,
    role: "park",
    lat: 30.8892,
    lng: 121.9265,
    industryL1: "园区",
    industryL2: "产业大脑",
    chainSegment: "综合",
    tags: ["产业大脑"],
    zoneId: "z-equip",
    employees: "—",
    revenue: "—",
    intro: "286 家入驻企业 · 4 大产业片区 · 集采 / 金融 / 企服一站式",
    upstream: [],
    downstream: [],
    scope: "park",
  },
  {
    id: "e1",
    name: "临港精密制造",
    role: "demand",
    lat: 30.8968,
    lng: 121.9124,
    industryL1: "高端装备",
    industryL2: "智能制造装备",
    chainSegment: "整机制造",
    tags: ["专精特新", "规上企业"],
    zoneId: "z-equip",
    employees: "320 人",
    revenue: "2.8 亿 / 年",
    intro: "精密零部件与伺服系统总成",
    demandSummary: "伺服电机、工业润滑油 · 月采 120 万",
    upstream: ["汇川智控临港仓", "临港新材料"],
    downstream: ["海工装备股份"],
    matchScore: 92,
    scope: "park",
  },
  {
    id: "e2",
    name: "海工装备股份",
    role: "both",
    lat: 30.8785,
    lng: 121.9188,
    industryL1: "高端装备",
    industryL2: "海工装备",
    chainSegment: "海洋工程",
    tags: ["龙头", "出口型"],
    zoneId: "z-equip",
    employees: "860 人",
    revenue: "12 亿 / 年",
    intro: "海洋工程装备总装与配套",
    demandSummary: "防护用品、认证检测",
    supplySummary: "海工模块、特种钢构",
    upstream: ["临港新材料", "临港精密制造"],
    downstream: [],
    matchScore: 88,
    scope: "park",
  },
  {
    id: "e3",
    name: "智造装备科技",
    role: "demand",
    lat: 30.9012,
    lng: 121.9386,
    industryL1: "高端装备",
    industryL2: "智能制造装备",
    chainSegment: "系统集成",
    tags: ["高新技术"],
    zoneId: "z-equip",
    employees: "180 人",
    revenue: "1.2 亿 / 年",
    intro: "产线自动化集成与 MES 实施",
    demandSummary: "ERP 对接、工业软件",
    upstream: ["云智工业软件"],
    downstream: [],
    matchScore: 85,
    scope: "park",
  },
  {
    id: "e4",
    name: "临港新材料",
    role: "supply",
    lat: 30.8836,
    lng: 121.9412,
    industryL1: "新材料",
    industryL2: "先进基础材料",
    chainSegment: "材料加工",
    tags: ["专精特新"],
    zoneId: "z-material",
    employees: "240 人",
    revenue: "3.5 亿 / 年",
    intro: "特种合金板材、工业涂料",
    supplySummary: "合金板 · 工业涂料 · 库存充足",
    upstream: [],
    downstream: ["临港精密制造", "海工装备股份"],
    matchScore: 90,
    scope: "park",
  },
  {
    id: "e5",
    name: "汇川智控临港仓",
    role: "supply",
    lat: 30.9074,
    lng: 121.9215,
    industryL1: "高端装备",
    industryL2: "智能控制",
    chainSegment: "核心零部件",
    tags: ["协议供应商"],
    zoneId: "z-equip",
    employees: "45 人",
    revenue: "8,600 万 / 年",
    intro: "伺服电机、变频器园区协议直供",
    supplySummary: "伺服 · 变频器 · 48h 交付",
    upstream: [],
    downstream: ["临港精密制造", "智造装备科技"],
    matchScore: 94,
    scope: "park",
  },
  {
    id: "e6",
    name: "云智工业软件",
    role: "supply",
    lat: 30.8998,
    lng: 121.9312,
    industryL1: "数字经济",
    industryL2: "工业软件",
    chainSegment: "软件服务",
    tags: ["软件企业"],
    zoneId: "z-digital",
    employees: "120 人",
    revenue: "6,200 万 / 年",
    intro: "MES / ERP 对接与工业 APP 开发",
    supplySummary: "ERP 集成 · MES · 数据采集",
    upstream: [],
    downstream: ["智造装备科技", "临港精密制造"],
    matchScore: 87,
    scope: "park",
  },
  {
    id: "e7",
    name: "正衡工业服务",
    role: "supply",
    lat: 30.8728,
    lng: 121.9338,
    industryL1: "产服配套",
    industryL2: "企业服务",
    chainSegment: "企服",
    tags: ["园区服务商"],
    zoneId: "z-service",
    employees: "68 人",
    revenue: "2,100 万 / 年",
    intro: "工商财税、法律顾问、知识产权",
    supplySummary: "财税 · 法律 · 知产代办",
    upstream: [],
    downstream: [],
    matchScore: 76,
    scope: "park",
  },
  {
    id: "e8",
    name: "港联智慧物流",
    role: "both",
    lat: 30.8665,
    lng: 121.9155,
    industryL1: "产服配套",
    industryL2: "智慧物流",
    chainSegment: "物流仓储",
    tags: ["5A 物流"],
    zoneId: "z-service",
    employees: "210 人",
    revenue: "1.8 亿 / 年",
    intro: "园区仓储、干线配送与供应链协同",
    demandSummary: "包装耗材集采",
    supplySummary: "仓配一体 · 跨境物流",
    upstream: [],
    downstream: ["临港精密制造", "临港新材料"],
    matchScore: 82,
    scope: "park",
  },
  {
    id: "e9",
    name: "芯测检测认证",
    role: "supply",
    lat: 30.8755,
    lng: 121.9288,
    industryL1: "高端装备",
    industryL2: "检验检测",
    chainSegment: "检测认证",
    tags: ["CNAS"],
    zoneId: "z-service",
    employees: "95 人",
    revenue: "4,500 万 / 年",
    intro: "产品检测、体系认证与出海合规",
    supplySummary: "第三方检测 · CE / UL",
    upstream: [],
    downstream: ["海工装备股份", "智造装备科技"],
    matchScore: 79,
    scope: "park",
  },
  {
    id: "e10",
    name: "绿能光伏材料",
    role: "supply",
    lat: 30.8698,
    lng: 121.9395,
    industryL1: "新材料",
    industryL2: "新能源材料",
    chainSegment: "光伏材料",
    tags: ["绿色制造"],
    zoneId: "z-material",
    employees: "310 人",
    revenue: "5.2 亿 / 年",
    intro: "光伏封装胶膜、背板材料",
    supplySummary: "光伏胶膜 · 背板 · 出口",
    upstream: [],
    downstream: [],
    matchScore: 71,
    scope: "park",
  },
  {
    id: "e11",
    name: "灵犀 AI 应用",
    role: "supply",
    lat: 30.9045,
    lng: 121.9278,
    industryL1: "数字经济",
    industryL2: "人工智能",
    chainSegment: "AI 应用",
    tags: ["AI 企业"],
    zoneId: "z-digital",
    employees: "55 人",
    revenue: "3,800 万 / 年",
    intro: "工业视觉质检、预测性维护 AI",
    supplySummary: "视觉检测 · 设备预测维护",
    upstream: [],
    downstream: ["临港精密制造"],
    matchScore: 83,
    scope: "park",
  },
  {
    id: "e12",
    name: "博创机器人",
    role: "both",
    lat: 30.8915,
    lng: 121.9055,
    industryL1: "高端装备",
    industryL2: "工业机器人",
    chainSegment: "机器人本体",
    tags: ["专精特新小巨人"],
    zoneId: "z-equip",
    employees: "420 人",
    revenue: "4.1 亿 / 年",
    intro: "六轴工业机器人研发制造",
    demandSummary: "减速器、伺服电机",
    supplySummary: "工业机器人 · 集成方案",
    upstream: ["汇川智控临港仓"],
    downstream: ["智造装备科技"],
    matchScore: 91,
    scope: "park",
  },
  // city
  { id: "c1", name: "浦东智能装备", role: "demand", lat: 31.221, lng: 121.544, industryL1: "高端装备", industryL2: "智能制造装备", chainSegment: "整机制造", tags: ["市级"], zoneId: "z-city-pd", employees: "500 人", revenue: "6 亿", intro: "浦东新区智能装备集聚", demandSummary: "减速器 · 伺服", upstream: [], downstream: [], matchScore: 80, scope: "city" },
  { id: "c2", name: "嘉定汽车电子", role: "supply", lat: 31.365, lng: 121.226, industryL1: "高端装备", industryL2: "汽车电子", chainSegment: "核心零部件", tags: ["市级"], zoneId: "z-city-jd", employees: "380 人", revenue: "4.2 亿", intro: "汽车电子与传感器", supplySummary: "车规芯片模组", upstream: [], downstream: [], matchScore: 78, scope: "city" },
  { id: "c3", name: "闵行新材料港", role: "both", lat: 31.112, lng: 121.381, industryL1: "新材料", industryL2: "先进基础材料", chainSegment: "材料加工", tags: ["市级"], zoneId: "z-city-mh", employees: "260 人", revenue: "3.1 亿", intro: "新材料研发与中试", demandSummary: "特种气体", supplySummary: "复合材料", upstream: [], downstream: [], matchScore: 75, scope: "city" },
  // province
  { id: "p1", name: "苏州工业园机器人", role: "supply", lat: 31.324, lng: 120.728, industryL1: "高端装备", industryL2: "工业机器人", chainSegment: "机器人本体", tags: ["省级"], zoneId: "z-prov-sz", employees: "900 人", revenue: "18 亿", intro: "江苏省机器人龙头", supplySummary: "六轴机器人", upstream: [], downstream: [], matchScore: 86, scope: "province" },
  { id: "p2", name: "无锡物联网传感", role: "supply", lat: 31.549, lng: 120.312, industryL1: "数字经济", industryL2: "物联网", chainSegment: "软件服务", tags: ["省级"], zoneId: "z-prov-wx", employees: "420 人", revenue: "5.6 亿", intro: "传感与工业物联网", supplySummary: "传感网关", upstream: [], downstream: [], matchScore: 81, scope: "province" },
  { id: "p3", name: "南京海工配套", role: "demand", lat: 32.06, lng: 118.78, industryL1: "高端装备", industryL2: "海工装备", chainSegment: "海洋工程", tags: ["省级"], zoneId: "z-prov-nj", employees: "1100 人", revenue: "22 亿", intro: "长江沿线海工配套", demandSummary: "特种钢构", upstream: [], downstream: [], matchScore: 77, scope: "province" },
  // national
  { id: "n1", name: "深圳工业软件谷", role: "supply", lat: 22.54, lng: 114.06, industryL1: "数字经济", industryL2: "工业软件", chainSegment: "软件服务", tags: ["全国"], zoneId: "z-nat-sz", employees: "2000 人", revenue: "40 亿", intro: "粤港澳工业软件集群", supplySummary: "CAD / MES", upstream: [], downstream: [], matchScore: 88, scope: "national" },
  { id: "n2", name: "成都精密制造", role: "both", lat: 30.67, lng: 104.06, industryL1: "高端装备", industryL2: "智能制造装备", chainSegment: "整机制造", tags: ["全国"], zoneId: "z-nat-cd", employees: "760 人", revenue: "9 亿", intro: "西部精密制造基地", demandSummary: "刀具夹具", supplySummary: "精密机床", upstream: [], downstream: [], matchScore: 74, scope: "national" },
  { id: "n3", name: "西安航空材料", role: "supply", lat: 34.27, lng: 108.95, industryL1: "新材料", industryL2: "航空材料", chainSegment: "材料加工", tags: ["全国"], zoneId: "z-nat-xa", employees: "1500 人", revenue: "28 亿", intro: "航空新材料国家节点", supplySummary: "钛合金 · 复合材料", upstream: [], downstream: [], matchScore: 83, scope: "national" },
];

export const chainLinks: ChainLink[] = [
  { from: "e5", to: "e1", relation: "供应" },
  { from: "e5", to: "e12", relation: "供应" },
  { from: "e4", to: "e1", relation: "供应" },
  { from: "e4", to: "e2", relation: "供应" },
  { from: "e1", to: "e2", relation: "配套" },
  { from: "e6", to: "e3", relation: "供应" },
  { from: "e6", to: "e1", relation: "协作" },
  { from: "e11", to: "e1", relation: "供应" },
  { from: "e9", to: "e2", relation: "协作" },
  { from: "e8", to: "e1", relation: "协作" },
  { from: "e8", to: "e4", relation: "协作" },
  { from: "e12", to: "e3", relation: "供应" },
  { from: "e5", to: "e12", relation: "供应" },
];

export const clusterRanks: ClusterRank[] = [
  { id: "c1", name: "智能制造装备", count: 86, growth: "+12%", share: 30 },
  { id: "c2", name: "先进基础材料", count: 52, growth: "+8%", share: 18 },
  { id: "c3", name: "工业软件 / AI", count: 48, growth: "+22%", share: 17 },
  { id: "c4", name: "海工装备", count: 31, growth: "+5%", share: 11 },
  { id: "c5", name: "检验检测认证", count: 24, growth: "+15%", share: 8 },
];

export const mapKpis = [
  { label: "入驻企业", value: "286", hint: "规上 128 家" },
  { label: "产业片区", value: "4", hint: "覆盖 3 大主导产业" },
  { label: "链上关系", value: "156", hint: "供应 / 采购 / 协作" },
  { label: "本月撮合", value: "47", hint: "供需对接成功" },
];

export const mapMatches: MapMatch[] = [
  {
    id: "m1",
    fromId: "e1",
    toId: "e5",
    reason: "伺服电机协议直供 · 距离 1.2km · 历史 6 次合作",
    score: 94,
  },
  {
    id: "m2",
    fromId: "e3",
    toId: "e6",
    reason: "ERP 集成经验匹配 · 同行业 3 个案例",
    score: 87,
  },
  {
    id: "m3",
    fromId: "e2",
    toId: "e9",
    reason: "海工装备检测认证需求 · CNAS 资质",
    score: 85,
  },
];

export const industryL1Filters = [
  "全部产业",
  "高端装备",
  "新材料",
  "数字经济",
  "产服配套",
];

export const chainSegmentFilters = [
  "全部环节",
  "整机制造",
  "核心零部件",
  "材料加工",
  "工业软件",
  "检测认证",
  "物流仓储",
];

export function getEnterpriseById(id: string) {
  return mapEnterprises.find((e) => e.id === id);
}

export function getZoneById(id: string) {
  return industryZones.find((z) => z.id === id);
}

const scopeRank: Record<GeoScope, number> = { park: 0, city: 1, province: 2, national: 3 };

export function enterprisesInScope(scope: GeoScope) {
  return mapEnterprises.filter((e) => scopeRank[e.scope] <= scopeRank[scope]);
}

export function zonesInScope(scope: GeoScope) {
  return industryZones.filter((z) => scopeRank[z.scope] <= scopeRank[scope]);
}
