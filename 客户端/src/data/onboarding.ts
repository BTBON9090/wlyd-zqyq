import type { EnterpriseApplication } from "../types/auth";
import { parseIndustryApplication } from "./industries";

export type CustomerTypeId =
  | "person"
  | "sole"
  | "enterprise"
  | "enterprise_media"
  | "agency"
  | "nonprofit"
  | "minfei"
  | "other"
  | "social"
  | "inst_media"
  | "institution";

export type DocSlot = {
  id: string;
  label: string;
  hint: string;
  required: boolean;
  ocr: boolean;
};

export type CustomerType = {
  id: CustomerTypeId;
  label: string;
  hint: string;
  subjectLabel: string;
  certLabel: string;
  usesIdType: boolean;
  documents: DocSlot[];
};

export const ID_TYPES = [
  { id: "id_card", label: "居民身份证" },
  { id: "passport", label: "护照" },
  { id: "hk_mo_pass", label: "港澳居民来往内地通行证" },
  { id: "tw_pass", label: "台湾居民来往大陆通行证" },
  { id: "foreign_pr", label: "外国人永久居留身份证" },
  { id: "residence", label: "港澳台居民居住证" },
];

/** 身份证件正反面（个人、经营者、法定代表人等） */
function idDocPair(prefix: string, role: string, ocrFront = false): DocSlot[] {
  return [
    {
      id: `${prefix}_front`,
      label: `${role}正面（人像面）`,
      hint: ocrFront ? "OCR 识别姓名、证件号、有效期" : "上传证件正面 / 人像页",
      required: true,
      ocr: ocrFront,
    },
    {
      id: `${prefix}_back`,
      label: `${role}反面（国徽面 / 签发页）`,
      hint: "上传证件反面；护照请上传签证页",
      required: true,
      ocr: false,
    },
  ];
}

export const customerTypes: CustomerType[] = [
  {
    id: "person",
    label: "个人",
    hint: "自然人入驻，需核验有效身份证件",
    subjectLabel: "主体名称（姓名）",
    certLabel: "证件号码",
    usesIdType: true,
    documents: idDocPair("id", "身份证件", true),
  },
  {
    id: "sole",
    label: "个体工商户",
    hint: "需上传营业执照及经营者身份证件",
    subjectLabel: "字号名称",
    certLabel: "统一社会信用代码",
    usesIdType: false,
    documents: [
      { id: "license", label: "营业执照", hint: "OCR 识别名称、信用代码、有效期", required: true, ocr: true },
      ...idDocPair("owner_id", "经营者身份证件"),
    ],
  },
  {
    id: "enterprise",
    label: "企业法人",
    hint: "公司、非公司企业法人",
    subjectLabel: "企业名称",
    certLabel: "统一社会信用代码",
    usesIdType: false,
    documents: [
      { id: "license", label: "营业执照", hint: "OCR 识别名称、信用代码、有效期", required: true, ocr: true },
      ...idDocPair("legal_id", "法定代表人身份证件"),
    ],
  },
  {
    id: "enterprise_media",
    label: "企业媒体",
    hint: "企业主体新闻单位 / 互联网媒体",
    subjectLabel: "企业名称",
    certLabel: "统一社会信用代码",
    usesIdType: false,
    documents: [
      { id: "license", label: "营业执照", hint: "OCR 识别名称、信用代码、有效期", required: true, ocr: true },
    ],
  },
  {
    id: "agency",
    label: "机关",
    hint: "党政机关、人大、政协、监察、审判、检察机关等",
    subjectLabel: "单位名称",
    certLabel: "统一社会信用代码",
    usesIdType: false,
    documents: [
      { id: "uscc_cert", label: "统一社会信用代码证书 / 机关法人证书", hint: "OCR 识别名称、代码、有效期", required: true, ocr: true },
    ],
  },
  {
    id: "nonprofit",
    label: "非营利组织",
    hint: "慈善基金会、大使馆、国外政府机构等",
    subjectLabel: "组织名称",
    certLabel: "统一社会信用代码 / 登记证号",
    usesIdType: false,
    documents: [
      { id: "reg_cert", label: "基金会法人登记证书 / 驻华机构证明", hint: "OCR 识别名称、证号、有效期", required: true, ocr: true },
    ],
  },
  {
    id: "minfei",
    label: "民办非企业",
    hint: "民办学校、民办医院、民办养老机构等",
    subjectLabel: "单位名称",
    certLabel: "统一社会信用代码",
    usesIdType: false,
    documents: [
      { id: "reg_cert", label: "民办非企业单位登记证书", hint: "OCR 识别名称、信用代码、有效期", required: true, ocr: true },
    ],
  },
  {
    id: "other",
    label: "其他组织",
    hint: "无法归入以上类型的其他主体",
    subjectLabel: "主体名称",
    certLabel: "证件号码",
    usesIdType: false,
    documents: [
      { id: "other_cert", label: "主体资格证明文件", hint: "OCR 识别名称、证件号、有效期", required: true, ocr: true },
    ],
  },
  {
    id: "social",
    label: "社会团体",
    hint: "行业协会、学会、联合会等",
    subjectLabel: "团体名称",
    certLabel: "统一社会信用代码",
    usesIdType: false,
    documents: [
      { id: "reg_cert", label: "社会团体法人登记证书", hint: "OCR 识别名称、信用代码、有效期", required: true, ocr: true },
    ],
  },
  {
    id: "inst_media",
    label: "事业单位媒体",
    hint: "电台、电视台、报社等事业单位媒体",
    subjectLabel: "单位名称",
    certLabel: "统一社会信用代码",
    usesIdType: false,
    documents: [
      { id: "inst_cert", label: "事业单位法人证书", hint: "OCR 识别名称、信用代码、有效期", required: true, ocr: true },
    ],
  },
  {
    id: "institution",
    label: "事业单位",
    hint: "学校、医院、科研院所等",
    subjectLabel: "单位名称",
    certLabel: "统一社会信用代码",
    usesIdType: false,
    documents: [
      { id: "inst_cert", label: "事业单位法人证书", hint: "OCR 识别名称、信用代码、有效期", required: true, ocr: true },
    ],
  },
];

export const customerTypeLabel = (id: string) =>
  customerTypes.find((t) => t.id === id)?.label ?? id;

export { formatIndustrySelection, parseIndustryApplication } from "./industries";
export type { IndustrySelection } from "./industries";

export type OcrResult = {
  subjectName: string;
  certNo: string;
  certValidUntil: string;
  establishedAt?: string;
  registeredCapital?: string;
  registeredAddress?: string;
};

export type CreateDraft = {
  parkId: string;
  customerType: CustomerTypeId | "";
  idType: string;
  subjectName: string;
  certNo: string;
  certValidUntil: string;
  longTerm: boolean;
  establishedAt: string;
  registeredCapital: string;
  registeredAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  displayName: string;
  uploads: Record<string, string>;
  /** 图片 dataURL 或 file:mime:name 占位 */
  uploadPreviews: Record<string, string>;
  industrySection: string;
  industryDivision: string;
  industryGroup: string;
  industryClass: string;
  enterpriseNature: string;
  enterpriseScale: string;
  businessDescription: string;
  intro: string;
  address: string;
  lat: number | null;
  lng: number | null;
  upstreamCategories: string;
  downstreamCategories: string;
  industryChainL1: string;
  industryChainL2: string;
  industryChainL3: string;
  chainSegments: string[];
  enterpriseTags: string[];
  agree: boolean;
  faceVerified: boolean;
  signed: boolean;
};

export const emptyCreateDraft = (): CreateDraft => ({
  parkId: "",
  customerType: "",
  idType: "id_card",
  subjectName: "",
  certNo: "",
  certValidUntil: "",
  longTerm: false,
  establishedAt: "",
  registeredCapital: "",
  registeredAddress: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  displayName: "",
  uploads: {},
  uploadPreviews: {},
  industrySection: "",
  industryDivision: "",
  industryGroup: "",
  industryClass: "",
  enterpriseNature: "",
  enterpriseScale: "",
  businessDescription: "",
  intro: "",
  address: "",
  lat: null,
  lng: null,
  upstreamCategories: "",
  downstreamCategories: "",
  industryChainL1: "",
  industryChainL2: "",
  industryChainL3: "",
  chainSegments: [],
  enterpriseTags: [],
  agree: false,
  faceVerified: false,
  signed: false,
});

/** 从驳回申请回填创建企业草稿 */
export function createDraftFromApplication(
  app: EnterpriseApplication,
  userPhone?: string,
): CreateDraft {
  const base = emptyCreateDraft();
  const industry = parseIndustryApplication(app.industry);
  const longTerm = app.certValidUntil === "长期";
  return {
    ...base,
    parkId: app.parkId ?? "",
    customerType: (app.customerType as CustomerTypeId) ?? "",
    idType: app.idType ?? "id_card",
    subjectName: app.enterpriseName ?? "",
    certNo: app.uscc ?? "",
    certValidUntil: longTerm ? "" : (app.certValidUntil ?? ""),
    longTerm,
    contactName: app.contactName ?? "",
    contactPhone: app.contactPhone ?? userPhone ?? "",
    contactEmail: app.contactEmail ?? "",
    displayName: app.displayName ?? "",
    industrySection: industry.section,
    industryDivision: industry.division,
    industryGroup: industry.group,
    industryClass: industry.class,
    enterpriseNature: app.enterpriseNature ?? "",
    enterpriseScale: app.enterpriseScale ?? "",
    businessDescription: app.businessDescription ?? app.mainProducts ?? "",
    intro: app.intro ?? "",
    address: app.address ?? "",
    lat: app.lat ?? null,
    lng: app.lng ?? null,
    establishedAt: app.establishedAt ?? "",
    registeredCapital: app.registeredCapital ?? "",
    registeredAddress: app.registeredAddress ?? "",
    upstreamCategories: app.upstreamCategories ?? "",
    downstreamCategories: app.downstreamCategories ?? "",
    industryChainL1: app.industryChainL1 ?? "",
    industryChainL2: app.industryChainL2 ?? "",
    industryChainL3: app.industryChainL3 ?? "",
    chainSegments: app.chainSegments ?? [],
    enterpriseTags: app.enterpriseTags ?? [],
    faceVerified: app.faceVerified ?? false,
    signed: app.eSigned ?? false,
    agree: !!(app.faceVerified && app.eSigned),
    uploads: app.uploads ?? {},
    uploadPreviews: app.uploadPreviews ?? {},
  };
}

/** 企业法人演示用上传材料（档案预览） */
export function demoEnterpriseUploads(): {
  uploads: Record<string, string>;
  uploadPreviews: Record<string, string>;
} {
  const uploads = {
    license: "营业执照-临港精密制造.pdf",
    legal_id_front: "法人身份证正面.jpg",
    legal_id_back: "法人身份证反面.jpg",
  };
  const uploadPreviews: Record<string, string> = {
    license: "file:application/pdf:营业执照-临港精密制造.pdf",
    legal_id_front: demoIdCardPreview("正面"),
    legal_id_back: demoIdCardPreview("反面"),
  };
  return { uploads, uploadPreviews };
}

function demoIdCardPreview(side: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0d4ea3"/><stop offset="1" stop-color="#1a66b8"/></linearGradient></defs>
  <rect width="640" height="400" fill="url(#g)"/>
  <rect x="40" y="40" width="560" height="320" rx="16" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)"/>
  <text x="320" y="180" text-anchor="middle" fill="#fff" font-size="28" font-family="sans-serif">身份证件${side}</text>
  <text x="320" y="230" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-size="16" font-family="sans-serif">演示预览 · 非真实证件</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}


export function mockOcr(type: CustomerTypeId, idType: string): OcrResult {
  if (type === "person") {
    const byId: Record<string, OcrResult> = {
      id_card: { subjectName: "张三", certNo: "310115199001011234", certValidUntil: "2034-05-20" },
      passport: { subjectName: "ZHANG SAN", certNo: "E12345678", certValidUntil: "2031-11-08" },
      hk_mo_pass: { subjectName: "陈志明", certNo: "H12345678", certValidUntil: "2030-03-12" },
      tw_pass: { subjectName: "林雅婷", certNo: "0001234567", certValidUntil: "2029-09-01" },
      foreign_pr: { subjectName: "JOHN MILLER", certNo: "911000198801011111", certValidUntil: "2033-01-15" },
      residence: { subjectName: "王晓东", certNo: "810000199202022222", certValidUntil: "2032-07-30" },
    };
    return byId[idType] ?? byId.id_card;
  }
  const org: Record<string, OcrResult> = {
    sole: {
      subjectName: "临港小满机电经营部",
      certNo: "92310000MA1FLSOLE1",
      certValidUntil: "2029-12-31",
      establishedAt: "2019-03-18",
      registeredCapital: "50万元人民币",
      registeredAddress: "上海市浦东新区临港新片区环湖西二路 66 号",
    },
    enterprise: {
      subjectName: "临港智造装备有限公司",
      certNo: "91310000MA1FL8888X",
      certValidUntil: "长期",
      establishedAt: "2018-06-15",
      registeredCapital: "5000万元人民币",
      registeredAddress: "上海市浦东新区临港新片区环湖西一路 88 号",
    },
    enterprise_media: {
      subjectName: "临港产经传媒有限公司",
      certNo: "91310000MA1MEDIA01",
      certValidUntil: "长期",
      establishedAt: "2020-01-10",
      registeredCapital: "1000万元人民币",
      registeredAddress: "上海市浦东新区临港新片区海港大道 1555 号",
    },
    agency: {
      subjectName: "临港新片区管委会经济发展处",
      certNo: "11310000MB1JG0001X",
      certValidUntil: "长期",
      establishedAt: "2019-08-20",
      registeredCapital: "—",
      registeredAddress: "上海市浦东新区临港新片区申港大道 200 号",
    },
    nonprofit: {
      subjectName: "临港产业促进基金会",
      certNo: "53310000MJ1FOUND01",
      certValidUntil: "2030-06-30",
      establishedAt: "2017-11-05",
      registeredCapital: "800万元人民币",
      registeredAddress: "上海市浦东新区临港新片区环湖西三路 18 号",
    },
    minfei: {
      subjectName: "临港技能培训中心",
      certNo: "52310000MF1PX0001Y",
      certValidUntil: "2028-08-18",
      establishedAt: "2016-05-22",
      registeredCapital: "300万元人民币",
      registeredAddress: "上海市浦东新区临港新片区江山路 1800 号",
    },
    other: {
      subjectName: "临港协同创新联合体",
      certNo: "N310000ORG000001",
      certValidUntil: "2027-12-31",
      establishedAt: "2021-04-01",
      registeredCapital: "—",
      registeredAddress: "上海市浦东新区临港新片区海洋一路 333 号",
    },
    social: {
      subjectName: "临港智能制造行业协会",
      certNo: "51310000ST1XH0001Z",
      certValidUntil: "长期",
      establishedAt: "2015-09-12",
      registeredCapital: "—",
      registeredAddress: "上海市浦东新区临港新片区环湖西一路 99 号 B 座",
    },
    inst_media: {
      subjectName: "临港广播电视台",
      certNo: "12310000SY1TV0001A",
      certValidUntil: "长期",
      establishedAt: "2014-07-01",
      registeredCapital: "—",
      registeredAddress: "上海市浦东新区临港新片区申港大道 100 号",
    },
    institution: {
      subjectName: "临港产业技术研究院",
      certNo: "12310000SY1YJ0001B",
      certValidUntil: "长期",
      establishedAt: "2013-12-08",
      registeredCapital: "—",
      registeredAddress: "上海市浦东新区临港新片区海洋七路 99 号",
    },
  };
  return org[type] ?? org.enterprise;
}

const GEO_HINTS = [
  { q: "临港", address: "上海市浦东新区临港新片区环湖西一路 99 号", lat: 30.8892, lng: 121.9265 },
  { q: "环湖西一", address: "上海市浦东新区临港新片区环湖西一路 99 号", lat: 30.8892, lng: 121.9265 },
  { q: "智造园", address: "上海市浦东新区临港新片区临港智造园 A 区 1 号楼", lat: 30.8915, lng: 121.9288 },
  { q: "海洋七路", address: "上海市浦东新区临港新片区海洋七路 88 号", lat: 30.8864, lng: 121.9312 },
  { q: "申港", address: "上海市浦东新区临港新片区申港大道 100 号", lat: 30.8836, lng: 121.922 },
  { q: "张江", address: "上海市浦东新区张江科学城祖冲之路 2290 号", lat: 31.203, lng: 121.587 },
  { q: "苏州", address: "苏州市工业园区星湖街 328 号", lat: 31.318, lng: 120.727 },
  { q: "杭州", address: "杭州市余杭区余杭塘路 2301 号", lat: 30.286, lng: 120.007 },
  { q: "深圳", address: "深圳市南山区科技园南路 18 号", lat: 22.533, lng: 113.94 },
  { q: "前海", address: "深圳市前海深港合作区梦海大道 5033 号", lat: 22.522, lng: 113.887 },
];

function dist2(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dy = aLat - bLat;
  const dx = aLng - bLng;
  return dy * dy + dx * dx;
}

/** 地址关键词查询：返回可读地址 + 经纬度（经纬度用于存储） */
export function geocodeAddress(query: string) {
  const q = query.trim();
  if (!q) return null;
  const hit = GEO_HINTS.find((h) => q.includes(h.q) || h.address.includes(q));
  if (hit) {
    // 用户输入已是完整门牌描述时保留原文，否则用标准地址
    const address = /[省市路街号楼]/.test(q) && q.length >= 8 ? q : hit.address;
    return { address, lat: hit.lat, lng: hit.lng };
  }
  const seed = [...q].reduce((n, c) => n + c.charCodeAt(0), 0);
  const lat = Number((30.8892 + ((seed % 80) - 40) / 1000).toFixed(6));
  const lng = Number((121.9265 + ((seed % 60) - 30) / 1000).toFixed(6));
  // 无命中时仍给出可读地址，不以经纬度充当展示文案
  const address = /[省市路街号楼]/.test(q) ? q : `上海市浦东新区临港新片区（${q}）`;
  return { address, lat, lng };
}

/** 地图点选反查：展示具体地址描述，经纬度单独存储 */
export function reverseGeocode(lat: number, lng: number) {
  let nearest = GEO_HINTS[0];
  let best = Infinity;
  for (const h of GEO_HINTS) {
    const d = dist2(lat, lng, h.lat, h.lng);
    if (d < best) {
      best = d;
      nearest = h;
    }
  }
  // 与最近点很近：直接用标准门牌；稍远：标注「附近」但仍是可读地址
  const close = best < 0.00005;
  const address = close ? nearest.address : `${nearest.address}附近`;
  return {
    address,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}
