import { z } from "zod";
import { publishedServiceSchema } from "./publishedService";
export const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
  category: z.string(),
  desc: z.string(),
  overview: z.string(),
  features: z.array(z.string()),
  price: z.string(),
  priceMin: z.number().nonnegative(),
  provider: z.string(),
  delivery: z.string(),
  hot: z.boolean().optional(),
  publishedAt: z.string(),
  image: z.string().optional(),
  published: publishedServiceSchema.optional(),
});
export type Service = z.infer<typeof serviceSchema>;
export const sessionSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string(),
  enterprise: z.string().optional(),
  enterpriseStatus: z
    .enum(["none", "pending", "approved", "rejected"])
    .default("none"),
  applicationId: z.string().optional(),
  reviewNote: z.string().optional(),
});
export type Session = z.infer<typeof sessionSchema>;
export const receiptSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  createdAt: z.string(),
  status: z.enum(["submitted", "contacting", "closed"]),
  contactName: z.string(),
  phone: z.string(),
  requirement: z.string(),
  versionId: z.string().optional(),
  versionName: z.string().optional(),
  quantity: z.number().int().positive().optional(),
});
export type Receipt = z.infer<typeof receiptSchema>;
export const enterpriseSchema = z.object({
  id: z.string(),
  name: z.string(),
  park: z.string(),
});
export type Enterprise = z.infer<typeof enterpriseSchema>;
export const phoneSchema = z
  .string()
  .regex(/^1[3-9]\d{9}$/, "请输入正确的 11 位手机号");
export const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .max(64, "密码最多 64 位")
  .regex(/(?=.*[A-Za-z])(?=.*\d)/, "密码需同时包含字母和数字");
export const loginSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, "请输入 6 位验证码"),
  agreed: z.literal(true, { error: "请阅读并同意服务协议和隐私政策" }),
});
export const requestSchema = z.object({
  contactName: z
    .string()
    .trim()
    .min(2, "请填写至少 2 个字的联系人姓名")
    .max(30),
  phone: phoneSchema,
  requirement: z
    .string()
    .trim()
    .min(10, "请至少填写 10 个字，便于服务商理解需求")
    .max(1000, "需求不能超过 1000 字"),
  agreed: z.literal(true, { error: "请同意将需求与联系方式提供给该服务商" }),
});
export const applicationSchema = z.object({
  enterprise: z.string().trim().min(4, "请填写完整的企业名称"),
  contactName: z.string().trim().min(2, "请填写联系人姓名"),
  creditCode: z
    .string()
    .regex(/^[0-9A-HJ-NPQRTUWXY]{18}$/, "请输入 18 位统一社会信用代码"),
  agreed: z.literal(true, { error: "请确认提交资料真实，并同意入驻协议" }),
});
export interface LoginInput {
  phone: string;
  mode: "sms" | "password" | "register";
  otp?: string;
  password?: string;
  agreed: boolean;
}
export interface RequestInput {
  serviceId: string;
  versionId?: string;
  quantity?: number;
  contactName: string;
  phone: string;
  requirement: string;
  agreed: boolean;
  file?: File;
}
export interface ApplicationInput {
  type: "create" | "join" | "invite";
  enterprise: string;
  enterpriseId?: string;
  creditCode?: string;
  contactName: string;
  inviteCode?: string;
  agreed: boolean;
  file?: File;
}
export const demandSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  requirement: z.string(),
  budget: z.string(),
  createdAt: z.string(),
  status: z.enum(["published", "closed"]),
});
export type Demand = z.infer<typeof demandSchema>;
export type DemandInput = Pick<
  Demand,
  "title" | "category" | "requirement" | "budget"
>;
export interface Gateway {
  demands(): Promise<Demand[]>;
  publishDemand(input: DemandInput, key: string): Promise<Demand>;
  services(signal?: AbortSignal): Promise<Service[]>;
  service(id: string, signal?: AbortSignal): Promise<Service>;
  session(): Promise<Session | null>;
  otp(phone: string, purpose: string): Promise<void>;
  login(input: LoginInput): Promise<Session>;
  logout(): Promise<void>;
  reset(input: { phone: string; otp: string; password: string }): Promise<void>;
  enterprises(query: string): Promise<Enterprise[]>;
  apply(input: ApplicationInput, key: string): Promise<Session>;
  request(input: RequestInput, key: string): Promise<Receipt>;
  receipts(): Promise<Receipt[]>;
  updateProfile(name: string): Promise<Session>;
}
