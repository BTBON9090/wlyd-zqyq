export type Park = {
  id: string;
  name: string;
  province: string;
  city: string;
  district: string;
  intro: string;
};

/** 平台可入驻园区。仅 1 个时入驻流程将跳过选择。 */
export const parks: Park[] = [
  {
    id: "park-sh-lg",
    name: "临港智造园",
    province: "上海市",
    city: "上海市",
    district: "浦东新区",
    intro: "高端装备与精密制造产业集群，集采 / 金融 / 企服一站式产服。",
  },
  {
    id: "park-sh-zj",
    name: "张江科学城产服园",
    province: "上海市",
    city: "上海市",
    district: "浦东新区",
    intro: "生物医药与集成电路科创园区，面向研发型企业入驻。",
  },
  {
    id: "park-js-sz",
    name: "苏州工业园数字产服园",
    province: "江苏省",
    city: "苏州市",
    district: "工业园区",
    intro: "外向型制造与数字贸易园区，支持跨境供应链协同。",
  },
  {
    id: "park-zj-hz",
    name: "杭州未来科技城产业园",
    province: "浙江省",
    city: "杭州市",
    district: "余杭区",
    intro: "数字经济与智能制造融合园区。",
  },
  {
    id: "park-gd-sz-bay",
    name: "深圳湾科技园",
    province: "广东省",
    city: "深圳市",
    district: "南山区",
    intro: "湾区科创总部集聚区。",
  },
  {
    id: "park-gd-sz-qh",
    name: "前海产服园",
    province: "广东省",
    city: "深圳市",
    district: "前海合作区",
    intro: "现代金融服务与跨境贸易产服园区。",
  },
];

export function getParkById(id: string | null | undefined) {
  if (!id) return undefined;
  return parks.find((p) => p.id === id);
}

export function getProvinces() {
  return [...new Set(parks.map((p) => p.province))];
}

export function getCities(province: string) {
  return [...new Set(parks.filter((p) => p.province === province).map((p) => p.city))];
}

export function getParksByCity(province: string, city: string) {
  return parks.filter((p) => p.province === province && p.city === city);
}

export function formatParkLocation(park: Park) {
  return `${park.province} · ${park.city} · ${park.district}`;
}
