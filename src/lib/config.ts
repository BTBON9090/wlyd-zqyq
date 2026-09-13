export const DEMO = __DEMO__;
export const site = {
  name: import.meta.env.VITE_SITE_NAME || "政企园区企业服务平台",
  shortName: "政企园区",
  park: import.meta.env.VITE_PARK_NAME || "经开区",
  support: "万联易达集团 · 技术支持",
  api: import.meta.env.VITE_API_BASE_URL || "/api",
  hero: import.meta.env.VITE_HERO_IMAGE || "",
  icp: import.meta.env.VITE_ICP_NUMBER || "",
  contact: import.meta.env.VITE_SUPPORT_PHONE || "",
};
export const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
export function safeReturn(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value) ||
    /^\/(login|register|reset-password)/.test(value)
  )
    return "/";
  return value;
}
