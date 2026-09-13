export type EnterpriseRole =
  | "admin"
  | "purchaser"
  | "finance"
  | "legal"
  | "viewer";

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type MembershipStatus = "active" | "pending";

export interface User {
  id: string;
  phone: string;
  createdAt: string;
  /** 登录密码（演示本地存储） */
  password?: string;
  hasPassword?: boolean;
  /** 用户显示名称（账号级，非企业侧经办人） */
  name?: string;
  /**
   * 注册园区：客户端自助开通时按当前部署/URL 所属园区写入，之后只读不覆盖。
   * 演示取 data.parkName（临港智造园）。
   */
  registeredParkName?: string;
  registeredParkId?: string;
}

export interface EnterpriseParkRef {
  id: string;
  name: string;
}

export interface Enterprise {
  id: string;
  name: string;
  uscc: string;
  industry: string;
  /** 主园区（兼容旧数据） */
  parkId: string;
  parkName: string;
  /** 入驻园区列表；缺省时回退到 parkId/parkName */
  parks?: EnterpriseParkRef[];
  contactName: string;
  contactPhone: string;
  status: "approved" | "pending";
}

export interface Membership {
  id: string;
  userId: string;
  enterpriseId: string;
  /** 入驻园区；同一企业在不同园区入驻为多条成员关系 */
  parkId: string;
  role: EnterpriseRole;
  displayName: string;
  displayPhone: string;
  status: MembershipStatus;
  joinedAt: string;
}

export interface EnterpriseApplication {
  id: string;
  type: "create" | "invite" | "join" | "archive";
  userId: string;
  enterpriseId?: string;
  enterpriseName: string;
  uscc?: string;
  industry?: string;
  inviteCode?: string;
  role?: EnterpriseRole;
  displayName: string;
  displayPhone: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  materialsNote?: string;
  parkId?: string;
  parkName?: string;
  customerType?: string;
  idType?: string;
  certValidUntil?: string;
  establishedAt?: string;
  registeredCapital?: string;
  registeredAddress?: string;
  enterpriseNature?: string;
  enterpriseScale?: string;
  mainProducts?: string;
  businessDescription?: string;
  address?: string;
  lat?: number;
  lng?: number;
  upstreamCategories?: string;
  downstreamCategories?: string;
  industryChainL1?: string;
  industryChainL2?: string;
  industryChainL3?: string;
  chainSegments?: string[];
  enterpriseTags?: string[];
  faceVerified?: boolean;
  eSigned?: boolean;
  /** 主体简介（入驻表单 intro） */
  intro?: string;
  /** 资质上传文件名 slotId → fileName */
  uploads?: Record<string, string>;
  /** 资质预览 dataURL / file: 标记 */
  uploadPreviews?: Record<string, string>;
  status: ApplicationStatus;
  duplicateHint?: boolean;
  createdAt: string;
  reviewNote?: string;
}

/** 创建企业 / 邀请码入驻共用提交字段 */
export type EnterpriseOnboardPayload = {
  enterpriseName: string;
  uscc: string;
  industry: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  displayName: string;
  materialsNote: string;
  parkId: string;
  customerType?: string;
  idType?: string;
  certValidUntil?: string;
  establishedAt?: string;
  registeredCapital?: string;
  registeredAddress?: string;
  enterpriseNature?: string;
  enterpriseScale?: string;
  businessDescription?: string;
  mainProducts?: string;
  address?: string;
  lat?: number;
  lng?: number;
  upstreamCategories?: string;
  downstreamCategories?: string;
  industryChainL1?: string;
  industryChainL2?: string;
  industryChainL3?: string;
  chainSegments?: string[];
  enterpriseTags?: string[];
  faceVerified?: boolean;
  eSigned?: boolean;
  intro?: string;
  uploads?: Record<string, string>;
  uploadPreviews?: Record<string, string>;
  inviteCode?: string;
};

export interface InviteCodeRecord {
  code: string;
  enterpriseName: string;
  uscc: string;
  industry: string;
  parkId: string;
  parkName: string;
  expired: boolean;
}

export type DemoPersona =
  | "personal"
  | "create"
  | "invite"
  | "join"
  | "pending"
  | "rejected"
  | "approved"
  | "multi";

export function applicationResubmitPath(app: EnterpriseApplication) {
  if (app.status !== "rejected") return null;
  const q = `applicationId=${encodeURIComponent(app.id)}`;
  switch (app.type) {
    case "create":
      return `/onboarding/create?${q}`;
    case "invite": {
      const code = app.inviteCode ? `&inviteCode=${encodeURIComponent(app.inviteCode)}` : "";
      return `/onboarding/create?${q}${code}`;
    }
    case "archive":
      return `/onboarding/create?mode=archive&${q}`;
    case "join":
      return `/onboarding/join?${q}`;
    default:
      return null;
  }
}

export function pathForDemoPersona(kind: DemoPersona | null | undefined) {
  switch (kind) {
    case "personal":
      return "/onboarding";
    case "create":
      return "/onboarding/create";
    case "invite":
      return "/onboarding/invite";
    case "join":
      return "/onboarding/join";
    case "pending":
    case "rejected":
      return "/onboarding/status";
    case "approved":
    case "multi":
      return "/";
    default:
      return null;
  }
}

export type ArchiveChangeStatus = "none" | "reviewing" | "need_supplement";

export interface AuthSnapshot {
  user: User | null;
  /** false 表示已退出但仍保留本地账号数据，支持密码再次登录 */
  loggedIn?: boolean;
  memberships: Membership[];
  applications: EnterpriseApplication[];
  activeEnterpriseId: string | null;
  customEnterprises: Enterprise[];
  selectedParkId: string | null;
  demoPersona?: DemoPersona | null;
  /** 已通过企业的档案变更审核态（演示） */
  archiveChangeStatus?: ArchiveChangeStatus;
}

export const ROLE_LABELS: Record<EnterpriseRole, string> = {
  admin: "企业管理员",
  purchaser: "采购员",
  finance: "财务",
  legal: "法务",
  viewer: "普通成员",
};
