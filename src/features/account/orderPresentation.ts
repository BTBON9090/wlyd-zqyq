import type { Order } from "./accountModels";

/** Keep cumulative receipts, refunded money and contractual balance distinct. */
export function orderAmounts(
  order: Pick<Order, "total" | "discount" | "paid" | "refunded">,
) {
  const cents = (amount: number) => Math.round(amount * 100);
  const payable = Math.max(0, cents(order.total) - cents(order.discount ?? 0));
  const remaining = Math.max(0, payable - cents(order.paid));
  return {
    payable: payable / 100,
    remaining: remaining / 100,
    netPaid: Math.max(0, cents(order.paid) - cents(order.refunded)) / 100,
    paymentLabel:
      order.paid === 0 ? "未付款" : remaining === 0 ? "已结清" : "部分付款",
  };
}

export function acceptanceTime(deadline: string, now: number) {
  const seconds = Math.max(0, Math.floor((Date.parse(deadline) - now) / 1000));
  if (!Number.isFinite(seconds) || seconds === 0) return null;
  return `${Math.floor(seconds / 86400)}天 ${String(Math.floor(seconds / 3600) % 24).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
