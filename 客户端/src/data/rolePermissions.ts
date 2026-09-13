import type { EnterpriseRole } from "../types/auth";
import { ROLE_LABELS } from "../types/auth";

export type PermissionKey =
  | "archive_view"
  | "archive_edit"
  | "member_view"
  | "member_manage"
  | "join_review"
  | "role_manage"
  | "procurement"
  | "finance"
  | "services"
  | "demand"
  | "map"
  | "news";

export type PermissionDef = {
  key: PermissionKey;
  label: string;
  group: string;
  desc: string;
};

export const PERMISSIONS: PermissionDef[] = [
  { key: "archive_view", label: "查看企业档案", group: "企业档案", desc: "查看入驻主体与资质信息" },
  { key: "archive_edit", label: "变更企业档案", group: "企业档案", desc: "发起档案变更并提交审核" },
  { key: "member_view", label: "查看成员", group: "系统设置", desc: "查看企业成员列表" },
  { key: "member_manage", label: "管理成员", group: "系统设置", desc: "邀请、调整角色、移除成员" },
  { key: "join_review", label: "加入审核", group: "系统设置", desc: "审批他人加入本企业的申请" },
  { key: "role_manage", label: "角色配置", group: "系统设置", desc: "调整角色权限矩阵" },
  { key: "procurement", label: "集采交易", group: "业务模块", desc: "下单、询价、协议采购" },
  { key: "finance", label: "金融服务", group: "业务模块", desc: "融资申请与对账" },
  { key: "services", label: "企业服务", group: "业务模块", desc: "下单严选服务" },
  { key: "demand", label: "供需对接", group: "业务模块", desc: "发布需求 / 报价接单" },
  { key: "map", label: "产业地图", group: "业务模块", desc: "查看园区全景与企业分布" },
  { key: "news", label: "产业资讯", group: "业务模块", desc: "浏览政策与资讯" },
];

export type RoleDef = {
  id: EnterpriseRole;
  label: string;
  summary: string;
  permissions: PermissionKey[];
  system: boolean;
};

const DEFAULT_ROLES: RoleDef[] = [
  {
    id: "admin",
    label: ROLE_LABELS.admin,
    summary: "企业最高管理权限，可审批加入、配置角色与变更档案",
    system: true,
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    id: "purchaser",
    label: ROLE_LABELS.purchaser,
    summary: "负责集采下单与询价，可查看档案与成员",
    system: true,
    permissions: ["archive_view", "member_view", "procurement", "map", "news", "demand"],
  },
  {
    id: "finance",
    label: ROLE_LABELS.finance,
    summary: "负责融资申请、对账与资金相关操作",
    system: true,
    permissions: ["archive_view", "member_view", "finance", "map", "news"],
  },
  {
    id: "legal",
    label: ROLE_LABELS.legal,
    summary: "关注合同与合规，可查看档案与业务单据",
    system: true,
    permissions: ["archive_view", "member_view", "procurement", "services", "map", "news"],
  },
  {
    id: "viewer",
    label: ROLE_LABELS.viewer,
    summary: "只读成员，可浏览地图与资讯，不可管理配置",
    system: true,
    permissions: ["archive_view", "member_view", "map", "news"],
  },
];

const ROLE_STORE_KEY = "park-client-role-permissions";

function readOverrides(): Partial<Record<EnterpriseRole, PermissionKey[]>> {
  try {
    const raw = localStorage.getItem(ROLE_STORE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<EnterpriseRole, PermissionKey[]>>;
  } catch {
    return {};
  }
}

export function getRoleDefs(): RoleDef[] {
  const overrides = readOverrides();
  return DEFAULT_ROLES.map((role) => ({
    ...role,
    permissions: overrides[role.id] ?? role.permissions,
  }));
}

export function getRoleDef(id: EnterpriseRole): RoleDef {
  return getRoleDefs().find((r) => r.id === id) ?? DEFAULT_ROLES[DEFAULT_ROLES.length - 1];
}

export function roleHasPermission(role: EnterpriseRole, key: PermissionKey) {
  return getRoleDef(role).permissions.includes(key);
}

export function setRolePermissions(roleId: EnterpriseRole, permissions: PermissionKey[]) {
  if (roleId === "admin") {
    // 管理员始终全权限
    const next = { ...readOverrides() };
    delete next.admin;
    localStorage.setItem(ROLE_STORE_KEY, JSON.stringify(next));
    return getRoleDefs();
  }
  const next = { ...readOverrides(), [roleId]: permissions };
  localStorage.setItem(ROLE_STORE_KEY, JSON.stringify(next));
  return getRoleDefs();
}

export function resetRolePermissions() {
  localStorage.removeItem(ROLE_STORE_KEY);
  return getRoleDefs();
}

export function permissionGroups() {
  const groups: { name: string; items: PermissionDef[] }[] = [];
  for (const p of PERMISSIONS) {
    const g = groups.find((x) => x.name === p.group);
    if (g) g.items.push(p);
    else groups.push({ name: p.group, items: [p] });
  }
  return groups;
}
