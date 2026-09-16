import { z } from "zod";
export const orderStatus = { pending: "待确认", signing: "待签约", serving: "服务中", accepting: "待验收", completed: "已完成", closed: "已关闭" };
export const refundStatus = { processing: "处理中", refunded: "已退款", rejected: "被驳回", cancelled: "已取消" };
export const invoiceStatus = { available: "待开票", processing: "开票中", issued: "已开票" };
export const orderSchema = z.object({
  id: z.string(), serviceId: z.string(), name: z.string(), provider: z.string(), image: z.string().optional(),
  category: z.string(), spec: z.string(), quantity: z.number().int().positive(), total: z.number().nonnegative(), paid: z.number().nonnegative(),
  refunded: z.number().nonnegative(), createdAt: z.string(), deliveryDays: z.number(), phases: z.number(),
  discount: z.number().nonnegative().optional(),
  paymentMode: z.enum(["once", "installments"]).optional(),
  payments: z.array(z.object({ label: z.string(), amount: z.number().nonnegative(), paidAt: z.string() })).optional(),
  acceptanceDeadline: z.string().datetime({ offset: true }).optional(),
  autoAccept: z.boolean().optional(),
  status: z.enum(["pending", "signing", "serving", "accepting", "completed", "closed"]),
  progress: z.array(z.object({ title: z.string(), date: z.string(), detail: z.string() })),
});
export const refundSchema = z.object({ id: z.string(), orderId: z.string(), name: z.string(), provider: z.string(), amount: z.number(), reason: z.string(), note: z.string(), createdAt: z.string(), status: z.enum(["processing", "refunded", "rejected", "cancelled"]) });
export const invoiceSchema = z.object({ id: z.string(), orderId: z.string(), status: z.enum(["available", "processing", "issued"]), amount: z.number(), title: z.string().optional(), taxId: z.string().optional(), email: z.string().optional(), number: z.string().optional(), issuedAt: z.string().optional(), fileUrl: z.string().optional() });
export const accountDataSchema = z.object({ orders: z.array(orderSchema), refunds: z.array(refundSchema), invoices: z.array(invoiceSchema) });
export type Order = z.infer<typeof orderSchema>;
export type Refund = z.infer<typeof refundSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type AccountData = z.infer<typeof accountDataSchema>;
export type AccountAction =
  | { type: "accept"; orderId: string }
  | { type: "refund"; orderId: string; amount: number; reason: string; refundId?: string }
  | { type: "cancelRefund"; refundId: string }
  | { type: "invoice"; invoiceId: string; title: string; taxId: string; email: string };
export interface AccountGateway { load(): Promise<AccountData>; act(action: AccountAction, key: string): Promise<AccountData> }
