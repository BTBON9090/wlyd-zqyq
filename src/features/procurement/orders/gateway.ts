import { z } from "zod";
import { UAT } from "../../../uat/api";
import { http } from "../../../lib/api";
import { SHARED_PROCUREMENT, sharedRequest } from "../sharedApi";
import { orderSchema, type NewOrder, type OrderAction, type ProcurementOrder } from "./types";

// 写操作只在预览演示中开放；真实交易接口尚未确认。
export type OrdersGateway={list:(userId:string)=>Promise<ProcurementOrder[]>;act:(userId:string,action:OrderAction)=>Promise<void>;create:(userId:string,orders:NewOrder[],idempotencyKey?:string)=>Promise<string[]>};
const api:OrdersGateway={
  list:()=>http("/procurement/orders",z.array(orderSchema)),
  act:async()=>{throw new Error("订单操作尚未接入真实服务");},
  create:async()=>{throw new Error("订单提交尚未接入真实服务");},
};
const shared:OrdersGateway = {
  list: () => sharedRequest("/orders", z.array(orderSchema)),
  create: async (_userId, orders, idempotencyKey) => (await sharedRequest("/orders", z.object({ids:z.array(z.string())}), {method:"POST", headers: UAT && idempotencyKey ? {"Idempotency-Key": idempotencyKey} : undefined, body:JSON.stringify({orders})})).ids,
  act: async (_userId, action) => { await sharedRequest("/orders/action", z.unknown(), {method:"POST", body:JSON.stringify(action)}); },
};
export const ordersGateway:OrdersGateway=SHARED_PROCUREMENT?shared:__DEMO__?(await import("../../../dev/procurement/mockOrders")).mockOrdersGateway:api;
