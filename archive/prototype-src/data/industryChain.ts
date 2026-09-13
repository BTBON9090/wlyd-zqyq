/** 园区所属产业（一二三级）及产业链、标签选项 */

export type ChainLevel3 = { id: string; name: string };
export type ChainLevel2 = { id: string; name: string; children: ChainLevel3[] };
export type ChainLevel1 = { id: string; name: string; children: ChainLevel2[] };

export const industryChainTree: ChainLevel1[] = [
  {
    id: "equip",
    name: "高端装备",
    children: [
      {
        id: "smart-equip",
        name: "智能制造装备",
        children: [
          { id: "robot", name: "工业机器人" },
          { id: "cnc", name: "数控机床" },
          { id: "agv", name: "智能物流装备" },
        ],
      },
      {
        id: "precise-instr",
        name: "精密仪器仪表",
        children: [
          { id: "sensor", name: "智能传感器" },
          { id: "optics", name: "光学测量仪器" },
        ],
      },
      {
        id: "marine",
        name: "海工装备",
        children: [
          { id: "offshore", name: "海洋工程装备" },
          { id: "ship", name: "船舶配套" },
        ],
      },
    ],
  },
  {
    id: "material",
    name: "新材料",
    children: [
      {
        id: "adv-material",
        name: "先进基础材料",
        children: [
          { id: "alloy", name: "高性能合金" },
          { id: "composite", name: "复合材料" },
        ],
      },
      {
        id: "energy-material",
        name: "新能源材料",
        children: [
          { id: "battery-mat", name: "电池材料" },
          { id: "photovoltaic", name: "光伏材料" },
        ],
      },
    ],
  },
  {
    id: "digital",
    name: "数字经济",
    children: [
      {
        id: "software",
        name: "软件与信息服务",
        children: [
          { id: "industrial-sw", name: "工业软件" },
          { id: "cloud", name: "云计算服务" },
        ],
      },
      {
        id: "ai",
        name: "人工智能",
        children: [
          { id: "ai-app", name: "行业 AI 应用" },
          { id: "data", name: "大数据服务" },
        ],
      },
    ],
  },
  {
    id: "bio",
    name: "生物医药",
    children: [
      {
        id: "med-device",
        name: "医疗器械",
        children: [
          { id: "diagnostic", name: "体外诊断" },
          { id: "implant", name: "植入介入器械" },
        ],
      },
      {
        id: "pharma",
        name: "医药制造",
        children: [
          { id: "api", name: "原料药" },
          { id: "bio-pharma", name: "生物药" },
        ],
      },
    ],
  },
  {
    id: "auto",
    name: "新能源汽车",
    children: [
      {
        id: "ev-whole",
        name: "整车制造",
        children: [
          { id: "passenger-ev", name: "乘用车" },
          { id: "commercial-ev", name: "商用车" },
        ],
      },
      {
        id: "ev-parts",
        name: "核心零部件",
        children: [
          { id: "battery-pack", name: "动力电池" },
          { id: "motor", name: "电驱系统" },
          { id: "electronic", name: "汽车电子" },
        ],
      },
    ],
  },
];

export type IndustryChainSelection = {
  l1: string;
  l2: string;
  l3: string;
};

export const emptyIndustryChainSelection = (): IndustryChainSelection => ({
  l1: "",
  l2: "",
  l3: "",
});

export function getChainL1(id: string) {
  return industryChainTree.find((x) => x.id === id);
}

export function getChainL2(l1Id: string, l2Id: string) {
  return getChainL1(l1Id)?.children.find((x) => x.id === l2Id);
}

export function getChainL3(l1Id: string, l2Id: string, l3Id: string) {
  return getChainL2(l1Id, l2Id)?.children.find((x) => x.id === l3Id);
}

export function formatIndustryChain(sel: IndustryChainSelection) {
  const l1 = getChainL1(sel.l1);
  const l2 = getChainL2(sel.l1, sel.l2);
  const l3 = getChainL3(sel.l1, sel.l2, sel.l3);
  if (!l1 || !l2 || !l3) return "";
  return `${l1.name} / ${l2.name} / ${l3.name}`;
}

export const CHAIN_SEGMENTS = [
  "研发设计",
  "原材料供应",
  "核心零部件",
  "整机制造",
  "系统集成",
  "品牌营销",
  "渠道分销",
  "工程服务",
  "运维售后",
  "回收再利用",
];

export const ENTERPRISE_TAGS = [
  "高新技术企业",
  "专精特新",
  "小巨人企业",
  "科技型中小企业",
  "出口型企业",
  "绿色工厂",
  "智能制造示范",
  "单项冠军",
  "瞪羚企业",
  "独角兽培育",
];

export const ENTERPRISE_NATURES = [
  { id: "state", label: "国企" },
  { id: "private", label: "民企" },
  { id: "foreign", label: "外资" },
  { id: "joint", label: "合资" },
  { id: "listed", label: "上市" },
  { id: "other", label: "其他" },
];

export const ENTERPRISE_SCALES = [
  { id: "1-50", label: "1–50 人" },
  { id: "50-100", label: "50–100 人" },
  { id: "100-500", label: "100–500 人" },
  { id: "500+", label: "500 人以上" },
];

export const enterpriseNatureLabel = (id: string) =>
  ENTERPRISE_NATURES.find((n) => n.id === id)?.label ?? id;

export const enterpriseScaleLabel = (id: string) =>
  ENTERPRISE_SCALES.find((s) => s.id === id)?.label ?? id;
