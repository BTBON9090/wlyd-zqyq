import { z } from "zod";
import { catalogue } from "./catalogue";
import { readStored, removeStored, writeStored } from "../lib/storage";
import {
  demandSchema,
  receiptSchema,
  sessionSchema,
  type Gateway,
  type Session,
} from "../lib/models";
export const demoControls = {
  fault: "none" as "none" | "error" | "empty",
  failNext: false,
  skipped: [] as string[],
};
const accountsSchema = z.record(
  z.string(),
  z.object({ session: sessionSchema, digest: z.string().optional() }),
);
const accounts = () => readStored("accounts", accountsSchema, {});
let current = readStored("session", sessionSchema.nullable(), null);
const otpRecords = new Map<
  string,
  { expires: number; sentAt: number; attempts: number }
>();
const requests = new Map<string, unknown>();
export function setDemoSession(session: Session | null) {
  current = session;
  writeStored("session", session);
  if (session) {
    const all = accounts();
    all[session.phone] = { ...all[session.phone], session };
    writeStored("accounts", all);
  }
}
async function pause(signal?: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    const done = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timer = setTimeout(done, 360);
    const abort = () => {
      clearTimeout(timer);
      reject(new Error("请求已取消"));
    };
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
  });
  if (!navigator.onLine) throw new Error("网络已断开，请联网后重试");
  if (demoControls.failNext) {
    demoControls.failNext = false;
    throw new Error("本次提交失败，请重试。已填写内容仍然保留。");
  }
}
function verify(phone: string, otp?: string, purpose = "login") {
  if (demoControls.skipped.includes("otp")) return;
  const entry = otpRecords.get(`${phone}:${purpose}`);
  if (!entry || entry.expires < Date.now())
    throw new Error("请先获取验证码，验证码 5 分钟内有效");
  if (entry.attempts >= 5) throw new Error("验证次数过多，请重新获取验证码");
  entry.attempts++;
  if (otp !== "123456") throw new Error("验证码不正确，请重新输入");
  otpRecords.delete(`${phone}:${purpose}`);
}
async function hash(phone: string, password: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${phone}:${password}`),
  );
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function requireSession() {
  if (!current) throw new Error("请先登录后继续");
  return current;
}
function durable(key: string, value: unknown) {
  if (!writeStored(key, value))
    throw new Error("浏览器无法保存数据，请允许本地存储后重试");
}
export const mockGateway: Gateway = {
  demands: async () => {
    await pause();
    const user = requireSession();
    return readStored(`demands:${user.id}`, z.array(demandSchema), []);
  },
  publishDemand: async (input, key) => {
    await pause();
    const user = requireSession();
    if (requests.has(key))
      return requests.get(key) as z.infer<typeof demandSchema>;
    const demand = demandSchema.parse({
      ...input,
      id: `XQ${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "published",
    });
    const list = readStored(`demands:${user.id}`, z.array(demandSchema), []);
    durable(`demands:${user.id}`, [demand, ...list]);
    requests.set(key, demand);
    return demand;
  },
  updateProfile: async (name) => {
    await pause();
    const user = requireSession();
    const cleaned = z.string().trim().min(2).max(30).parse(name);
    const next = { ...user, name: cleaned };
    setDemoSession(next);
    return next;
  },
  services: async (signal) => {
    await pause(signal);
    if (demoControls.fault === "error")
      throw new Error("服务加载失败，请稍后重试");
    return demoControls.fault === "empty" ? [] : catalogue;
  },
  service: async (id, signal) => {
    await pause(signal);
    const service = catalogue.find((s) => s.id === id);
    if (!service) throw new Error("该服务不存在或已下架");
    return service;
  },
  session: async () => current,
  otp: async (phone, purpose) => {
    await pause();
    const key = `${phone}:${purpose}`;
    const last = otpRecords.get(key);
    if (last && Date.now() - last.sentAt < 60_000)
      throw new Error("请稍后再获取验证码");
    otpRecords.set(key, {
      expires: Date.now() + 300_000,
      sentAt: Date.now(),
      attempts: 0,
    });
  },
  login: async (input) => {
    await pause();
    const all = accounts();
    const phone = input.phone || "13800000000";
    let account = all[phone];
    if (input.mode === "password") {
      if (
        !demoControls.skipped.includes("password") &&
        (!account?.digest ||
          account.digest !== (await hash(phone, input.password || "")))
      )
        throw new Error("手机号或密码不正确，请使用验证码登录");
    } else
      verify(
        phone,
        input.otp,
        input.mode === "register" ? "register" : "login",
      );
    account ??= {
      session: {
        id: crypto.randomUUID(),
        phone,
        name: "园区用户",
        enterpriseStatus: "none",
      },
    };
    if (input.mode === "register" && input.password)
      account.digest = await hash(phone, input.password);
    all[phone] = account;
    durable("accounts", all);
    setDemoSession(account.session);
    return account.session;
  },
  logout: async () => {
    await pause();
    setDemoSession(null);
    removeStored("session");
  },
  reset: async (input) => {
    await pause();
    const all = accounts();
    verify(input.phone, input.otp, "reset");
    if (!all[input.phone]) throw new Error("该手机号尚未注册，请先注册账号");
    all[input.phone].digest = await hash(input.phone, input.password);
    durable("accounts", all);
    setDemoSession(null);
  },
  enterprises: async (query) => {
    await pause();
    return [
      { id: "e1", name: "临港精密制造有限公司", park: "经开区" },
      { id: "e2", name: "智造云科信息技术有限公司", park: "经开区" },
      { id: "e3", name: "正衡企业管理有限公司", park: "经开区" },
    ].filter((e) => e.name.includes(query));
  },
  apply: async (input, key) => {
    await pause();
    const user = requireSession();
    if (requests.has(key)) return requests.get(key) as Session;
    if (user.enterpriseStatus === "pending")
      throw new Error("您已有待审核申请，请等待审核结果");
    if (
      input.type === "invite" &&
      input.inviteCode !== "PARK2026" &&
      !demoControls.skipped.includes("inviteCode")
    )
      throw new Error("邀请码无效，请向园区运营人员核实");
    const next: Session = {
      ...user,
      enterprise: input.enterprise || "验收示例企业",
      name: input.contactName || "验收用户",
      enterpriseStatus: "pending",
      applicationId: `QY${Date.now()}`,
    };
    setDemoSession(next);
    requests.set(key, next);
    return next;
  },
  request: async (input, key) => {
    await pause();
    const user = requireSession();
    if (requests.has(key))
      return requests.get(key) as z.infer<typeof receiptSchema>;
    const service = catalogue.find((s) => s.id === input.serviceId);
    if (!service) throw new Error("该服务已下架，请选择其他服务");
    const version = service.published?.versions.find(
      (v) => v.id === input.versionId,
    );
    if (input.versionId && !version)
      throw new Error("所选服务规格已变更，请返回重新选择");
    const receipt = {
      id: `FW${Date.now()}`,
      serviceId: service.id,
      serviceName: service.name,
      versionId: version?.id,
      versionName: version?.name,
      quantity: z
        .number()
        .int()
        .min(1)
        .max(99)
        .parse(input.quantity ?? 1),
      createdAt: new Date().toISOString(),
      status: "submitted" as const,
      contactName: input.contactName || "验收用户",
      phone: input.phone || user.phone,
      requirement: input.requirement || "验收示例需求，请忽略本次测试数据。",
    };
    const list = readStored(`receipts:${user.id}`, z.array(receiptSchema), []);
    durable(`receipts:${user.id}`, [receipt, ...list]);
    requests.set(key, receipt);
    return receipt;
  },
  receipts: async () => {
    await pause();
    const user = requireSession();
    return readStored(`receipts:${user.id}`, z.array(receiptSchema), []);
  },
};
