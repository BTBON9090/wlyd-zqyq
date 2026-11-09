import type { OrderAction, ProcurementOrder } from "./types";

/** Describe the server-refreshed result, including partial deliveries. */
export function receiptFeedback(
  order: ProcurementOrder | undefined,
  action: Extract<OrderAction, { type: "receiveShipment" | "receiveBatch" }>,
) {
  if (!order) return "签收已完成，请刷新页面查看最新订单状态。";
  if (order.status === "received" || order.status === "completed") {
    return "签收成功，该订单全部商品已收齐。";
  }
  const count = action.type === "receiveBatch" ? action.shipmentIds.length : 1;
  const outstanding = order.shipments.filter(shipment => !shipment.received).length;
  if (outstanding) return `已签收 ${count} 批商品，还有 ${outstanding} 批待签收。`;
  if (order.items.some(item => item.shipped < item.quantity)) {
    return `已签收 ${count} 批商品，剩余商品待供应商发货。`;
  }
  return `已签收 ${count} 批商品，订单状态已更新。`;
}
