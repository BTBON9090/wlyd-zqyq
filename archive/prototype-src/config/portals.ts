/** 腾讯云静态托管：供应商端在站点根，客户端在 /client/ */
export const CLOUD_SUPPLIER_PORTAL_URL =
  "https://vendor-d4gor42xf7e6a1f1b-1308030138.tcloudbaseapp.com/";
export const CLOUD_CLIENT_PORTAL_URL =
  "https://vendor-d4gor42xf7e6a1f1b-1308030138.tcloudbaseapp.com/client/";

function isLocalHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function resolvePortalUrl(envValue: string | undefined, cloudUrl: string, localUrl: string) {
  if (envValue) return envValue;
  return isLocalHost() ? localUrl : cloudUrl;
}

/** 供应商端地址：云端用托管根路径，本地开发默认 3001 */
export const SUPPLIER_PORTAL_URL = resolvePortalUrl(
  import.meta.env.VITE_SUPPLIER_PORTAL_URL,
  CLOUD_SUPPLIER_PORTAL_URL,
  "http://localhost:3001",
);
