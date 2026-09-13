import type {
  Enterprise,
  EnterpriseApplication,
  EnterpriseParkRef,
  InviteCodeRecord,
  Membership,
} from "../types/auth";
import { getParkById } from "./parks";

export const MOCK_OTP = "888888";
export { DEMO_PASSWORD } from "./password";

function parksOf(
  primary: { parkId: string; parkName: string },
  extra: EnterpriseParkRef[] = [],
): EnterpriseParkRef[] {
  const list = [{ id: primary.parkId, name: primary.parkName }, ...extra];
  const seen = new Set<string>();
  return list.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

/** 解析企业入驻园区（兼容单园区旧字段） */
export function getEnterpriseParks(enterprise: Enterprise): EnterpriseParkRef[] {
  if (enterprise.parks?.length) return enterprise.parks;
  if (enterprise.parkId) {
    return [{ id: enterprise.parkId, name: enterprise.parkName || enterprise.parkId }];
  }
  return [];
}

/** 平台内已有企业（用于查重、搜索加入） */
export const platformEnterprises: Enterprise[] = [
  {
    id: "ent-001",
    name: "临港精密制造有限公司",
    uscc: "91310000MA1FL1234X",
    industry: "精密制造",
    parkId: "park-sh-lg",
    parkName: "临港智造园",
    parks: parksOf({ parkId: "park-sh-lg", parkName: "临港智造园" }),
    contactName: "王管理员",
    contactPhone: "138****8801",
    status: "approved",
  },
  {
    id: "ent-002",
    name: "海工装备股份有限公司",
    uscc: "91310000MA1FL5678Y",
    industry: "海工装备",
    parkId: "park-sh-lg",
    parkName: "临港智造园",
    parks: parksOf(
      { parkId: "park-sh-lg", parkName: "临港智造园" },
      [
        { id: "park-sh-zj", name: "张江科学城产服园" },
        { id: "park-zj-hz", name: "杭州未来科技城产业园" },
      ],
    ),
    contactName: "李管理员",
    contactPhone: "139****6602",
    status: "approved",
  },
  {
    id: "ent-003",
    name: "临港新材料科技有限公司",
    uscc: "91310000MA1FL9012Z",
    industry: "新材料",
    parkId: "park-sh-lg",
    parkName: "临港智造园",
    parks: parksOf({ parkId: "park-sh-lg", parkName: "临港智造园" }),
    contactName: "张管理员",
    contactPhone: "137****5503",
    status: "approved",
  },
  {
    id: "ent-004",
    name: "智造装备科技（上海）有限公司",
    uscc: "91310000MA1FL3456W",
    industry: "智能装备",
    parkId: "park-sh-lg",
    parkName: "临港智造园",
    parks: parksOf(
      { parkId: "park-sh-lg", parkName: "临港智造园" },
      [{ id: "park-gd-sz-bay", name: "深圳湾科技园" }],
    ),
    contactName: "赵管理员",
    contactPhone: "136****4404",
    status: "approved",
  },
  {
    id: "ent-005",
    name: "苏南智能装备有限公司",
    uscc: "91320594MA1SU1234A",
    industry: "智能装备",
    parkId: "park-js-sz",
    parkName: "苏州工业园数字产服园",
    parks: parksOf({ parkId: "park-js-sz", parkName: "苏州工业园数字产服园" }),
    contactName: "陈管理员",
    contactPhone: "135****3305",
    status: "approved",
  },
  {
    id: "ent-006",
    name: "前海供应链科技有限公司",
    uscc: "91440300MA1QH5678B",
    industry: "供应链服务",
    parkId: "park-gd-sz-qh",
    parkName: "前海产服园",
    parks: parksOf(
      { parkId: "park-gd-sz-qh", parkName: "前海产服园" },
      [{ id: "park-gd-sz-bay", name: "深圳湾科技园" }],
    ),
    contactName: "周管理员",
    contactPhone: "134****2206",
    status: "approved",
  },
];

export const inviteCodes: InviteCodeRecord[] = [
  {
    code: "PARK2026-A4B2",
    enterpriseName: "临港精密制造有限公司",
    uscc: "91310000MA1FL1234X",
    industry: "精密制造",
    parkId: "park-sh-lg",
    parkName: "临港智造园",
    expired: false,
  },
  {
    code: "PARK2026-NEW01",
    enterpriseName: "",
    uscc: "",
    industry: "待入驻企业",
    parkId: "park-zj-hz",
    parkName: "杭州未来科技城产业园",
    expired: false,
  },
];

export function findEnterpriseByUscc(uscc: string, extras: Enterprise[] = []) {
  return [...platformEnterprises, ...extras].find((e) => e.uscc === uscc.trim().toUpperCase());
}

export function findEnterpriseByName(
  query: string,
  extras: Enterprise[] = [],
  parkId?: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const source = [...platformEnterprises, ...extras].filter((e) => {
    if (!parkId) return true;
    if (e.parks?.some((p) => p.id === parkId)) return true;
    return e.parkId === parkId;
  });
  return source.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.uscc.toLowerCase().includes(q) ||
      e.industry.toLowerCase().includes(q),
  );
}

export function getEnterpriseById(id: string, extras: Enterprise[] = []) {
  return [...platformEnterprises, ...extras].find((e) => e.id === id);
}

export function validateInviteCode(code: string) {
  const normalized = code.trim().toUpperCase();
  const record = inviteCodes.find((c) => c.code === normalized);
  if (!record) return { ok: false as const, error: "邀请码无效或已过期" };
  if (record.expired) return { ok: false as const, error: "邀请码已过期，请联系园区运营" };
  return { ok: true as const, record };
}

export function createApplication(
  partial: Omit<EnterpriseApplication, "id" | "createdAt" | "status">,
): EnterpriseApplication {
  return {
    ...partial,
    id: `app-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

export function createMembership(
  partial: Omit<Membership, "id" | "joinedAt">,
): Membership {
  return {
    ...partial,
    id: `mem-${Date.now()}`,
    joinedAt: new Date().toISOString(),
  };
}

/** 用户在某园区下的企业入驻上下文 */
export type EnterpriseContext = {
  key: string;
  membership: Membership;
  enterprise: Enterprise;
  parkId: string;
  parkName: string;
  province: string;
  city: string;
};

export function membershipContextKey(enterpriseId: string, parkId: string) {
  return `${enterpriseId}::${parkId}`;
}

/** 将成员关系展开为「园区 + 企业」入驻上下文（缺 parkId 时按企业入驻园区列表展开） */
export function buildEnterpriseContexts(
  memberships: Membership[],
  extras: Enterprise[] = [],
): EnterpriseContext[] {
  const contexts: EnterpriseContext[] = [];
  for (const membership of memberships) {
    if (membership.status !== "active") continue;
    const enterprise = getEnterpriseById(membership.enterpriseId, extras);
    if (!enterprise) continue;

    const parkIds = membership.parkId
      ? [membership.parkId]
      : getEnterpriseParks(enterprise).map((p) => p.id);

    const uniqueParkIds = [...new Set(parkIds.filter(Boolean))];
    for (const parkId of uniqueParkIds) {
      const park = getParkById(parkId);
      const parkRef = getEnterpriseParks(enterprise).find((p) => p.id === parkId);
      contexts.push({
        key: membershipContextKey(enterprise.id, parkId),
        membership,
        enterprise,
        parkId,
        parkName: park?.name ?? parkRef?.name ?? parkId,
        province: park?.province ?? "未分区",
        city: park?.city ?? "未分市",
      });
    }
  }
  return contexts;
}

export type ContextRegionGroup = {
  province: string;
  city: string;
  parks: {
    parkId: string;
    parkName: string;
    items: EnterpriseContext[];
  }[];
};

/** 按 省 → 市 → 园区 分组 */
export function groupContextsByRegion(contexts: EnterpriseContext[]): ContextRegionGroup[] {
  const provinceMap = new Map<string, Map<string, Map<string, EnterpriseContext[]>>>();

  for (const ctx of contexts) {
    if (!provinceMap.has(ctx.province)) provinceMap.set(ctx.province, new Map());
    const cityMap = provinceMap.get(ctx.province)!;
    if (!cityMap.has(ctx.city)) cityMap.set(ctx.city, new Map());
    const parkMap = cityMap.get(ctx.city)!;
    if (!parkMap.has(ctx.parkId)) parkMap.set(ctx.parkId, []);
    parkMap.get(ctx.parkId)!.push(ctx);
  }

  const groups: ContextRegionGroup[] = [];
  for (const [province, cityMap] of provinceMap) {
    for (const [city, parkMap] of cityMap) {
      groups.push({
        province,
        city,
        parks: [...parkMap.entries()].map(([parkId, items]) => ({
          parkId,
          parkName: items[0]?.parkName ?? parkId,
          items,
        })),
      });
    }
  }
  return groups;
}

