/** 供应商演示账号：与供应商端 preset 一致 */
export const SUPPLIER_DEMO_APPROVED_PHONE = "13800138000";
export const SUPPLIER_DEMO_FRESH_PHONE = "13800138888";

export type SupplierDemoPreset = "approved" | "fresh";

export const SUPPLIER_DEMO_ACCOUNTS = [
  {
    phone: SUPPLIER_DEMO_APPROVED_PHONE,
    label: "已入驻供应商",
    hint: "周启明 · 临港企服 · 进入经营看板",
    preset: "approved" as const,
    userName: "周启明",
  },
  {
    phone: SUPPLIER_DEMO_FRESH_PHONE,
    label: "未入驻供应商",
    hint: "新注册用户 · 进入供应商入驻",
    preset: "fresh" as const,
    userName: "新注册用户",
  },
] as const;

export function supplierDemoPresetForPhone(phone: string): SupplierDemoPreset | null {
  const row = SUPPLIER_DEMO_ACCOUNTS.find((a) => a.phone === phone);
  return row?.preset ?? null;
}

export function isSupplierDemoOnboarded(phone: string): boolean | null {
  const row = SUPPLIER_DEMO_ACCOUNTS.find((a) => a.phone === phone);
  if (!row) return null;
  return row.preset === "approved";
}

export function supplierDemoAccountForPhone(phone: string) {
  return SUPPLIER_DEMO_ACCOUNTS.find((a) => a.phone === phone) ?? null;
}
