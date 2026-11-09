import { setDemoSession } from "./mockGateway";
import type { Session } from "../lib/models";
const KEY = "park-preview-accounts";
type Account = { digest: string; name: string; registered?: boolean };
function accounts(): Record<string, Account> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
async function digest(password: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, "0")).join("");
}
export async function authenticatePreview(username: string, password: string, displayName?: string): Promise<Session> {
  const records = accounts();
  const hash = await digest(password);
  if (displayName) {
    if (records[username]) throw new Error("用户名已存在，请直接登录。");
    records[username] = { digest: hash, name: displayName, registered: true };
    localStorage.setItem(KEY, JSON.stringify(records));
  } else if (records[username] ? records[username].digest !== hash : password !== "DemoPreview123!") {
    throw new Error("演示密码不正确，请点击演示填入，或通过验收工具切换账号。");
  }
  const record = records[username];
  const session: Session = record?.registered
    ? { id: "preview-" + username, name: record.name, phone: "13800000000", enterpriseStatus: "none" }
    : { id: "demo-enterprise-user", name: record?.name || "演示采购员", phone: "13800000000", enterprise: "园区示例企业", enterpriseStatus: "approved" };
  localStorage.setItem("park-preview-username", username);
  setDemoSession(session);
  return session;
}
export async function changePreviewPassword(currentPassword: string, newPassword: string) {
  const username = localStorage.getItem("park-preview-username") || "preview_buyer";
  const records = accounts();
  if (await digest(currentPassword) !== (records[username]?.digest || await digest("DemoPreview123!"))) throw new Error("当前密码不正确。");
  records[username] = { ...records[username], name: records[username]?.name || "演示采购员", digest: await digest(newPassword) };
  localStorage.setItem(KEY, JSON.stringify(records));
}
