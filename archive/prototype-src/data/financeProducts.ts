export type FinanceCategory = "loan" | "insurance" | "bill" | "token" | "scbill";

export type FinanceProduct = {
  id: string;
  category: FinanceCategory;
  type: string;
  name: string;
  highlight: string;
  partner: string;
  mode: string;
  meta: string;
  rate?: string;
  limit?: string;
  features: string[];
  flow: string[];
};

export const financeCategories: { id: FinanceCategory | "all"; label: string; icon: string }[] = [
  { id: "all", label: "全部产品", icon: "◈" },
  { id: "loan", label: "借贷", icon: "¥" },
  { id: "insurance", label: "保险", icon: "☂" },
  { id: "bill", label: "票据", icon: "票" },
  { id: "token", label: "万联通证", icon: "链" },
  { id: "scbill", label: "供应链票据", icon: "供" },
];

export const financeValueProps = [
  { title: "银行直连", desc: "秒级审批 · 线上流转" },
  { title: "全谱系产品", desc: "信贷 · 票据 · 通证 · 保险" },
  { title: "园区适配", desc: "协议价贸易背景核验" },
  { title: "数字化服务", desc: "OCR 识票 · 多机构比价" },
];

export const financeProducts: FinanceProduct[] = [
  {
    id: "f1",
    category: "loan",
    type: "借贷",
    name: "园区信用贷",
    highlight: "最高 500 万 · 年化 3.85% 起 · 随借随还",
    partner: "合作银行",
    mode: "扫码跳转",
    meta: "跳转机构 H5 完成申请，平台回传进度",
    rate: "3.85% 起",
    limit: "500 万",
    features: ["免抵押信用授信", "园区白名单加速", "对公账户放款"],
    flow: ["扫码进入银行页", "填写企业与经营信息", "授信审批", "提款到账"],
  },
  {
    id: "f5",
    category: "loan",
    type: "借贷",
    name: "万业贷",
    highlight: "生产经营周转 · 最高 300 万",
    partner: "南京银行 × 万连融",
    mode: "扫码跳转",
    meta: "基于交易与纳税数据评估",
    rate: "4.2% 起",
    limit: "300 万",
    features: ["线上纯信用", "3 个工作日放款", "随借随还"],
    flow: ["产品详情", "扫码申请", "额度审批", "用款"],
  },
  {
    id: "f6",
    category: "loan",
    type: "借贷",
    name: "订单融资贷",
    highlight: "基于园区集采订单 · 应收账款质押",
    partner: "浦发银行",
    mode: "扫码跳转",
    meta: "与集采订单、对账单联动",
    rate: "4.5% 起",
    limit: "1000 万",
    features: ["订单确权", "账期匹配", "受托支付"],
    flow: ["选择订单", "提交贸易背景", "银行审批", "定向放款"],
  },
  {
    id: "f2",
    category: "insurance",
    type: "保险",
    name: "企业财产一切险",
    highlight: "厂房设备 · 存货 · 营业中断",
    partner: "中国人保",
    mode: "扫码跳转",
    meta: "扫码进入承保机构页面",
    limit: "按资产估值",
    features: ["财产综合保障", "营业中断附加", "快速理赔通道"],
    flow: ["扫码投保", "填写标的", "核保出单", "电子保单"],
  },
  {
    id: "f7",
    category: "insurance",
    type: "保险",
    name: "雇主责任险",
    highlight: "员工工伤意外 · 法律费用补偿",
    partner: "平安产险",
    mode: "扫码跳转",
    meta: "按人数计费 · 线上续保",
    limit: "100 万 / 人",
    features: ["工伤医疗", "误工补偿", "诉讼费用"],
    flow: ["选择方案", "扫码投保", "支付出单", "理赔服务"],
  },
  {
    id: "f3",
    category: "bill",
    type: "票据",
    name: "银票贴现直连",
    highlight: "上传票面 · OCR 识别 · 多机构实时报价",
    partner: "富民银行 × 万连融",
    mode: "上传评估",
    meta: "线上询价 → 签约建额 → 提交贸背 → 完成贴现",
    rate: "1.2% 起",
    limit: "单张不限",
    features: ["银行直连秒批", "超期发票可受理", "到账金额预估"],
    flow: ["上传银票", "OCR 识票", "多机构比价", "提交贸背", "贴现到账"],
  },
  {
    id: "f4",
    category: "token",
    type: "通证",
    name: "万联通证融资",
    highlight: "电子债权凭证 · 拆分转让 · 机构对接融资",
    partner: "万连融平台",
    mode: "流转融资",
    meta: "贸易背景审核 · 持证融资",
    limit: "按核心企业授信",
    features: ["可拆分流转", "多级供应商支付", "持证融资"],
    flow: ["核心企业开具", "供应商接收", "转让 / 融资", "到期兑付"],
  },
  {
    id: "f8",
    category: "scbill",
    type: "供应链票据",
    name: "供应链票据流转",
    highlight: "核心企业背书 · 多级流转追溯",
    partner: "票交所接入",
    mode: "平台办理",
    meta: "应付账款票据化 · 线上签发承兑",
    limit: "按承兑额度",
    features: ["背书确认", "流转追溯", "贴现融资"],
    flow: ["核心企业签发", "供应商签收", "背书转让", "贴现或到期"],
  },
];

export type BillQuote = {
  bank: string;
  rate: string;
  arrival: string;
  days: number;
};

export const mockBillQuotes: BillQuote[] = [
  { bank: "富民银行", rate: "1.18%", arrival: "¥1,962,400", days: 0 },
  { bank: "南京银行", rate: "1.22%", arrival: "¥1,954,600", days: 1 },
  { bank: "浦发银行", rate: "1.25%", arrival: "¥1,948,800", days: 1 },
];

export const financeRecords = [
  { id: "r1", type: "票据", category: "bill" as const, title: "银票贴现 · 富民银行", status: "待提交贸背", amount: "200 万", time: "今天 10:32" },
  { id: "r2", type: "借贷", category: "loan" as const, title: "园区信用贷授信", status: "审批中", amount: "300 万", time: "08-17" },
  { id: "r3", type: "通证", category: "token" as const, title: "万联通证融资", status: "已放款", amount: "50 万", time: "08-12" },
  { id: "r4", type: "对账", category: "statement" as const, title: "7 月融资服务费对账单", status: "待确认", amount: "¥2,860", time: "08-08" },
  { id: "r5", type: "借贷", category: "loan" as const, title: "设备贷意向申请", status: "已提交", amount: "150 万", time: "08-01" },
];

export const categoryLabel: Record<FinanceCategory, string> = {
  loan: "借贷",
  insurance: "保险",
  bill: "票据",
  token: "万联通证",
  scbill: "供应链票据",
};

/** 供首页等沿用的精简列表 */
export function financeCatalogSummary() {
  return financeProducts.slice(0, 4).map((p) => ({
    id: p.id,
    type: p.type,
    name: p.name,
    highlight: p.highlight,
    meta: p.meta,
    mode: p.mode,
  }));
}
