import type { OrdersGateway } from "../../features/procurement/orders/gateway";
import type { NewOrder, OrderAction, ProcurementOrder } from "../../features/procurement/orders/types";

const key=(user:string)=>`park-procurement-orders-demo-v1:${user}`;
function sample():ProcurementOrder[] {
 const shared={supplier:"园区集采供应商（演示）",receiver:"演示收货人",phone:"13800000000",address:"园区企业收货地址（演示）"};
 const item=(id:string,name:string,quantity:number,price:number,shipped:number)=>({id,productId:`JC-PRODUCT-${id}`,name,sku:`SKU-100${id}`,spec:"标准款",unit:"件",quantity,price,shipped});
 return [
  {...shared,id:"JC-DEMO-001",created:"2026/10/20 10:30",status:"pending_ship",items:[item("001","工业防护手套",100,18.5,20),item("002","安全防护眼镜",30,25,0)],shipments:[{id:"DEMO-SHIP-001",company:"顺丰速运（演示）",tracking:"DEMO2026102001",time:"2026/10/21 10:00",received:false,lines:[{itemId:"001",quantity:20}]}]},
  {...shared,id:"JC-DEMO-002",created:"2026/10/19 14:20",status:"pending_pay",items:[item("003","工业安全帽",50,48,0)],shipments:[]},
  {...shared,id:"JC-DEMO-003",created:"2026/10/15 09:15",status:"shipped",items:[item("004","防护口罩",20,32,20)],shipments:[
    {id:"DEMO-SHIP-003",company:"顺丰速运",tracking:"SF54971101001",time:"2026/11/01 10:10",received:true,lines:[{itemId:"004",quantity:4}]},
    {id:"DEMO-SHIP-003-B",company:"德邦快递",tracking:"DB54971102002",time:"2026/11/02 12:45",autoReceiveAt:"2026/11/09 12:45",received:false,lines:[{itemId:"004",quantity:10}]},
    {id:"DEMO-SHIP-003-C",company:"京东物流",tracking:"JD54971102003",time:"2026/11/02 16:20",autoReceiveAt:"2026/11/09 16:20",received:false,lines:[{itemId:"004",quantity:6}]}
  ]},
  ...(["pending_ship","received","completed","cancelled"] as const).map((status,index):ProcurementOrder=>({...shared,id:`JC-DEMO-00${index+4}`,created:`2026/10/${14-index} 10:30`,status,items:[item(`00${index+5}`,["工业清洁剂","防护眼镜","安全警示牌","绝缘手套"][index],10,68,status==="received"||status==="completed"?10:0)],shipments:[]}))
 ];
}
function read(user:string):ProcurementOrder[]{try{const raw=localStorage.getItem(key(user));if(raw){const data:unknown=JSON.parse(raw);if(Array.isArray(data))return data as ProcurementOrder[];}}catch{}return sample();}
function save(user:string,orders:ProcurementOrder[]){localStorage.setItem(key(user),JSON.stringify(orders));}
const now=()=>new Date().toLocaleString("zh-CN",{hour12:false});
function create(user:string,entries:NewOrder[]){const all=read(user);const ids=entries.map((entry)=>{const id=`JC-DEMO-${Date.now()}-${crypto.randomUUID().slice(0,6).toUpperCase()}`;all.unshift({...entry,id,created:now(),paymentDeadline:new Date(Date.now()+15*3600_000).toISOString(),status:"pending_pay",shipments:[]});return id;});save(user,all);return ids;}
function act(user:string,action:OrderAction){const all=read(user);const order=all.find(o=>o.id===action.orderId);if(!order)throw new Error("订单不存在");
 if(action.type==="cancel"){if(order.status!=="pending_pay")throw new Error("当前状态不可取消");order.status="cancelled";}
 else if(action.type==="simulatePayment"){if(order.status!=="pending_pay")throw new Error("当前状态不可模拟支付");if(order.paymentDeadline&&Date.parse(order.paymentDeadline)<=Date.now())throw new Error("支付时间已到");order.status="pending_ship";order.paidAt=now();}
 else {
   const ids=action.type==="receiveBatch"?action.shipmentIds:[action.shipmentId];
   const selected=ids.map(id=>order.shipments.find(s=>s.id===id));
   if(!selected.length||!["pending_ship","shipped"].includes(order.status)||selected.some(s=>!s||s.received))throw new Error("所选批次中有不可签收的发货记录，请刷新订单后重试");
   for(const shipment of selected)if(shipment){shipment.received=true;shipment.receivedAt=now();}
   if(order.status==="shipped"&&order.shipments.every(s=>s.received)){order.status="received";order.receivedAt=now();}
 }
 save(user,all);
}
export const mockOrdersGateway:OrdersGateway={list:async user=>read(user),create:async(user,entries)=>create(user,entries),act:async(user,action)=>act(user,action)};
