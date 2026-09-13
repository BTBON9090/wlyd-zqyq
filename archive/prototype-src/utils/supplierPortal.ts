import { CLOUD_SUPPLIER_PORTAL_URL, SUPPLIER_PORTAL_URL } from "../config/portals";
import { isSupplierDemoOnboarded } from "../data/supplierDemoAccounts";
import { parkName as DEPLOYMENT_PARK_NAME } from "../data";

const VENDOR_STORAGE_KEY = "zqyq-vendor-portal-v1";

/** 客户端短名 → 供应商端申请入驻园区全称（SSO 登录来源园区） */
const CLIENT_TO_SUPPLIER_PARK: Record<string, string> = {
  临港智造园: "上海临港新片区智能制造产业园",
};

type VendorOrg = { status?: string };
type VendorSession = {
  phone?: string;
  loggedIn?: boolean;
  status?: string;
  orgs?: VendorOrg[];
  currentOrgId?: string | null;
  form?: { phone?: string };
};

function readVendorSession(): VendorSession | null {
  try {
    const raw = localStorage.getItem(VENDOR_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VendorSession;
  } catch {
    return null;
  }
}

function sessionMatchesPhone(session: VendorSession, phone: string) {
  return session.phone === phone || session.form?.phone === phone;
}

/** 判断当前账号是否已在供应商端完成入驻 */
export function isSupplierOnboarded(phone: string): boolean {
  const demo = isSupplierDemoOnboarded(phone);
  if (demo !== null) return demo;

  const session = readVendorSession();
  if (!session || !sessionMatchesPhone(session, phone)) return false;
  const orgs = session.orgs ?? [];
  if (orgs.some((o) => o.status === "approved")) return true;
  return session.status === "approved" && Boolean(session.currentOrgId);
}

/** 将客户端当前登录园区映射为供应商端园区全称 */
export function toSupplierLoginSourcePark(clientParkName?: string): string {
  const name = (clientParkName || DEPLOYMENT_PARK_NAME).trim();
  return CLIENT_TO_SUPPLIER_PARK[name] || name || "上海临港新片区智能制造产业园";
}

/**
 * 跳转到供应商端：携带手机号 SSO + 登录来源园区（与注册园区无关）。
 * 供应商端用于「申请入驻园区」默认值场景 1。
 */
export function buildSupplierPortalUrl(
  phone: string,
  opts?: { forceCloud?: boolean; loginSourcePark?: string },
): string {
  const raw = opts?.forceCloud ? CLOUD_SUPPLIER_PORTAL_URL : SUPPLIER_PORTAL_URL;
  const base = raw.replace(/\/$/, "");
  const park = toSupplierLoginSourcePark(opts?.loginSourcePark);
  return `${base}/?from=client&phone=${encodeURIComponent(phone)}&park=${encodeURIComponent(park)}`;
}
