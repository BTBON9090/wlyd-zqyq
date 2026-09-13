import type { EnterpriseRole, MembershipStatus } from "../types/auth";

export type EnterpriseMember = {
  id: string;
  enterpriseId: string;
  parkId: string;
  parkName: string;
  displayName: string;
  displayPhone: string;
  role: EnterpriseRole;
  status: MembershipStatus | "disabled";
  joinedAt: string;
  /** 是否当前登录用户对应记录 */
  isSelf?: boolean;
  source?: "seed" | "invite" | "join";
};

const STORE_KEY = "park-client-enterprise-members";

function readAll(): EnterpriseMember[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EnterpriseMember[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: EnterpriseMember[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

export function listMembersByEnterprise(enterpriseId: string): EnterpriseMember[] {
  return readAll()
    .filter((m) => m.enterpriseId === enterpriseId)
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
}

export function upsertMember(member: EnterpriseMember) {
  const all = readAll();
  const idx = all.findIndex((m) => m.id === member.id);
  if (idx >= 0) all[idx] = member;
  else all.unshift(member);
  writeAll(all);
  return member;
}

export function updateMember(
  memberId: string,
  patch: Partial<Pick<EnterpriseMember, "role" | "status" | "displayName" | "parkId" | "parkName">>,
) {
  const all = readAll();
  const idx = all.findIndex((m) => m.id === memberId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch };
  writeAll(all);
  return all[idx];
}

export function removeMember(memberId: string) {
  const all = readAll().filter((m) => m.id !== memberId);
  writeAll(all);
}

/** 确保演示企业有一份成员花名册（幂等） */
export function ensureSeedMembers(params: {
  enterpriseId: string;
  parkId: string;
  parkName: string;
  self?: { displayName: string; displayPhone: string; role: EnterpriseRole };
}) {
  const existing = listMembersByEnterprise(params.enterpriseId);
  if (existing.length > 0) {
    if (params.self && !existing.some((m) => m.isSelf)) {
      upsertMember({
        id: `mem-self-${params.enterpriseId}`,
        enterpriseId: params.enterpriseId,
        parkId: params.parkId,
        parkName: params.parkName,
        displayName: params.self.displayName,
        displayPhone: params.self.displayPhone,
        role: params.self.role,
        status: "active",
        joinedAt: new Date().toISOString(),
        isSelf: true,
        source: "seed",
      });
    }
    return listMembersByEnterprise(params.enterpriseId);
  }

  const now = Date.now();
  const seeds: EnterpriseMember[] = [
    {
      id: `mem-self-${params.enterpriseId}`,
      enterpriseId: params.enterpriseId,
      parkId: params.parkId,
      parkName: params.parkName,
      displayName: params.self?.displayName || "演示用户",
      displayPhone: params.self?.displayPhone || "13800138000",
      role: params.self?.role || "admin",
      status: "active",
      joinedAt: new Date(now - 86400000 * 120).toISOString(),
      isSelf: true,
      source: "seed",
    },
    {
      id: `mem-seed-p-${params.enterpriseId}`,
      enterpriseId: params.enterpriseId,
      parkId: params.parkId,
      parkName: params.parkName,
      displayName: "李采购",
      displayPhone: "13912345678",
      role: "purchaser",
      status: "active",
      joinedAt: new Date(now - 86400000 * 80).toISOString(),
      source: "seed",
    },
    {
      id: `mem-seed-f-${params.enterpriseId}`,
      enterpriseId: params.enterpriseId,
      parkId: params.parkId,
      parkName: params.parkName,
      displayName: "王财务",
      displayPhone: "13787654321",
      role: "finance",
      status: "active",
      joinedAt: new Date(now - 86400000 * 60).toISOString(),
      source: "seed",
    },
    {
      id: `mem-seed-l-${params.enterpriseId}`,
      enterpriseId: params.enterpriseId,
      parkId: params.parkId,
      parkName: params.parkName,
      displayName: "赵法务",
      displayPhone: "13611223344",
      role: "legal",
      status: "active",
      joinedAt: new Date(now - 86400000 * 40).toISOString(),
      source: "seed",
    },
    {
      id: `mem-seed-v-${params.enterpriseId}`,
      enterpriseId: params.enterpriseId,
      parkId: params.parkId,
      parkName: params.parkName,
      displayName: "陈同事",
      displayPhone: "13555667788",
      role: "viewer",
      status: "active",
      joinedAt: new Date(now - 86400000 * 15).toISOString(),
      source: "invite",
    },
  ];
  writeAll([...seeds, ...readAll().filter((m) => m.enterpriseId !== params.enterpriseId)]);
  return seeds;
}

export function inviteMember(input: {
  enterpriseId: string;
  parkId: string;
  parkName: string;
  displayName: string;
  displayPhone: string;
  role: EnterpriseRole;
}) {
  const phone = input.displayPhone.replace(/\s/g, "");
  if (!/^1\d{10}$/.test(phone)) {
    return { ok: false as const, error: "请输入正确的 11 位手机号" };
  }
  if (!input.displayName.trim()) {
    return { ok: false as const, error: "请填写成员姓名" };
  }
  const dup = listMembersByEnterprise(input.enterpriseId).find(
    (m) => m.displayPhone === phone && m.status !== "disabled",
  );
  if (dup) return { ok: false as const, error: "该手机号已是企业成员" };

  const member = upsertMember({
    id: `mem-invite-${Date.now()}`,
    enterpriseId: input.enterpriseId,
    parkId: input.parkId,
    parkName: input.parkName,
    displayName: input.displayName.trim(),
    displayPhone: phone,
    role: input.role,
    status: "pending",
    joinedAt: new Date().toISOString(),
    source: "invite",
  });
  return { ok: true as const, member };
}
