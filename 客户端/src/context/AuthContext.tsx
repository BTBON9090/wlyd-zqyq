import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildEnterpriseContexts,
  createApplication,
  createMembership,
  DEMO_PASSWORD,
  findEnterpriseByUscc,
  getEnterpriseById,
  getEnterpriseParks,
  MOCK_OTP,
  validateInviteCode,
} from "../data/enterprises";
import { isPasswordValid } from "../data/password";
import { demoEnterpriseUploads } from "../data/onboarding";
import { getParkById, parks } from "../data/parks";
import { parkName as DEPLOYMENT_PARK_NAME } from "../data";
import {
  addJoinGrant,
  consumeJoinGrantsForUser,
  loadJoinInbox,
  upsertJoinInbox,
} from "../data/joinInbox";
import { roleHasPermission } from "../data/rolePermissions";
import { registerPhoneOnPlatform } from "../data/platformAccounts";
import { supplierDemoAccountForPhone, supplierDemoPresetForPhone } from "../data/supplierDemoAccounts";
import type {
  ArchiveChangeStatus,
  AuthSnapshot,
  DemoPersona,
  Enterprise,
  EnterpriseApplication,
  EnterpriseOnboardPayload,
  EnterpriseRole,
  Membership,
  User,
} from "../types/auth";
import type { Park } from "../data/parks";

const STORAGE_KEY = "park-client-auth";

/** 当前客户端 URL/部署所属园区（演示：data.parkName → parks 中同名项） */
function deploymentRegisteredPark(): { id: string; name: string } {
  const matched = parks.find((p) => p.name === DEPLOYMENT_PARK_NAME) ?? parks[0];
  return { id: matched.id, name: matched.name };
}

/** 自助开通时写入注册园区；已有值不覆盖 */
function withRegisteredPark(user: User): User {
  if (user.registeredParkName) return user;
  const park = deploymentRegisteredPark();
  return {
    ...user,
    registeredParkName: park.name,
    registeredParkId: user.registeredParkId || park.id,
  };
}

const emptySnapshot = (): AuthSnapshot => ({
  user: null,
  loggedIn: false,
  memberships: [],
  applications: [],
  activeEnterpriseId: null,
  customEnterprises: [],
  selectedParkId: null,
  demoPersona: null,
  archiveChangeStatus: "none",
});

function withAutoPark(snapshot: AuthSnapshot): AuthSnapshot {
  const current = getParkById(snapshot.selectedParkId);
  if (current) return snapshot;
  if (parks.length === 1) {
    return { ...snapshot, selectedParkId: parks[0].id };
  }
  return { ...snapshot, selectedParkId: null };
}

function applyJoinGrants(snapshot: AuthSnapshot): AuthSnapshot {
  if (!snapshot.user) return snapshot;
  const grants = consumeJoinGrantsForUser(snapshot.user.id, snapshot.user.phone);
  if (!grants.length) return snapshot;

  let memberships = [...snapshot.memberships];
  let applications = [...snapshot.applications];
  let activeEnterpriseId = snapshot.activeEnterpriseId;
  let selectedParkId = snapshot.selectedParkId;

  for (const grant of grants) {
    const already = memberships.some(
      (m) =>
        m.enterpriseId === grant.enterpriseId &&
        m.status === "active" &&
        (!m.parkId || m.parkId === grant.parkId),
    );
    if (!already) {
      memberships.push(
        createMembership({
          userId: snapshot.user.id,
          enterpriseId: grant.enterpriseId,
          parkId: grant.parkId,
          role: grant.role,
          displayName: grant.displayName,
          displayPhone: grant.displayPhone,
          status: "active",
        }),
      );
    }
    applications = applications.map((a) =>
      a.id === grant.applicationId
        ? {
            ...a,
            status: "approved" as const,
            reviewNote: a.reviewNote || "企业管理员已通过加入申请",
          }
        : a,
    );
    if (!activeEnterpriseId) {
      activeEnterpriseId = grant.enterpriseId;
      selectedParkId = grant.parkId || selectedParkId;
    }
  }

  return { ...snapshot, memberships, applications, activeEnterpriseId, selectedParkId };
}

function onboardApplicationFields(payload: EnterpriseOnboardPayload) {
  return {
    enterpriseName: payload.enterpriseName.trim(),
    uscc: payload.uscc.trim().toUpperCase(),
    industry: payload.industry,
    contactName: payload.contactName,
    contactPhone: payload.contactPhone,
    contactEmail: payload.contactEmail,
    displayName: payload.displayName,
    materialsNote: payload.materialsNote,
    customerType: payload.customerType,
    idType: payload.idType,
    certValidUntil: payload.certValidUntil,
    establishedAt: payload.establishedAt,
    registeredCapital: payload.registeredCapital,
    registeredAddress: payload.registeredAddress,
    enterpriseNature: payload.enterpriseNature,
    enterpriseScale: payload.enterpriseScale,
    businessDescription: payload.businessDescription,
    mainProducts: payload.businessDescription ?? payload.mainProducts,
    address: payload.address,
    lat: payload.lat,
    lng: payload.lng,
    upstreamCategories: payload.upstreamCategories,
    downstreamCategories: payload.downstreamCategories,
    industryChainL1: payload.industryChainL1,
    industryChainL2: payload.industryChainL2,
    industryChainL3: payload.industryChainL3,
    chainSegments: payload.chainSegments,
    enterpriseTags: payload.enterpriseTags,
    faceVerified: payload.faceVerified,
    eSigned: payload.eSigned,
    intro: payload.intro,
    uploads: payload.uploads,
    uploadPreviews: payload.uploadPreviews,
    inviteCode: payload.inviteCode,
  };
}

function loadSnapshot(): AuthSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return withAutoPark(emptySnapshot());
    const parsed = JSON.parse(raw) as AuthSnapshot;
    const user = parsed.user
      ? {
          ...parsed.user,
          name: parsed.user.name?.trim() || "演示用户",
          hasPassword: !!(parsed.user.password || parsed.user.hasPassword),
        }
      : null;
    const customEnterprises = parsed.customEnterprises ?? [];
    const memberships = (parsed.memberships ?? []).map((m) => {
      const displayName = m.displayName?.trim() || user?.name || "演示用户";
      if (m.parkId) return { ...m, displayName };
      const enterprise = getEnterpriseById(m.enterpriseId, customEnterprises);
      return {
        ...m,
        displayName,
        parkId: enterprise?.parkId || "park-sh-lg",
      };
    });
    const loggedIn = !!user && parsed.loggedIn === true;
    return applyJoinGrants(
      withAutoPark({
        ...emptySnapshot(),
        ...parsed,
        user,
        loggedIn,
        memberships,
        applications: parsed.applications ?? [],
        customEnterprises,
        selectedParkId: parsed.selectedParkId ?? null,
        demoPersona: parsed.demoPersona ?? null,
        archiveChangeStatus: parsed.archiveChangeStatus ?? "none",
      }),
    );
  } catch {
    return withAutoPark(emptySnapshot());
  }
}

function saveSnapshot(snapshot: AuthSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

type LoginResult =
  | { ok: true; hasActiveEnterprise?: boolean; hasPendingApplications?: boolean }
  | { ok: false; error: string };

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  memberships: Membership[];
  applications: EnterpriseApplication[];
  activeEnterpriseId: string | null;
  activeMembership: Membership | null;
  activeEnterprise: Enterprise | null;
  /** 按「园区 + 企业」展开的入驻上下文 */
  approvedContexts: ReturnType<typeof buildEnterpriseContexts>;
  approvedEnterprises: { membership: Membership; enterprise: Enterprise }[];
  hasActiveEnterprise: boolean;
  pendingApplications: EnterpriseApplication[];
  customEnterprises: Enterprise[];
  selectedParkId: string | null;
  selectedPark: Park | null;
  parkCatalog: Park[];
  needsParkSelection: boolean;
  login: (phone: string, otp: string) => LoginResult;
  passwordLogin: (phone: string, password: string) => LoginResult;
  resetPassword: (
    phone: string,
    smsCode: string,
    nextPwd: string,
  ) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  sendOtp: (phone: string) => LoginResult;
  selectPark: (parkId: string) => void;
  /** @deprecated 请用 switchEnterpriseContext，同时切换园区与企业 */
  switchEnterprise: (enterpriseId: string) => void;
  /** 切换入驻上下文：园区 + 企业 */
  switchEnterpriseContext: (enterpriseId: string, parkId: string) => void;
  submitCreateEnterprise: (payload: EnterpriseOnboardPayload) => {
    ok: boolean;
    duplicate?: boolean;
    application?: EnterpriseApplication;
  };
  submitInviteEnterprise: (payload: EnterpriseOnboardPayload) => {
    ok: boolean;
    duplicate?: boolean;
    error?: string;
    application?: EnterpriseApplication;
  };
  submitJoinEnterprise: (payload: {
    enterpriseId: string;
    displayName: string;
    displayPhone: string;
    role: EnterpriseRole;
    parkId: string;
  }) => { ok: boolean; application?: EnterpriseApplication; error?: string };
  resubmitApplication: (
    applicationId: string,
    updates: Partial<Omit<EnterpriseApplication, "id" | "userId" | "type" | "status">>,
  ) => { ok: boolean; duplicate?: boolean; error?: string; application?: EnterpriseApplication };
  simulateApproveApplication: (applicationId: string) => void;
  reviewJoinApplication: (
    applicationId: string,
    decision: "approve" | "reject",
    note?: string,
  ) => { ok: true } | { ok: false; error: string };
  /** 同步成员花名册角色到 Auth 会员（同手机号） */
  syncMembershipFromRoster: (req: {
    enterpriseId: string;
    displayPhone: string;
    role?: EnterpriseRole;
    remove?: boolean;
    parkId?: string;
  }) => void;
  incomingJoinRequests: EnterpriseApplication[];
  demoPersona: DemoPersona | null;
  applyDemoState: (kind: DemoPersona, opts?: { phone?: string; userName?: string }) => string;
  loginFromSupplierPortal: (phone: string) => void;
  archiveChangeStatus: ArchiveChangeStatus;
  changePhone: (req: {
    newPhone: string;
    via: "old_sms" | "password";
    oldSmsCode?: string;
    password?: string;
    newSmsCode: string;
  }) => { ok: true } | { ok: false; error: string };
  changePassword: (req: {
    nextPwd: string;
    confirm: string;
    via: "set" | "old";
    oldPwd?: string;
  }) => { ok: true } | { ok: false; error: string };
  /** @deprecated 使用 changePassword */
  setPassword: (password: string, confirm: string) => { ok: true } | { ok: false; error: string };
  deleteAccount: () => void;
  leaveEnterprise: (enterpriseId?: string) => { ok: true } | { ok: false; error: string };
  deregisterEnterprise: (enterpriseId?: string) => { ok: true } | { ok: false; error: string };
  submitArchiveChange: (
    payload: EnterpriseOnboardPayload,
  ) => { ok: true; application: EnterpriseApplication } | { ok: false; error: string };
  clearArchiveChange: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AuthSnapshot>(loadSnapshot);

  const persist = useCallback((next: AuthSnapshot) => {
    setSnapshot(next);
    saveSnapshot(next);
  }, []);

  const sendOtp = useCallback((_phone: string): LoginResult => {
    const phone = _phone.replace(/\s/g, "");
    if (!/^1\d{10}$/.test(phone)) {
      return { ok: false, error: "请输入正确的 11 位手机号" };
    }
    return { ok: true };
  }, []);

  const login = useCallback(
    (phone: string, otp: string): LoginResult => {
      const normalizedPhone = phone.replace(/\s/g, "");
      if (!/^1\d{10}$/.test(normalizedPhone)) {
        return { ok: false, error: "请输入正确的 11 位手机号" };
      }
      if (otp !== MOCK_OTP) {
        return { ok: false, error: `验证码不正确，请填 ${MOCK_OTP}` };
      }

      const demoAccount = supplierDemoAccountForPhone(normalizedPhone);
      const samePhone = snapshot.user?.phone === normalizedPhone;
      const user: User = withRegisteredPark(
        samePhone
          ? {
              ...snapshot.user!,
              name: snapshot.user!.name?.trim() || demoAccount?.userName || "演示用户",
              hasPassword: !!(snapshot.user!.password || snapshot.user!.hasPassword),
            }
          : {
              id: `user-${normalizedPhone}`,
              phone: normalizedPhone,
              createdAt: new Date().toISOString(),
              name: demoAccount?.userName ?? `用户${normalizedPhone.slice(-4)}`,
            },
      );

      const next = applyJoinGrants(
        withAutoPark(
          samePhone
            ? { ...snapshot, user, loggedIn: true }
            : { ...emptySnapshot(), user, loggedIn: true },
        ),
      );
      persist(next);
      registerPhoneOnPlatform(normalizedPhone);
      return {
        ok: true,
        hasActiveEnterprise: next.memberships.some((m) => m.status === "active"),
        hasPendingApplications: next.applications.some((a) => a.status === "pending"),
      };
    },
    [persist, snapshot],
  );

  const passwordLogin = useCallback(
    (phone: string, password: string): LoginResult => {
      const normalizedPhone = phone.replace(/\s/g, "");
      if (!/^1\d{10}$/.test(normalizedPhone)) {
        return { ok: false, error: "请输入正确的 11 位手机号" };
      }
      if (!password) return { ok: false, error: "请输入登录密码" };

      const saved = snapshot.user;
      if (!saved || saved.phone !== normalizedPhone) {
        return { ok: false, error: "账号不存在或未设置密码，请先用验证码登录并设置密码" };
      }
      const pwd = saved.password || "";
      if (!pwd && !saved.hasPassword) {
        return { ok: false, error: "该账号尚未设置密码，请先用验证码登录后设置" };
      }
      if (pwd && password !== pwd) {
        return { ok: false, error: "手机号或密码不正确" };
      }
      // 兼容旧数据仅有 hasPassword、无明文密码：演示密码可用
      if (!pwd && saved.hasPassword && password !== DEMO_PASSWORD) {
        return { ok: false, error: "手机号或密码不正确" };
      }

      const next = applyJoinGrants(
        withAutoPark({
          ...snapshot,
          loggedIn: true,
          user: {
            ...saved,
            password: pwd || DEMO_PASSWORD,
            hasPassword: true,
          },
        }),
      );
      persist(next);
      registerPhoneOnPlatform(normalizedPhone);
      return {
        ok: true,
        hasActiveEnterprise: next.memberships.some((m) => m.status === "active"),
        hasPendingApplications: next.applications.some((a) => a.status === "pending"),
      };
    },
    [persist, snapshot],
  );

  const resetPassword = useCallback(
    (phone: string, smsCode: string, nextPwd: string) => {
      const normalizedPhone = phone.replace(/\s/g, "");
      if (!/^1\d{10}$/.test(normalizedPhone)) {
        return { ok: false as const, error: "请输入正确的 11 位手机号" };
      }
      if (smsCode !== MOCK_OTP) {
        return { ok: false as const, error: `验证码不正确，请填 ${MOCK_OTP}` };
      }
      if (!isPasswordValid(nextPwd)) {
        return { ok: false as const, error: "新密码需至少 8 位，且包含字母和数字" };
      }

      if (snapshot.user && snapshot.user.phone === normalizedPhone) {
        persist({
          ...snapshot,
          loggedIn: false,
          user: {
            ...snapshot.user,
            password: nextPwd,
            hasPassword: true,
          },
        });
        return { ok: true as const };
      }

      persist({
        ...emptySnapshot(),
        loggedIn: false,
        user: withRegisteredPark({
          id: `user-${normalizedPhone}`,
          phone: normalizedPhone,
          createdAt: new Date().toISOString(),
          name: `用户${normalizedPhone.slice(-4)}`,
          password: nextPwd,
          hasPassword: true,
        }),
      });
      return { ok: true as const };
    },
    [persist, snapshot],
  );

  const logout = useCallback(() => {
    if (!snapshot.user) {
      persist(withAutoPark(emptySnapshot()));
      return;
    }
    persist({ ...snapshot, loggedIn: false });
  }, [persist, snapshot]);

  const selectPark = useCallback(
    (parkId: string) => {
      if (!getParkById(parkId)) return;
      if (snapshot.selectedParkId === parkId) return;
      persist({ ...snapshot, selectedParkId: parkId });
    },
    [persist, snapshot],
  );

  const switchEnterpriseContext = useCallback(
    (enterpriseId: string, parkId: string) => {
      if (!snapshot.user) return;
      const membership = snapshot.memberships.find(
        (m) =>
          m.enterpriseId === enterpriseId &&
          m.status === "active" &&
          (!m.parkId || m.parkId === parkId),
      );
      if (!membership) return;
      if (!getParkById(parkId)) return;
      persist({
        ...snapshot,
        activeEnterpriseId: enterpriseId,
        selectedParkId: parkId,
      });
    },
    [persist, snapshot],
  );

  const switchEnterprise = useCallback(
    (enterpriseId: string) => {
      if (!snapshot.user) return;
      const membership = snapshot.memberships.find(
        (m) => m.enterpriseId === enterpriseId && m.status === "active",
      );
      if (!membership) return;
      const enterprise = getEnterpriseById(enterpriseId, snapshot.customEnterprises);
      const parkId = membership.parkId || enterprise?.parkId;
      if (!parkId) return;
      switchEnterpriseContext(enterpriseId, parkId);
    },
    [snapshot, switchEnterpriseContext],
  );

  const submitCreateEnterprise = useCallback(
    (payload: EnterpriseOnboardPayload) => {
      if (!snapshot.user) return { ok: false };
      const park = getParkById(payload.parkId);
      if (!park) return { ok: false };
      const uscc = payload.uscc.trim().toUpperCase();
      const existing =
        payload.customerType === "person"
          ? undefined
          : findEnterpriseByUscc(uscc, snapshot.customEnterprises);
      const application = createApplication({
        type: "create",
        userId: snapshot.user.id,
        displayPhone: snapshot.user.phone,
        duplicateHint: !!existing,
        enterpriseId: existing?.id,
        parkId: existing?.parkId ?? park.id,
        parkName: existing?.parkName ?? park.name,
        ...onboardApplicationFields(payload),
      });
      persist({
        ...snapshot,
        selectedParkId: park.id,
        applications: [application, ...snapshot.applications],
      });
      return { ok: true, duplicate: !!existing, application };
    },
    [persist, snapshot],
  );

  const submitInviteEnterprise = useCallback(
    (payload: EnterpriseOnboardPayload) => {
      if (!snapshot.user) return { ok: false };
      const inviteCode = payload.inviteCode?.trim().toUpperCase() ?? "";
      const check = validateInviteCode(inviteCode);
      if (!check.ok) return { ok: false, error: check.error };

      const invitePark = getParkById(check.record.parkId);
      const park = invitePark ?? getParkById(payload.parkId);
      if (!park) return { ok: false, error: "未能定位邀请码对应园区" };

      const uscc = payload.uscc.trim().toUpperCase();
      const existing =
        payload.customerType === "person" || !uscc
          ? undefined
          : findEnterpriseByUscc(uscc, snapshot.customEnterprises);
      const application = createApplication({
        type: "invite",
        userId: snapshot.user.id,
        displayPhone: snapshot.user.phone,
        duplicateHint: !!existing,
        enterpriseId: existing?.id,
        parkId: existing?.parkId || park.id,
        parkName: existing?.parkName || park.name,
        ...onboardApplicationFields({ ...payload, inviteCode: check.record.code }),
      });
      persist({
        ...snapshot,
        selectedParkId: park.id,
        applications: [application, ...snapshot.applications],
      });
      return { ok: true, duplicate: !!existing, application };
    },
    [persist, snapshot],
  );

  const submitJoinEnterprise = useCallback(
    (payload: {
      enterpriseId: string;
      displayName: string;
      displayPhone: string;
      role: EnterpriseRole;
      parkId: string;
    }) => {
      if (!snapshot.user) return { ok: false, error: "未登录" };
      if (payload.role === "admin") {
        return { ok: false, error: "加入申请不可选择管理员角色，请选择其他角色" };
      }
      const enterprise = getEnterpriseById(payload.enterpriseId, snapshot.customEnterprises);
      if (!enterprise) return { ok: false, error: "企业不存在" };
      const parks = getEnterpriseParks(enterprise);
      const inPark =
        enterprise.parkId === payload.parkId || parks.some((p) => p.id === payload.parkId);
      if (!inPark) return { ok: false, error: "所选企业不在当前园区" };
      const park = getParkById(payload.parkId);

      const alreadyMember = snapshot.memberships.some(
        (m) =>
          m.enterpriseId === payload.enterpriseId &&
          (m.status === "active" || m.status === "pending") &&
          (!m.parkId || m.parkId === payload.parkId),
      );
      if (alreadyMember) return { ok: false, error: "您已是该企业成员或已有待审申请" };

      const application = createApplication({
        type: "join",
        userId: snapshot.user.id,
        enterpriseId: enterprise.id,
        enterpriseName: enterprise.name,
        uscc: enterprise.uscc,
        role: payload.role,
        displayName: payload.displayName,
        displayPhone: payload.displayPhone,
        parkId: payload.parkId,
        parkName: park?.name || enterprise.parkName,
      });
      upsertJoinInbox(application);
      persist({
        ...snapshot,
        selectedParkId: payload.parkId,
        applications: [application, ...snapshot.applications],
      });
      return { ok: true, application };
    },
    [persist, snapshot],
  );

  const resubmitApplication = useCallback(
    (
      applicationId: string,
      updates: Partial<Omit<EnterpriseApplication, "id" | "userId" | "type" | "status">>,
    ) => {
      if (!snapshot.user) return { ok: false, error: "未登录" };
      const app = snapshot.applications.find((a) => a.id === applicationId);
      if (!app) return { ok: false, error: "申请不存在" };
      if (app.status !== "rejected") return { ok: false, error: "仅驳回的申请可修改重新提交" };

      if (app.type === "join" && updates.role === "admin") {
        return { ok: false, error: "加入申请不可选择管理员角色" };
      }

      if (app.type === "join" && updates.enterpriseId) {
        const alreadyMember = snapshot.memberships.some(
          (m) =>
            m.enterpriseId === updates.enterpriseId &&
            (m.status === "active" || m.status === "pending"),
        );
        if (alreadyMember) return { ok: false, error: "您已是该企业成员或已有待审申请" };
      }

      const uscc = updates.uscc?.trim().toUpperCase() ?? app.uscc;
      const existing =
        app.type !== "join" &&
        uscc &&
        (updates.customerType ?? app.customerType) !== "person"
          ? findEnterpriseByUscc(uscc, snapshot.customEnterprises)
          : undefined;

      const next: EnterpriseApplication = {
        ...app,
        ...updates,
        uscc: uscc || app.uscc,
        status: "pending",
        reviewNote: undefined,
        duplicateHint: app.type === "join" ? app.duplicateHint : !!existing,
        enterpriseId: app.type === "join" ? updates.enterpriseId ?? app.enterpriseId : existing?.id ?? app.enterpriseId,
        createdAt: new Date().toISOString(),
      };

      persist({
        ...snapshot,
        selectedParkId: updates.parkId ?? app.parkId ?? snapshot.selectedParkId,
        applications: snapshot.applications.map((a) => (a.id === applicationId ? next : a)),
        archiveChangeStatus: app.type === "archive" ? "reviewing" : snapshot.archiveChangeStatus,
      });
      if (next.type === "join") upsertJoinInbox(next);
      return { ok: true, duplicate: next.duplicateHint, application: next };
    },
    [persist, snapshot],
  );

  const reviewJoinApplication = useCallback(
    (applicationId: string, decision: "approve" | "reject", note?: string) => {
      if (!snapshot.user) return { ok: false as const, error: "未登录" };
      const fromLocal = snapshot.applications.find((a) => a.id === applicationId);
      const fromInbox = loadJoinInbox().find((a) => a.id === applicationId);
      const app = fromInbox ?? fromLocal;
      if (!app || app.type !== "join" || app.status !== "pending") {
        return { ok: false as const, error: "申请不存在或已处理" };
      }
      if (!app.enterpriseId) return { ok: false as const, error: "申请未关联企业" };

      const canReview = snapshot.memberships.some(
        (m) =>
          m.enterpriseId === app.enterpriseId &&
          m.status === "active" &&
          roleHasPermission(m.role, "join_review"),
      );
      if (!canReview) return { ok: false as const, error: "当前角色无加入审核权限" };

      const approved = decision === "approve";
      const nextApp: EnterpriseApplication = {
        ...app,
        status: approved ? "approved" : "rejected",
        reviewNote: approved
          ? note || "企业管理员已通过加入申请"
          : note || "企业管理员已拒绝加入申请",
      };
      upsertJoinInbox(nextApp);

      let memberships = snapshot.memberships;
      let activeEnterpriseId = snapshot.activeEnterpriseId;
      let selectedParkId = snapshot.selectedParkId;
      const settleParkId = app.parkId || snapshot.selectedParkId || "";

      if (approved) {
        addJoinGrant({
          applicationId: app.id,
          userId: app.userId,
          phone: app.displayPhone,
          enterpriseId: app.enterpriseId,
          parkId: settleParkId,
          role: app.role ?? "viewer",
          displayName: app.displayName,
          displayPhone: app.displayPhone,
        });
        if (app.userId === snapshot.user.id) {
          const already = memberships.some(
            (m) =>
              m.enterpriseId === app.enterpriseId &&
              m.status === "active" &&
              (!m.parkId || m.parkId === settleParkId),
          );
          if (!already) {
            memberships = [
              ...memberships,
              createMembership({
                userId: snapshot.user.id,
                enterpriseId: app.enterpriseId,
                parkId: settleParkId,
                role: app.role ?? "viewer",
                displayName: app.displayName,
                displayPhone: app.displayPhone,
                status: "active",
              }),
            ];
          }
          if (!activeEnterpriseId) {
            activeEnterpriseId = app.enterpriseId;
            selectedParkId = settleParkId || selectedParkId;
          }
        }
      }

      persist({
        ...snapshot,
        applications: snapshot.applications.some((a) => a.id === applicationId)
          ? snapshot.applications.map((a) => (a.id === applicationId ? nextApp : a))
          : snapshot.applications,
        memberships,
        activeEnterpriseId,
        selectedParkId,
      });
      return { ok: true as const };
    },
    [persist, snapshot],
  );

  const simulateApproveApplication = useCallback(
    (applicationId: string) => {
      if (!snapshot.user) return;
      const app = snapshot.applications.find((a) => a.id === applicationId);
      if (!app || app.status !== "pending") return;
      if (app.type === "join") return;

      // 档案变更：更新企业资料与入驻快照，平台权限保持可用
      if (app.type === "archive") {
        const enterpriseId = app.enterpriseId ?? snapshot.activeEnterpriseId;
        if (!enterpriseId) return;
        const park = getParkById(app.parkId) ?? getParkById(snapshot.selectedParkId);
        let customEnterprises = snapshot.customEnterprises.map((e) =>
          e.id === enterpriseId
            ? {
                ...e,
                name: app.enterpriseName || e.name,
                uscc: app.uscc || e.uscc,
                industry: app.industry || e.industry,
                contactName: app.contactName || e.contactName,
                contactPhone: app.contactPhone || e.contactPhone,
                parkId: park?.id || app.parkId || e.parkId,
                parkName: park?.name || app.parkName || e.parkName,
              }
            : e,
        );
        const inCustom = customEnterprises.some((e) => e.id === enterpriseId);
        if (!inCustom) {
          customEnterprises = [
            ...customEnterprises,
            {
              id: enterpriseId,
              name: app.enterpriseName,
              uscc: app.uscc ?? "",
              industry: app.industry ?? "",
              parkId: park?.id ?? app.parkId ?? "",
              parkName: park?.name ?? app.parkName ?? "",
              parks:
                park || app.parkId
                  ? [{ id: park?.id ?? app.parkId ?? "", name: park?.name ?? app.parkName ?? "" }]
                  : [],
              contactName: app.contactName ?? app.displayName,
              contactPhone: app.contactPhone ?? app.displayPhone,
              status: "approved" as const,
            },
          ];
        }

        const syncedApps = snapshot.applications.map((a) => {
          if (a.id === applicationId) {
            return {
              ...a,
              status: "approved" as const,
              reviewNote: "档案变更审核通过",
            };
          }
          // 同步同源入驻档案，便于企业档案页展示最新内容
          if (
            a.status === "approved" &&
            (a.type === "create" || a.type === "invite") &&
            (a.enterpriseId === enterpriseId || a.enterpriseName === app.enterpriseName)
          ) {
            return {
              ...a,
              enterpriseName: app.enterpriseName,
              uscc: app.uscc ?? a.uscc,
              industry: app.industry ?? a.industry,
              contactName: app.contactName ?? a.contactName,
              contactPhone: app.contactPhone ?? a.contactPhone,
              contactEmail: app.contactEmail ?? a.contactEmail,
              displayName: app.displayName || a.displayName,
              materialsNote: app.materialsNote ?? a.materialsNote,
              parkId: app.parkId ?? a.parkId,
              parkName: app.parkName ?? a.parkName,
              customerType: app.customerType ?? a.customerType,
              idType: app.idType ?? a.idType,
              certValidUntil: app.certValidUntil ?? a.certValidUntil,
              establishedAt: app.establishedAt ?? a.establishedAt,
              registeredCapital: app.registeredCapital ?? a.registeredCapital,
              registeredAddress: app.registeredAddress ?? a.registeredAddress,
              enterpriseNature: app.enterpriseNature ?? a.enterpriseNature,
              enterpriseScale: app.enterpriseScale ?? a.enterpriseScale,
              mainProducts: app.mainProducts ?? a.mainProducts,
              businessDescription: app.businessDescription ?? a.businessDescription,
              address: app.address ?? a.address,
              lat: app.lat ?? a.lat,
              lng: app.lng ?? a.lng,
              upstreamCategories: app.upstreamCategories ?? a.upstreamCategories,
              downstreamCategories: app.downstreamCategories ?? a.downstreamCategories,
              industryChainL1: app.industryChainL1 ?? a.industryChainL1,
              industryChainL2: app.industryChainL2 ?? a.industryChainL2,
              industryChainL3: app.industryChainL3 ?? a.industryChainL3,
              chainSegments: app.chainSegments ?? a.chainSegments,
              enterpriseTags: app.enterpriseTags ?? a.enterpriseTags,
              faceVerified: app.faceVerified ?? a.faceVerified,
              eSigned: app.eSigned ?? a.eSigned,
              intro: app.intro ?? a.intro,
              uploads: app.uploads ?? a.uploads,
              uploadPreviews: app.uploadPreviews ?? a.uploadPreviews,
            };
          }
          return a;
        });

        persist({
          ...snapshot,
          customEnterprises,
          applications: syncedApps,
          selectedParkId: app.parkId || snapshot.selectedParkId,
          archiveChangeStatus: "none",
        });
        return;
      }

      let enterpriseId = app.enterpriseId;
      let customEnterprises = snapshot.customEnterprises;

      if (!enterpriseId && app.uscc) {
        const found = findEnterpriseByUscc(app.uscc, customEnterprises);
        enterpriseId = found?.id;
      }
      if (!enterpriseId && (app.type === "create" || app.type === "invite")) {
        const park = getParkById(app.parkId) ?? getParkById(snapshot.selectedParkId);
        enterpriseId = `ent-new-${Date.now()}`;
        const created: Enterprise = {
          id: enterpriseId,
          name: app.enterpriseName,
          uscc: app.uscc ?? "",
          industry: app.industry ?? "",
          parkId: park?.id ?? app.parkId ?? "",
          parkName: park?.name ?? app.parkName ?? "",
          parks:
            park || app.parkId
              ? [
                  {
                    id: park?.id ?? app.parkId ?? "",
                    name: park?.name ?? app.parkName ?? "",
                  },
                ]
              : [],
          contactName: app.contactName ?? app.displayName,
          contactPhone: app.contactPhone ?? app.displayPhone,
          status: "approved",
        };
        customEnterprises = [...customEnterprises, created];
      }
      if (!enterpriseId) return;

      const settleParkId = app.parkId ?? getParkById(snapshot.selectedParkId)?.id ?? "";
      const settlePark = getParkById(settleParkId);

      const alreadyAtPark = snapshot.memberships.some(
        (m) =>
          m.enterpriseId === enterpriseId &&
          m.status === "active" &&
          m.parkId === settleParkId,
      );
      if (alreadyAtPark) {
        persist({
          ...snapshot,
          applications: snapshot.applications.map((a) =>
            a.id === applicationId
              ? { ...a, status: "approved" as const, reviewNote: "审核通过，欢迎使用园区产服平台" }
              : a,
          ),
          activeEnterpriseId: enterpriseId,
          selectedParkId: settleParkId || snapshot.selectedParkId,
        });
        return;
      }

      // 同一企业入驻新园区时，写入 parks 列表
      if (settleParkId) {
        const inCustom = customEnterprises.find((e) => e.id === enterpriseId);
        if (inCustom) {
          const parks = [...(inCustom.parks ?? [])];
          if (!parks.some((p) => p.id === settleParkId)) {
            parks.push({
              id: settleParkId,
              name: settlePark?.name ?? app.parkName ?? settleParkId,
            });
          }
          customEnterprises = customEnterprises.map((e) =>
            e.id === enterpriseId ? { ...e, parks } : e,
          );
        }
      }

      const membership = createMembership({
        userId: snapshot.user.id,
        enterpriseId,
        parkId: settleParkId,
        role: app.role ?? "admin",
        displayName: app.displayName,
        displayPhone: app.displayPhone,
        status: "active",
      });

      const nextParkId = membership.parkId || snapshot.selectedParkId;

      persist({
        ...snapshot,
        customEnterprises,
        applications: snapshot.applications.map((a) =>
          a.id === applicationId
            ? { ...a, status: "approved" as const, reviewNote: "审核通过，欢迎使用园区产服平台" }
            : a,
        ),
        memberships: [...snapshot.memberships, membership],
        activeEnterpriseId: snapshot.activeEnterpriseId ?? enterpriseId,
        selectedParkId: nextParkId || snapshot.selectedParkId,
      });
    },
    [persist, snapshot],
  );

  const applyDemoState = useCallback(
    (kind: DemoPersona, opts?: { phone?: string; userName?: string }): string => {
      const now = new Date().toISOString();
      const phone = opts?.phone ?? snapshot.user?.phone ?? "13800138000";
      const user: User = snapshot.user ?? {
        id: `user-${phone}`,
        phone,
        createdAt: now,
        name: opts?.userName ?? "演示用户",
      };
      const namedUser: User = withRegisteredPark({
        ...user,
        id: `user-${phone}`,
        phone,
        name: opts?.userName ?? (user.name?.trim() || "演示用户"),
        password: user.password || DEMO_PASSWORD,
        hasPassword: true,
      });

      const membership = (
        enterpriseId: string,
        role: EnterpriseRole,
        suffix: string,
        parkId = "park-sh-lg",
      ): Membership => ({
        id: `mem-demo-${suffix}`,
        userId: namedUser.id,
        enterpriseId,
        parkId,
        role,
        displayName: namedUser.name || "演示用户",
        displayPhone: phone,
        status: "active",
        joinedAt: now,
      });

      const application = (
        partial: Partial<EnterpriseApplication> & Pick<EnterpriseApplication, "type" | "enterpriseName" | "status">,
      ): EnterpriseApplication => ({
        id: `app-demo-${partial.status}-${partial.type}`,
        userId: namedUser.id,
        displayName: namedUser.name || "演示用户",
        displayPhone: phone,
        createdAt: now,
        parkId: "park-sh-lg",
        parkName: "临港智造园",
        ...partial,
      });

      const keepUser = {
        user: namedUser,
        loggedIn: true as const,
        customEnterprises: [] as Enterprise[],
        demoPersona: kind,
      };

      const demoUploads = demoEnterpriseUploads();

      const seedJoinInboxForAdmin = () => {
        upsertJoinInbox({
          id: "app-join-inbox-demo",
          type: "join",
          userId: "user-13900139000",
          enterpriseId: "ent-001",
          enterpriseName: "临港精密制造有限公司",
          uscc: "91310000MA1FL1234X",
          role: "purchaser",
          displayName: "陈工",
          displayPhone: "13900139000",
          parkId: "park-sh-lg",
          parkName: "临港智造园",
          status: "pending",
          createdAt: now,
        });
      };

      const approvedArchiveFields = {
        customerType: "enterprise",
        uscc: "91310000MA1FL1234X",
        industry:
          "C 制造业 / 34 通用设备制造业 / 341 锅炉及原动设备制造 / 3411 锅炉及辅助设备制造",
        contactName: "王管理员",
        contactPhone: phone,
        contactEmail: "admin@lgjm.demo",
        certValidUntil: "长期",
        establishedAt: "2018-06-15",
        registeredCapital: "5000万元人民币",
        registeredAddress: "上海市浦东新区临港新片区环湖西一路 88 号",
        enterpriseNature: "private",
        enterpriseScale: "100-500",
        businessDescription: "精密零部件、工装夹具、伺服系统总成",
        intro: "面向高端装备与海工配套的精密制造企业，具备机加、装配与检测一体化能力。",
        address: "上海市浦东新区临港新片区环湖西一路 88 号 A 座",
        lat: 30.8892,
        lng: 121.9265,
        upstreamCategories: "伺服电机、工业润滑油、特种钢材",
        downstreamCategories: "海工模块、智能装备整机",
        industryChainL1: "equip",
        industryChainL2: "smart-equip",
        industryChainL3: "cnc",
        chainSegments: ["整机制造", "核心零部件"],
        enterpriseTags: ["高新技术企业", "专精特新"],
        faceVerified: true,
        eSigned: true,
        ...demoUploads,
      };

      if (kind === "personal") {
        persist({
          ...keepUser,
          memberships: [],
          applications: [],
          activeEnterpriseId: null,
          selectedParkId: null,
        });
        return "/onboarding";
      }

      if (kind === "create") {
        persist({
          ...keepUser,
          memberships: [],
          applications: [],
          activeEnterpriseId: null,
          selectedParkId: null,
        });
        return "/onboarding/create";
      }

      if (kind === "invite") {
        persist({
          ...keepUser,
          memberships: [],
          applications: [],
          activeEnterpriseId: null,
          selectedParkId: null,
        });
        return "/onboarding/invite";
      }

      if (kind === "join") {
        persist({
          ...keepUser,
          memberships: [],
          applications: [],
          activeEnterpriseId: null,
          selectedParkId: "park-sh-lg",
        });
        return "/onboarding/join";
      }

      if (kind === "pending") {
        persist({
          ...keepUser,
          memberships: [],
          activeEnterpriseId: null,
          selectedParkId: "park-sh-lg",
          applications: [
            application({
              type: "create",
              enterpriseName: "临港演示科技有限公司",
              uscc: "91310000MA1DEMO001",
              industry: "智能制造",
              contactName: "演示用户",
              contactPhone: phone,
              status: "pending",
            }),
          ],
        });
        return "/onboarding/status";
      }

      if (kind === "rejected") {
        persist({
          ...keepUser,
          memberships: [],
          activeEnterpriseId: null,
          selectedParkId: "park-sh-lg",
          applications: [
            application({
              type: "create",
              enterpriseName: "临港演示科技有限公司",
              uscc: "91310000MA1DEMO001",
              industry: "C 制造业 / 34 通用设备制造业 / 341 锅炉及原动设备制造 / 3411 锅炉及辅助设备制造",
              contactName: "演示用户",
              contactPhone: phone,
              contactEmail: "demo@lingang.com",
              customerType: "enterprise",
              mainProducts: "精密零部件、工装夹具",
              businessDescription: "精密零部件研发制造与工装夹具定制服务",
              enterpriseNature: "private",
              enterpriseScale: "100-500",
              establishedAt: "2018-06-15",
              registeredCapital: "5000万元人民币",
              registeredAddress: "上海市浦东新区临港新片区环湖西一路 88 号",
              industryChainL1: "equip",
              industryChainL2: "smart-equip",
              industryChainL3: "cnc",
              chainSegments: ["整机制造", "工程服务"],
              enterpriseTags: ["高新技术企业", "专精特新"],
              address: "上海市浦东新区临港新片区环湖西一路 99 号",
              lat: 30.8892,
              lng: 121.9265,
              faceVerified: true,
              eSigned: true,
              materialsNote: "客户类型 企业法人 · 证件长期有效 · 精密零部件、工装夹具",
              status: "rejected",
              reviewNote: "营业执照与企业名称不一致，请核对后重新提交",
            }),
          ],
        });
        return "/onboarding/status";
      }

      if (kind === "multi") {
        seedJoinInboxForAdmin();
        persist({
          ...keepUser,
          selectedParkId: "park-sh-lg",
          activeEnterpriseId: "ent-001",
          memberships: [
            membership("ent-001", "admin", "1", "park-sh-lg"),
            membership("ent-002", "purchaser", "2a", "park-sh-lg"),
            membership("ent-002", "purchaser", "2b", "park-sh-zj"),
            membership("ent-002", "purchaser", "2c", "park-zj-hz"),
            membership("ent-005", "finance", "3", "park-js-sz"),
          ],
          applications: [
            application({
              type: "create",
              enterpriseId: "ent-001",
              enterpriseName: "临港精密制造有限公司",
              ...approvedArchiveFields,
              status: "approved",
              reviewNote: "审核通过",
            }),
          ],
        });
        return "/";
      }

      seedJoinInboxForAdmin();
      persist({
        ...keepUser,
        selectedParkId: "park-sh-lg",
        activeEnterpriseId: "ent-001",
        memberships: [membership("ent-001", "admin", "1")],
        applications: [
          application({
            type: "create",
            enterpriseId: "ent-001",
            enterpriseName: "临港精密制造有限公司",
            ...approvedArchiveFields,
            status: "approved",
            reviewNote: "审核通过",
          }),
        ],
      });
      return "/";
    },
    [persist, snapshot.user],
  );

  const activeMembership = useMemo(() => {
    const candidates = snapshot.memberships.filter(
      (m) => m.enterpriseId === snapshot.activeEnterpriseId && m.status === "active",
    );
    if (!candidates.length) return null;
    const byPark = candidates.find((m) => m.parkId === snapshot.selectedParkId);
    return byPark ?? candidates[0] ?? null;
  }, [snapshot.activeEnterpriseId, snapshot.memberships, snapshot.selectedParkId]);

  const activeEnterprise = useMemo(
    () =>
      activeMembership
        ? getEnterpriseById(activeMembership.enterpriseId, snapshot.customEnterprises) ?? null
        : null,
    [activeMembership, snapshot.customEnterprises],
  );

  const approvedContexts = useMemo(
    () => buildEnterpriseContexts(snapshot.memberships, snapshot.customEnterprises),
    [snapshot.memberships, snapshot.customEnterprises],
  );

  const approvedEnterprises = useMemo(() => {
    const seen = new Set<string>();
    return approvedContexts
      .filter((ctx) => {
        if (seen.has(ctx.enterprise.id)) return false;
        seen.add(ctx.enterprise.id);
        return true;
      })
      .map((ctx) => ({ membership: ctx.membership, enterprise: ctx.enterprise }));
  }, [approvedContexts]);

  const incomingJoinRequests = useMemo(() => {
    const reviewableIds = new Set(
      snapshot.memberships
        .filter((m) => m.status === "active" && roleHasPermission(m.role, "join_review"))
        .map((m) => m.enterpriseId),
    );
    return loadJoinInbox().filter(
      (a) =>
        a.type === "join" &&
        a.status === "pending" &&
        a.enterpriseId &&
        reviewableIds.has(a.enterpriseId),
    );
  }, [snapshot.memberships, snapshot.applications]);

  const selectedPark = getParkById(snapshot.selectedParkId) ?? null;

  const changePhone = useCallback(
    (req: {
      newPhone: string;
      via: "old_sms" | "password";
      oldSmsCode?: string;
      password?: string;
      newSmsCode: string;
    }) => {
      if (!snapshot.user || snapshot.loggedIn === false) {
        return { ok: false as const, error: "未登录" };
      }
      const normalized = req.newPhone.replace(/\s/g, "");
      if (!/^1\d{10}$/.test(normalized)) {
        return { ok: false as const, error: "请输入 11 位新手机号" };
      }
      if (normalized === snapshot.user.phone) {
        return { ok: false as const, error: "新手机号不能与当前手机号相同" };
      }
      if (req.newSmsCode !== MOCK_OTP) {
        return {
          ok: false as const,
          error: req.newSmsCode ? `新手机验证码不正确，请填 ${MOCK_OTP}` : "请输入新手机验证码",
        };
      }
      if (req.via === "password") {
        if (!snapshot.user.password && !snapshot.user.hasPassword) {
          return { ok: false as const, error: "尚未设置密码，请使用原手机验证" };
        }
        const pwd = snapshot.user.password || DEMO_PASSWORD;
        if (req.password !== pwd) {
          return { ok: false as const, error: "密码不正确" };
        }
      } else if (req.oldSmsCode !== MOCK_OTP) {
        return {
          ok: false as const,
          error: req.oldSmsCode ? `原手机验证码不正确，请填 ${MOCK_OTP}` : "请输入原手机验证码",
        };
      }

      const oldUserId = snapshot.user.id;
      const oldPhone = snapshot.user.phone;
      const newUserId = `user-${normalized}`;
      persist({
        ...snapshot,
        user: {
          ...snapshot.user,
          phone: normalized,
          id: newUserId,
        },
        memberships: snapshot.memberships.map((m) =>
          m.userId === oldUserId || m.displayPhone === oldPhone
            ? { ...m, userId: newUserId, displayPhone: normalized }
            : m,
        ),
        applications: snapshot.applications.map((a) =>
          a.userId === oldUserId || a.displayPhone === oldPhone
            ? {
                ...a,
                userId: newUserId,
                displayPhone: a.displayPhone === oldPhone ? normalized : a.displayPhone,
                contactPhone: a.contactPhone === oldPhone ? normalized : a.contactPhone,
              }
            : a,
        ),
      });
      return { ok: true as const };
    },
    [persist, snapshot],
  );

  const changePassword = useCallback(
    (req: {
      nextPwd: string;
      confirm: string;
      via: "set" | "old";
      oldPwd?: string;
    }) => {
      if (!snapshot.user || snapshot.loggedIn === false) {
        return { ok: false as const, error: "未登录" };
      }
      if (!isPasswordValid(req.nextPwd)) {
        return { ok: false as const, error: "新密码需至少 8 位，且包含字母和数字" };
      }
      if (req.nextPwd !== req.confirm) {
        return { ok: false as const, error: "两次输入的新密码不一致" };
      }
      if (req.via === "old") {
        if (!snapshot.user.password && !snapshot.user.hasPassword) {
          return { ok: false as const, error: "尚未设置密码" };
        }
        const pwd = snapshot.user.password || DEMO_PASSWORD;
        if (req.oldPwd !== pwd) {
          return { ok: false as const, error: "旧密码不正确" };
        }
      }
      persist({
        ...snapshot,
        user: {
          ...snapshot.user,
          password: req.nextPwd,
          hasPassword: true,
        },
      });
      return { ok: true as const };
    },
    [persist, snapshot],
  );

  const setPassword = useCallback(
    (password: string, confirm: string) =>
      changePassword({
        nextPwd: password,
        confirm,
        via: "set",
      }),
    [changePassword],
  );

  const deleteAccount = useCallback(() => {
    persist(withAutoPark(emptySnapshot()));
  }, [persist]);

  const leaveEnterprise = useCallback(
    (enterpriseId?: string, parkId?: string) => {
      if (!snapshot.user) return { ok: false as const, error: "未登录" };
      const targetId = enterpriseId ?? snapshot.activeEnterpriseId;
      if (!targetId) return { ok: false as const, error: "未选择企业" };

      const toRemove = snapshot.memberships.filter((m) => {
        if (m.enterpriseId !== targetId || m.status !== "active") return false;
        if (parkId) return m.parkId === parkId;
        return true;
      });
      if (!toRemove.length) return { ok: false as const, error: "未加入该企业" };

      const removeIds = new Set(toRemove.map((m) => m.id));
      const remaining = snapshot.memberships.filter((m) => !removeIds.has(m.id));

      const leavingCurrent = toRemove.some(
        (m) =>
          m.enterpriseId === snapshot.activeEnterpriseId &&
          (!snapshot.selectedParkId || m.parkId === snapshot.selectedParkId),
      );

      let nextActive = snapshot.activeEnterpriseId;
      let nextPark = snapshot.selectedParkId;
      if (leavingCurrent) {
        const next = buildEnterpriseContexts(remaining, snapshot.customEnterprises)[0];
        nextActive = next?.enterprise.id ?? null;
        nextPark = next?.parkId ?? null;
      }

      persist({
        ...snapshot,
        memberships: remaining,
        activeEnterpriseId: nextActive,
        selectedParkId: nextPark,
        archiveChangeStatus: leavingCurrent ? "none" : snapshot.archiveChangeStatus,
      });
      return { ok: true as const };
    },
    [persist, snapshot],
  );

  const deregisterEnterprise = useCallback(
    (enterpriseId?: string) => {
      if (!snapshot.user) return { ok: false as const, error: "未登录" };
      const targetId = enterpriseId ?? snapshot.activeEnterpriseId;
      if (!targetId) return { ok: false as const, error: "未选择企业" };
      const membership = snapshot.memberships.find(
        (m) => m.enterpriseId === targetId && m.status === "active",
      );
      if (!membership) return { ok: false as const, error: "未加入该企业" };
      if (membership.role !== "admin") {
        return { ok: false as const, error: "仅企业管理员可注销企业" };
      }
      const remaining = snapshot.memberships.filter((m) => m.enterpriseId !== targetId);
      const leavingCurrent = snapshot.activeEnterpriseId === targetId;
      let nextActive = snapshot.activeEnterpriseId;
      let nextPark = snapshot.selectedParkId;
      if (leavingCurrent) {
        const next = buildEnterpriseContexts(remaining, snapshot.customEnterprises)[0];
        nextActive = next?.enterprise.id ?? null;
        nextPark = next?.parkId ?? null;
      }
      persist({
        ...snapshot,
        memberships: remaining,
        customEnterprises: snapshot.customEnterprises.filter((e) => e.id !== targetId),
        activeEnterpriseId: nextActive,
        selectedParkId: nextPark,
        archiveChangeStatus: "none",
      });
      return { ok: true as const };
    },
    [persist, snapshot],
  );

  const submitArchiveChange = useCallback(
    (payload: EnterpriseOnboardPayload) => {
      if (!snapshot.user) return { ok: false as const, error: "未登录" };
      const enterpriseId = snapshot.activeEnterpriseId;
      if (!enterpriseId) return { ok: false as const, error: "未选择企业" };
      const membership = snapshot.memberships.find(
        (m) => m.enterpriseId === enterpriseId && m.status === "active",
      );
      if (!membership) return { ok: false as const, error: "未加入该企业" };
      if (!roleHasPermission(membership.role, "archive_edit")) {
        return { ok: false as const, error: "当前角色无档案变更权限" };
      }
      if ((snapshot.archiveChangeStatus ?? "none") === "reviewing") {
        return { ok: false as const, error: "已有档案变更正在审核，请先等待审核结果" };
      }

      const park = getParkById(payload.parkId);
      const application = createApplication({
        type: "archive",
        userId: snapshot.user.id,
        enterpriseId,
        enterpriseName: payload.enterpriseName,
        uscc: payload.uscc,
        industry: payload.industry,
        displayName: payload.displayName,
        displayPhone: payload.contactPhone,
        contactName: payload.contactName,
        contactPhone: payload.contactPhone,
        contactEmail: payload.contactEmail,
        materialsNote: payload.materialsNote,
        parkId: payload.parkId,
        parkName: park?.name,
        customerType: payload.customerType,
        idType: payload.idType,
        certValidUntil: payload.certValidUntil,
        establishedAt: payload.establishedAt,
        registeredCapital: payload.registeredCapital,
        registeredAddress: payload.registeredAddress,
        enterpriseNature: payload.enterpriseNature,
        enterpriseScale: payload.enterpriseScale,
        businessDescription: payload.businessDescription,
        mainProducts: payload.mainProducts,
        address: payload.address,
        lat: payload.lat,
        lng: payload.lng,
        upstreamCategories: payload.upstreamCategories,
        downstreamCategories: payload.downstreamCategories,
        industryChainL1: payload.industryChainL1,
        industryChainL2: payload.industryChainL2,
        industryChainL3: payload.industryChainL3,
        chainSegments: payload.chainSegments,
        enterpriseTags: payload.enterpriseTags,
        faceVerified: payload.faceVerified,
        eSigned: payload.eSigned,
        intro: payload.intro,
        uploads: payload.uploads,
        uploadPreviews: payload.uploadPreviews,
      });

      // 同一企业仅保留一条待审档案变更
      const applications = [
        application,
        ...snapshot.applications.filter(
          (a) => !(a.type === "archive" && a.enterpriseId === enterpriseId && a.status === "pending"),
        ),
      ];

      persist({
        ...snapshot,
        applications,
        selectedParkId: payload.parkId || snapshot.selectedParkId,
        archiveChangeStatus: "reviewing",
      });
      return { ok: true as const, application };
    },
    [persist, snapshot],
  );

  const clearArchiveChange = useCallback(() => {
    persist({
      ...snapshot,
      archiveChangeStatus: "none",
      applications: snapshot.applications.map((a) =>
        a.type === "archive" && a.status === "pending"
          ? { ...a, status: "rejected" as const, reviewNote: "已撤回档案变更" }
          : a,
      ),
    });
  }, [persist, snapshot]);

  const syncMembershipFromRoster = useCallback(
    (req: {
      enterpriseId: string;
      displayPhone: string;
      role?: EnterpriseRole;
      remove?: boolean;
      parkId?: string;
    }) => {
      const phone = req.displayPhone.replace(/\s/g, "");
      if (req.remove) {
        persist({
          ...snapshot,
          memberships: snapshot.memberships.filter(
            (m) =>
              !(
                m.enterpriseId === req.enterpriseId &&
                m.displayPhone === phone &&
                (!req.parkId || !m.parkId || m.parkId === req.parkId)
              ),
          ),
        });
        return;
      }
      if (!req.role) return;
      let found = false;
      const memberships = snapshot.memberships.map((m) => {
        if (
          m.enterpriseId === req.enterpriseId &&
          m.displayPhone === phone &&
          (!req.parkId || !m.parkId || m.parkId === req.parkId)
        ) {
          found = true;
          return { ...m, role: req.role! };
        }
        return m;
      });
      // 当前用户改角色：确保至少更新 active 会员
      if (!found && snapshot.user?.phone === phone) {
        const self = memberships.find(
          (m) =>
            m.enterpriseId === req.enterpriseId &&
            m.status === "active" &&
            (m.userId === snapshot.user!.id || m.displayPhone === phone),
        );
        if (self) {
          persist({
            ...snapshot,
            memberships: memberships.map((m) =>
              m.id === self.id ? { ...m, role: req.role! } : m,
            ),
          });
          return;
        }
      }
      persist({ ...snapshot, memberships });
    },
    [persist, snapshot],
  );

  const loginFromSupplierPortal = useCallback(
    (phone: string) => {
      const normalizedPhone = phone.replace(/\s/g, "");
      if (!/^1\d{10}$/.test(normalizedPhone)) return;

      if (snapshot.user?.phone === normalizedPhone && snapshot.loggedIn) {
        return;
      }

      const demoAccount = supplierDemoAccountForPhone(normalizedPhone);
      const demoPreset = supplierDemoPresetForPhone(normalizedPhone);

      if (demoPreset === "approved") {
        applyDemoState("approved", {
          phone: normalizedPhone,
          userName: demoAccount?.userName,
        });
        registerPhoneOnPlatform(normalizedPhone);
        return;
      }

      if (demoPreset === "fresh") {
        applyDemoState("personal", {
          phone: normalizedPhone,
          userName: demoAccount?.userName,
        });
        registerPhoneOnPlatform(normalizedPhone);
        return;
      }

      if (snapshot.user?.phone === normalizedPhone) {
        const next = applyJoinGrants(withAutoPark({ ...snapshot, loggedIn: true }));
        persist(next);
        registerPhoneOnPlatform(normalizedPhone);
        return;
      }

      login(normalizedPhone, MOCK_OTP);
    },
    [applyDemoState, login, persist, snapshot],
  );

  const isLoggedIn = !!snapshot.user && snapshot.loggedIn === true;

  const value: AuthContextValue = {
    user: isLoggedIn ? snapshot.user : null,
    isAuthenticated: isLoggedIn,
    memberships: snapshot.memberships,
    applications: snapshot.applications,
    activeEnterpriseId: snapshot.activeEnterpriseId,
    activeMembership: isLoggedIn ? activeMembership : null,
    activeEnterprise: isLoggedIn ? activeEnterprise : null,
    approvedContexts: isLoggedIn ? approvedContexts : [],
    approvedEnterprises: isLoggedIn ? approvedEnterprises : [],
    hasActiveEnterprise: isLoggedIn && approvedContexts.length > 0,
    pendingApplications: isLoggedIn
      ? snapshot.applications.filter((a) => a.status === "pending")
      : [],
    customEnterprises: snapshot.customEnterprises,
    selectedParkId: snapshot.selectedParkId,
    selectedPark,
    parkCatalog: parks,
    needsParkSelection: !selectedPark && parks.length > 1,
    login,
    passwordLogin,
    resetPassword,
    logout,
    sendOtp,
    selectPark,
    switchEnterprise,
    switchEnterpriseContext,
    submitCreateEnterprise,
    submitInviteEnterprise,
    submitJoinEnterprise,
    resubmitApplication,
    simulateApproveApplication,
    reviewJoinApplication,
    syncMembershipFromRoster,
    incomingJoinRequests,
    demoPersona: snapshot.demoPersona ?? null,
    applyDemoState,
    loginFromSupplierPortal,
    archiveChangeStatus: snapshot.archiveChangeStatus ?? "none",
    changePhone,
    changePassword,
    setPassword,
    deleteAccount,
    leaveEnterprise,
    deregisterEnterprise,
    submitArchiveChange,
    clearArchiveChange,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
