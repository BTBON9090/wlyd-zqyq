import { z } from "zod";
import { site } from "./config";
import {
  demandSchema,
  enterpriseSchema,
  receiptSchema,
  serviceSchema,
  sessionSchema,
  type Gateway,
} from "./models";
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
export async function http<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    const headers = new Headers(options.headers);
    if (options.method && options.method !== "GET") {
      const csrfResponse = await fetch(`${site.api}/auth/csrf`, {
        credentials: "include",
        signal: controller.signal,
      });
      if (!csrfResponse.ok)
        throw new ApiError(
          "安全验证暂时不可用，请稍后重试",
          csrfResponse.status,
        );
      const csrf = z
        .object({ token: z.string().min(1) })
        .parse(await csrfResponse.json());
      headers.set("X-CSRF-Token", csrf.token);
      if (!(options.body instanceof FormData))
        headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${site.api}${path}`, {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401)
        window.dispatchEvent(new Event("park:session-expired"));
      const messages: Record<number, string> = {
        401: "登录已过期，请重新登录后继续",
        403: "当前账号暂无此操作权限",
        404: "内容不存在或已下架",
        409: "该申请已提交，请查看办理进度",
        413: "文件过大，请更换后重试",
        429: "操作过于频繁，请稍后再试",
      };
      throw new ApiError(
        messages[response.status] || "服务暂时不可用，请稍后重试",
        response.status,
      );
    }
    return schema.parse(response.status === 204 ? null : await response.json());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof z.ZodError)
      throw new ApiError("返回的数据暂时无法显示，请稍后重试");
    throw new ApiError(
      controller.signal.aborted
        ? "请求超时，请重试"
        : "网络连接失败，请检查网络后重试",
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}
const post = <T>(path: string, schema: z.ZodType<T>, body: unknown) =>
  http(path, schema, { method: "POST", body: JSON.stringify(body) });
function form(input: object) {
  const data = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined)
      data.append(key, value instanceof File ? value : String(value));
  });
  return data;
}
const api: Gateway = {
  demands: () => http("/demands/mine", z.array(demandSchema)),
  publishDemand: (input, key) =>
    http("/demands", demandSchema, {
      method: "POST",
      body: JSON.stringify(input),
      headers: { "Idempotency-Key": key },
    }),
  services: (signal) => http("/services", z.array(serviceSchema), { signal }),
  service: (id, signal) =>
    http(`/services/${encodeURIComponent(id)}`, serviceSchema, { signal }),
  session: async () => {
    try {
      return await http("/auth/session", sessionSchema.nullable());
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
  otp: async (phone, purpose) => {
    await post("/auth/otp", z.null(), { phone, purpose });
  },
  login: (input) => post("/auth/login", sessionSchema, input),
  logout: async () => {
    await post("/auth/logout", z.null(), {});
  },
  reset: async (input) => {
    await post("/auth/reset-password", z.null(), input);
  },
  enterprises: (query) =>
    http(
      `/enterprises?q=${encodeURIComponent(query)}`,
      z.array(enterpriseSchema),
    ),
  apply: (input, key) =>
    http("/enterprise-applications", sessionSchema, {
      method: "POST",
      body: form(input),
      headers: { "Idempotency-Key": key },
    }),
  request: (input, key) =>
    http("/service-requests", receiptSchema, {
      method: "POST",
      body: form(input),
      headers: { "Idempotency-Key": key },
    }),
  receipts: () => http("/service-requests", z.array(receiptSchema)),
  updateProfile: (name) =>
    http("/account/profile", sessionSchema, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
};
export const gateway: Gateway = __DEMO__
  ? (await import("../dev/mockGateway")).mockGateway
  : api;
