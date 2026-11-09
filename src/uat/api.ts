export const UAT = import.meta.env.VITE_UAT_API === "1";
export type UatUser = {
  id: string;
  username: string;
  displayName: string;
  role: "buyer" | "admin";
  supplierId?: string;
  canManageSupplier?: boolean;
  parkIds: string[];
  currentParkId: string;
};
export type UatSession = { user: UatUser | null; csrfToken?: string };
export type CloudValue<T = unknown> = { value: T; version: number };
export type StateKey =
  "cart" | "addresses" | "preferences" | "onboarding" | "profile";
export class UatError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
let csrfToken = "";
let parkId = "";
let generation = 0;
export function configureUatSession(session: UatSession) {
  csrfToken = session.csrfToken || "";
  parkId = session.user?.currentParkId || "";
}
export function resetUatSession() {
  generation++;
  csrfToken = "";
  parkId = "";
}
export function currentUatPark() {
  return parkId;
}
export async function uatRequest<T>(
  path: string,
  options: RequestInit = {},
  scoped = false,
): Promise<T> {
  if (__DEMO__ && !UAT) return (await import("../dev/accountPreviewApi")).accountPreviewRequest<T>(path, options);
  const requestGeneration = generation;
  const url = new URL(`/api/shared${path}`, window.location.origin);
  if (scoped && parkId) url.searchParams.set("parkId", parkId);
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (
    options.method &&
    !["GET", "HEAD"].includes(options.method.toUpperCase()) &&
    csrfToken
  )
    headers.set("X-CSRF-Token", csrfToken);
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new UatError("连接失败或请求超时，请检查网络后重试。");
  }
  if (requestGeneration !== generation)
    throw new UatError("登录状态已变化，请重新操作。", 401);
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (requestGeneration !== generation)
    throw new UatError("登录状态已变化，请重新操作。", 401);
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("uat:session-expired"));
    throw new UatError(
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : `请求失败（${response.status}），请重试。`,
      response.status,
    );
  }
  return data as T;
}
