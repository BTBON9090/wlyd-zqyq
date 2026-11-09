import { z } from "zod";
import { UAT, uatRequest } from "../../uat/api";

/** Explicit opt-in for the shared, non-production procurement demonstration. */
export const SHARED_PROCUREMENT = UAT || (__DEMO__ && import.meta.env.VITE_SHARED_API === "1");
export const PROCUREMENT_DEMO_ACTIONS = __DEMO__ || SHARED_PROCUREMENT;
const parkFromUrl = SHARED_PROCUREMENT && !UAT ? new URLSearchParams(window.location.search).get('park') : null;
if(parkFromUrl && /^park-[a-z0-9-]{1,60}$/.test(parkFromUrl)) sessionStorage.setItem('shared-procurement-park', parkFromUrl);
export const sharedParkId = SHARED_PROCUREMENT && !UAT ? sessionStorage.getItem('shared-procurement-park') || 'park-lingang' : '';

export async function sharedRequest<T>(path: string, schema: z.ZodType<T>, options: RequestInit = {}): Promise<T> {
  if (UAT) {
    const result = await uatRequest<unknown>(path, options, true);
    const parsed = schema.safeParse(result);
    if (!parsed.success) throw new Error("服务返回的数据格式不正确，请联系管理员。");
    return parsed.data;
  }
  let response: Response;
  try {
    const url = new URL(`/api/shared${path}`, window.location.origin);
    if(SHARED_PROCUREMENT) url.searchParams.set('parkId', sharedParkId);
    response = await fetch(url, {
      ...options,
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
      headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
    });
  } catch {
    throw new Error("共享演示服务暂时无法连接，请稍后重试。");
  }
  if (!response.ok) {
    let message = "操作失败，请稍后重试。";
    try {
      const data: unknown = await response.json();
      if (data && typeof data === "object") {
        const error = (data as { error?: unknown }).error;
        if (typeof error === "string" && error.length <= 300) message = error;
      }
    } catch { /* A non-JSON error response uses the generic message. */ }
    throw new Error(message);
  }
  const result: unknown = response.status === 204 ? null : await response.json();
  const parsed = schema.safeParse(result);
  if (!parsed.success) throw new Error("共享演示服务返回的数据格式不正确。");
  return parsed.data;
}
