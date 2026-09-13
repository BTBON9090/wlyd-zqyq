import type { Product } from "../data";

export type ProcCategory = {
  id: string;
  name: string;
  icon: string;
};

export const procCategories: ProcCategory[] = [
  { id: "all", name: "全部商品", icon: "☰" },
  { id: "security", name: "安防设备", icon: "🛡" },
  { id: "cleaning", name: "清洁耗材", icon: "🧹" },
  { id: "tools", name: "工具设施", icon: "🔧" },
  { id: "flood", name: "防汛应急", icon: "🌊" },
  { id: "fire", name: "消防安全", icon: "🔥" },
  { id: "office", name: "物业办公", icon: "📎" },
];

export const procValueProps = [
  { title: "一站式聚合采购", desc: "专业化产业服务" },
  { title: "品类齐全", desc: "轻松购物" },
  { title: "园区专享", desc: "协议价省心省力" },
  { title: "正品行货", desc: "精致履约服务" },
];

export const hotSearches = [
  "伺服电机",
  "工业润滑油",
  "丁腈手套",
  "灭火器",
  "监控摄像头",
  "A4 复印纸",
];

export const orderTabs = [
  { id: "mall", label: "电商订单", count: 12 },
  { id: "contract", label: "协议订单", count: 8 },
  { id: "rfq", label: "询价单", count: 3 },
];

export type ProcurementOrder = {
  id: string;
  tab: "mall" | "contract" | "rfq";
  title: string;
  amount: string;
  status: string;
  time: string;
  supplier?: string;
};

export const procurementOrders: ProcurementOrder[] = [
  { id: "PO-08216", tab: "mall", title: "伺服电机 × 20", amount: "¥57,200", status: "待签收", time: "08-18", supplier: "汇川技术" },
  { id: "PO-08192", tab: "mall", title: "丁腈防护手套 × 50 打", amount: "¥3,400", status: "已完成", time: "08-12", supplier: "霍尼韦尔" },
  { id: "CT-07201", tab: "contract", title: "7 月对公协议结算", amount: "¥86,400", status: "待付款", time: "08-05", supplier: "园区集采中心" },
  { id: "CT-06118", tab: "contract", title: "工业润滑油年框协议", amount: "¥128,000", status: "履约中", time: "06-20", supplier: "中国石化" },
  { id: "RFQ-0901", tab: "rfq", title: "监控摄像头询价", amount: "—", status: "报价中", time: "08-19", supplier: "3 家供应商" },
  { id: "RFQ-0828", tab: "rfq", title: "灭火器批量询价", amount: "—", status: "已截止", time: "08-10", supplier: "5 家供应商" },
];

/** 集采目录扩展商品（与 data.products 合并展示） */
export const catalogProducts: Product[] = [
  {
    id: "p5",
    name: "200 万像素网络摄像机",
    spec: "H.265 · 红外 30m · POE",
    price: "428",
    unit: "台",
    supplier: "海康威视",
    tag: "协议价",
    mark: "监控",
    tone: "t1",
    categoryId: "security",
    image: "/products/p5-camera.jpg",
  },
  {
    id: "p6",
    name: "门禁刷卡读头",
    spec: "IC 卡 · IP65 · 韦根 26",
    price: "186",
    unit: "个",
    supplier: "大华股份",
    tag: "协议价",
    mark: "门禁",
    tone: "t2",
    categoryId: "security",
    image: "/products/p6-access.jpg",
  },
  {
    id: "p7",
    name: "工业无尘擦拭纸",
    spec: "9×9 寸 · 低尘 · 600 片",
    price: "96",
    unit: "包",
    supplier: "金佰利",
    tag: "热销",
    mark: "擦拭",
    tone: "t3",
    categoryId: "cleaning",
    image: "/products/p7-wipes.jpg",
  },
  {
    id: "p8",
    name: "多功能清洁剂",
    spec: "5L / 桶 · 中性配方",
    price: "58",
    unit: "桶",
    supplier: "蓝月亮",
    tag: "协议价",
    mark: "清洁",
    tone: "t4",
    categoryId: "cleaning",
    image: "/products/p8-cleaner.jpg",
  },
  {
    id: "p9",
    name: "电动扭矩扳手",
    spec: "20–200N·m · 锂电",
    price: "1,680",
    unit: "把",
    supplier: "博世",
    tag: "协议价",
    mark: "扳手",
    tone: "t1",
    categoryId: "tools",
    image: "/products/p9-wrench.jpg",
  },
  {
    id: "p10",
    name: "安全警示锥",
    spec: "75cm · 反光条 · 10 个",
    price: "128",
    unit: "套",
    supplier: "3M",
    tag: "协议价",
    mark: "警示",
    tone: "t2",
    categoryId: "tools",
    image: "/products/p10-cone.jpg",
  },
  {
    id: "p11",
    name: "防汛沙袋",
    spec: "30×70cm · 聚丙烯 · 50 个",
    price: "320",
    unit: "包",
    supplier: "应急物资中心",
    tag: "协议价",
    mark: "防汛",
    tone: "t3",
    categoryId: "flood",
    image: "/products/p11-sandbag.jpg",
  },
  {
    id: "p12",
    name: "抽水泵",
    spec: "2 寸 · 220V · 流量 30m³/h",
    price: "860",
    unit: "台",
    supplier: "格兰富",
    tag: "协议价",
    mark: "水泵",
    tone: "t4",
    categoryId: "flood",
    image: "/products/p12-pump.jpg",
  },
  {
    id: "p13",
    name: "干粉灭火器 4kg",
    spec: "ABC 类 · 国标 3C",
    price: "78",
    unit: "具",
    supplier: "青鸟消防",
    tag: "协议价",
    mark: "灭火",
    tone: "t1",
    categoryId: "fire",
    image: "/products/p13-extinguisher.jpg",
  },
  {
    id: "p14",
    name: "消防水带 65 型",
    spec: "25m · 13 型 · 含接口",
    price: "168",
    unit: "盘",
    supplier: "海湾安全",
    tag: "协议价",
    mark: "水带",
    tone: "t2",
    categoryId: "fire",
    image: "/products/p14-hose.jpg",
  },
  {
    id: "p15",
    name: "中性笔 0.5mm",
    spec: "黑色 · 12 支 / 盒",
    price: "18",
    unit: "盒",
    supplier: "晨光文具",
    tag: "热销",
    mark: "文具",
    tone: "t3",
    categoryId: "office",
    image: "/products/p15-pen.jpg",
  },
  {
    id: "p16",
    name: "A4 文件档案盒",
    spec: "55mm 背宽 · 10 个 / 包",
    price: "42",
    unit: "包",
    supplier: "得力",
    tag: "协议价",
    mark: "档案",
    tone: "t4",
    categoryId: "office",
    image: "/products/p16-folder.jpg",
  },
];

export const categoryLabels: Record<string, string> = Object.fromEntries(
  procCategories.map((c) => [c.id, c.name]),
);
