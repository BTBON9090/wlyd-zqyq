import { z } from "zod";
import { http } from "../../../lib/api";
import { orderSchema, type NewOrder, type OrderAction, type ProcurementOrder } from "./types";

// 写操作只在预览演示中开放；真实交易接口尚未确认。
export type OrdersGateway={list:(userId:string)=>Promise<ProcurementOrder[]>;act:(userId:string,action:OrderAction)=>Promise<void>;create:(userId:string,orders:NewOrder[])=>Promise<string[]>};
const api:OrdersGateway={
  list:()=>http("/procurement/orders",z.array(orderSchema)),
  act:async()=>{throw new Error("订单操作尚未接入真实服务");},
  create:async()=>{throw new Error("订单提交尚未接入真实服务");},
};
export const ordersGateway:OrdersGateway=__DEMO__?(await import("../../../dev/procurement/mockOrders")).mockOrdersGateway:api;
