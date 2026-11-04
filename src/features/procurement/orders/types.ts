import { z } from "zod";

// 候选客户端契约；正式接口、鉴权与订单状态仍需后端确认。
export const orderItemSchema=z.object({id:z.string(),productId:z.string().optional(),name:z.string(),sku:z.string(),brand:z.string().optional(),model:z.string().optional(),spec:z.string(),unit:z.string(),quantity:z.number().int().positive(),price:z.number().nonnegative(),shipped:z.number().int().nonnegative(),image:z.string().optional(),remark:z.string().optional()});
export const shipmentSchema=z.object({id:z.string(),company:z.string(),tracking:z.string(),time:z.string(),autoReceiveAt:z.string().optional(),received:z.boolean(),lines:z.array(z.object({itemId:z.string(),quantity:z.number().int().positive()}))});
export const orderSchema=z.object({id:z.string(),supplier:z.string(),created:z.string(),status:z.enum(["pending_pay","pending_ship","shipped","received","completed","cancelled"]),receiver:z.string(),phone:z.string(),address:z.string(),note:z.string().optional(),paymentDeadline:z.string().optional(),paidAt:z.string().optional(),receivedAt:z.string().optional(),items:z.array(orderItemSchema),shipments:z.array(shipmentSchema)});
export type ProcurementOrder=z.infer<typeof orderSchema>;
export type OrderItem=z.infer<typeof orderItemSchema>;
export type Shipment=z.infer<typeof shipmentSchema>;
export type DisplayStatus=ProcurementOrder["status"]|"partial";
export const statusLabels:Record<DisplayStatus,string>={pending_pay:"待支付",pending_ship:"待发货",partial:"部分发货",shipped:"已发货",received:"已签收",completed:"已完成",cancelled:"已取消"};
export function orderStatus(order:ProcurementOrder):DisplayStatus {return order.status==="pending_ship"&&order.items.some(item=>item.shipped>0)?"partial":order.status;}
export const orderTotal=(order:ProcurementOrder)=>order.items.reduce((sum,item)=>sum+item.price*item.quantity,0);
export type OrderAction={type:"cancel";orderId:string}|{type:"simulatePayment";orderId:string}|{type:"receiveShipment";orderId:string;shipmentId:string}|{type:"receiveBatch";orderId:string;shipmentIds:string[]};
export type NewOrder={supplier:string;receiver:string;phone:string;address:string;note:string;items:OrderItem[]};
