import { demandsCatalogSummary } from "./data/demands";
import { financeCatalogSummary } from "./data/financeProducts";
import { servicesCatalogSummary } from "./data/enterpriseServices";
import { newsCatalogSummary } from "./data/industryNews";

export type BannerSlide = {
  id: string;
  kicker: string;
  title: string;
  desc: string;
  cta: string;
  to: string;
  tone: string;
};

export type Product = {
  id: string;
  name: string;
  spec: string;
  price: string;
  unit: string;
  supplier: string;
  tag: string;
  mark: string;
  tone: string;
  categoryId?: string;
  /** 商品主图，相对 public 路径，如 /products/p1-servo.jpg */
  image?: string;
};

export type ServiceItem = {
  id: string;
  category: string;
  name: string;
  desc: string;
  price: string;
  provider: string;
  /** 服务封面图，相对 public 路径 */
  image?: string;
};

export type FinanceItem = {
  id: string;
  type: string;
  name: string;
  highlight: string;
  meta: string;
  mode: string;
};

export type DemandItem = {
  id: string;
  title: string;
  budget: string;
  quotes: number;
  company: string;
  category: string;
};

export type NewsItem = {
  id: string;
  type: string;
  title: string;
  time: string;
  urgent?: boolean;
};

export type TodoItem = {
  id: string;
  type: "order" | "pay" | "finance" | "policy" | "audit";
  title: string;
  extra: string;
  to: string;
};

export const parkName = "xx经开区";
export const platformName = "xx经开区企业一站式服务平台";
export const platformSupport = "万联易达集团 提供技术支持";
export const companyName = "临港精密制造有限公司";
export const userName = "丁野";

export const banners: BannerSlide[] = [
  {
    id: "b1",
    kicker: "集采商城 · 园区协议价",
    title: "核心物料直降 15%",
    desc: "安防清洁 · 工具消防 · 询价比价 · 购物车结算 · 对公履约",
    cta: "进入集采商城",
    to: "/procurement",
    tone: "proc",
  },
  {
    id: "b2",
    kicker: "金融服务 · 五大产品线",
    title: "园区贷 · 扫码即申请",
    desc: "借贷保险跳转机构 · 银票 OCR 比价 · 万联通证与供应链票据",
    cta: "查看金融产品",
    to: "/finance",
    tone: "fin",
  },
  {
    id: "b3",
    kicker: "企业服务 · AI 经纪人",
    title: "11 类严选企服 · 里程碑交付",
    desc: "知产财税法律人力 · 电子合同 · 资金托管 · 需求大厅双边撮合",
    cta: "浏览企业服务",
    to: "/services",
    tone: "demand",
  },
  {
    id: "b4",
    kicker: "产业地图 · 智能撮合",
    title: "看清园区产业链与供需",
    desc: "企业分布 · 热力片区 · 链上关系 · 一键对接上下游",
    cta: "打开产业地图",
    to: "/map",
    tone: "policy",
  },
];

export const products: Product[] = [
  {
    id: "p1",
    name: "高精度伺服电机",
    spec: "1.5kW · 3000rpm · IP65",
    price: "2,860",
    unit: "台",
    supplier: "汇川技术",
    tag: "协议价",
    mark: "伺服",
    tone: "t1",
    categoryId: "tools",
    image: "/products/p1-servo.jpg",
  },
  {
    id: "p2",
    name: "工业润滑油 NL-32",
    spec: "200L / 桶 · 抗磨液压",
    price: "45",
    unit: "升",
    supplier: "中国石化",
    tag: "协议价",
    mark: "润滑",
    tone: "t2",
    categoryId: "tools",
    image: "/products/p2-oil.jpg",
  },
  {
    id: "p3",
    name: "丁腈防护手套",
    spec: "9 寸 · 防油防割 · 12 双",
    price: "68",
    unit: "打",
    supplier: "霍尼韦尔",
    tag: "热销",
    mark: "防护",
    tone: "t3",
    categoryId: "cleaning",
    image: "/products/p3-gloves.jpg",
  },
  {
    id: "p4",
    name: "A4 复印纸 80g",
    spec: "500 张 / 包 · 5 包 / 箱",
    price: "128",
    unit: "箱",
    supplier: "晨光文具",
    tag: "协议价",
    mark: "文具",
    tone: "t4",
    categoryId: "office",
    image: "/products/p4-paper.jpg",
  },
];

export const services = servicesCatalogSummary();

export const finance = financeCatalogSummary();

export const demands = demandsCatalogSummary();

export const news = newsCatalogSummary();

export const todos: TodoItem[] = [
  {
    id: "t1",
    type: "order",
    title: "伺服电机 × 20 已发货，待签收验收",
    extra: "集采 · 采购单 PO-08216",
    to: "/procurement",
  },
  {
    id: "t2",
    type: "pay",
    title: "7 月对账单待付款 ¥86,400",
    extra: "集采 · 账期至 08-25",
    to: "/procurement",
  },
  {
    id: "t3",
    type: "finance",
    title: "银票贴现评估完成，3 家机构已报价",
    extra: "金融 · 票面 200 万",
    to: "/finance",
  },
  {
    id: "t4",
    type: "policy",
    title: "可申报「研发加计扣除」，距截止 12 天",
    extra: "资讯 · AI 已匹配 94%",
    to: "/news",
  },
];

export const navItems = [
  { to: "/", label: "首页" },
  { to: "/services", label: "企业服务" },
  { to: "/finance", label: "数智金融" },
  { to: "/procurement", label: "商品交易" },
  { to: "/logistics", label: "智慧物流" },
  { to: "/news", label: "产业资讯" },
  { to: "/ai", label: "AI赋能" },
  { to: "/account", label: "个人中心", always: true },
];
