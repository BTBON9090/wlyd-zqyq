import type { EnterpriseApplication, EnterpriseRole } from "../types/auth";

const INBOX_KEY = "park-client-join-inbox";
const GRANT_KEY = "park-client-join-grants";

export type JoinGrant = {
  applicationId: string;
  userId: string;
  phone: string;
  enterpriseId: string;
  parkId: string;
  role: EnterpriseRole;
  displayName: string;
  displayPhone: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadJoinInbox(): EnterpriseApplication[] {
  const list = readJson<EnterpriseApplication[]>(INBOX_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function saveJoinInbox(list: EnterpriseApplication[]) {
  localStorage.setItem(INBOX_KEY, JSON.stringify(list));
}

export function upsertJoinInbox(app: EnterpriseApplication) {
  const list = loadJoinInbox();
  const next = list.some((item) => item.id === app.id)
    ? list.map((item) => (item.id === app.id ? app : item))
    : [app, ...list];
  saveJoinInbox(next);
}

export function loadJoinGrants(): JoinGrant[] {
  const list = readJson<JoinGrant[]>(GRANT_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function saveJoinGrants(list: JoinGrant[]) {
  localStorage.setItem(GRANT_KEY, JSON.stringify(list));
}

export function addJoinGrant(grant: JoinGrant) {
  const list = loadJoinGrants().filter((item) => item.applicationId !== grant.applicationId);
  saveJoinGrants([grant, ...list]);
}

/** 取出并清除当前用户尚未落地的加入授权 */
export function consumeJoinGrantsForUser(userId: string, phone: string): JoinGrant[] {
  const all = loadJoinGrants();
  const matched: JoinGrant[] = [];
  const rest: JoinGrant[] = [];
  for (const grant of all) {
    if (grant.userId === userId || grant.phone === phone) matched.push(grant);
    else rest.push(grant);
  }
  if (matched.length) saveJoinGrants(rest);
  return matched;
}
