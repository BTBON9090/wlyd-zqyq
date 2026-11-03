import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MagnifyingGlass, Package, Truck } from "@phosphor-icons/react";
import { AdaptiveTabs } from "../../../components/AdaptiveTabs";
import { ContentImage } from "../../../components/ContentImage";
import { EmptyState, Modal } from "../../../components/ui";
import { currency } from "../../../lib/money";
import { ordersGateway } from "./gateway";
import { orderStatus, orderTotal, statusLabels, type OrderAction, type ProcurementOrder } from "./types";
import "./orders.css";

const filters=[['all','全部'],['pending_pay','待支付'],['pending_ship','待发货'],['partial','部分发货'],['shipped','已发货'],['received','已签收'],['completed','已完成'],['cancelled','已取消']] as const;
export default function ProcurementOrders({userId}:{userId:string}){
 const client=useQueryClient(); const [params,setParams]=useSearchParams();
 const query=useQuery({queryKey:["procurement-orders",userId],queryFn:()=>ordersGateway.list(userId),retry:false});
 const [filter,setFilter]=useState("all"),[search,setSearch]=useState(""),[action,setAction]=useState<OrderAction|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const orders=query.data||[]; const order=orders.find(o=>o.id===params.get("order"));
 const filtered=orders.filter(o=>(filter==="all"||orderStatus(o)===filter)&&[o.id,o.supplier,...o.items.map(i=>`${i.name} ${i.sku}`)].join(" ").toLowerCase().includes(search.trim().toLowerCase()));
 const open=(id:string)=>{const next=new URLSearchParams(params);next.set("order",id);setParams(next);window.scrollTo({top:0,behavior:"instant"});};
 const back=()=>{const next=new URLSearchParams(params);next.delete("order");setParams(next);};
 async function runAction(){if(!action||busy)return;setBusy(true);setError("");try{await ordersGateway.act(userId,action);await client.invalidateQueries({queryKey:["procurement-orders",userId]});setAction(null);}catch(e){setError(e instanceof Error?e.message:"操作失败，请重试");}finally{setBusy(false);}}
 const actionLabel=action?.type==="cancel"?"取消订单":action?.type==="simulatePayment"?"模拟支付": "确认签收";
 if(query.isPending)return <div className="v3-account-loading" role="status">正在加载集采订单…</div>;
 if(query.isError)return <EmptyState error title="订单暂时无法加载" description={query.error.message} action="重新加载" onAction={()=>void query.refetch()}/>;
 return <div className="po-workspace">
  {__DEMO__&&<div className="po-demo-note">演示数据 · 订单与操作仅保存在当前浏览器，不产生真实支付，也未与供应商端同步。</div>}
  {params.has("order") ? order ? <OrderDetails order={order} back={back} onAction={setAction}/> : <div className="po-empty"><h2>未找到订单</h2><p>订单不存在或当前账号无权查看。</p><button className="button secondary" onClick={back}>返回订单</button></div> : <>
   <div className="po-toolbar" data-list-sticky><AdaptiveTabs label="订单状态" value={filter} onChange={setFilter} items={filters.map(([value,label])=>({value,label,count:value==="all"?orders.length:orders.filter(o=>orderStatus(o)===value).length}))}/><label className="po-search"><MagnifyingGlass size={17}/><input aria-label="搜索集采订单" placeholder="搜索订单号、商品名称或编码" value={search} onChange={e=>setSearch(e.target.value)} maxLength={100}/></label></div>
   {!filtered.length?<div className="po-empty"><Package size={38}/><h2>{orders.length?"暂无匹配的订单":"暂无集采订单"}</h2><p>{orders.length?"试试其他状态或关键词。":"在集采商城选购物资后，可在这里跟进订单。"}</p><Link className="button secondary" to="/procurement">前往集采商城</Link></div>:<div className="po-list">{filtered.map(o=><article className="po-card" key={o.id}><header><span>订单号：<strong>{o.id}</strong></span><time>{o.created}</time><span className={`po-status po-status-${orderStatus(o)}`}>{statusLabels[orderStatus(o)]}</span></header><div className="po-card-body"><div className="po-card-items">{o.items.map(item=><div className="po-item" key={item.id}><ContentImage src={item.image} alt={item.name} placeholder="暂无图片"/><div><strong>{item.name}</strong><small>{item.spec || item.sku} · {item.quantity} {item.unit}</small></div></div>)}<p>{o.supplier}</p></div><div className="po-card-total"><small>商品金额（含税）</small><strong>{currency(orderTotal(o))}</strong></div></div><footer><button className="po-text-button" onClick={()=>open(o.id)}>订单详情</button>{o.status==="pending_pay"&&<>{__DEMO__&&<button className="button primary" onClick={()=>setAction({type:"simulatePayment",orderId:o.id})}>模拟支付</button>}<button className="po-text-button" disabled={!__DEMO__} onClick={()=>setAction({type:"cancel",orderId:o.id})}>取消订单</button></>}{o.shipments.length>0&&<button className="po-text-button" onClick={()=>open(o.id)}>查看发货</button>}</footer></article>)}</div>}
  </>}
  <Modal open={!!action} onOpenChange={v=>{if(!v&&!busy){setAction(null);setError("");}}} title={actionLabel}>
    <div className="po-confirm"><p>{action?.type==="simulatePayment"?"仅在本地演示将订单切换为待发货，不会发起真实支付。":action?.type==="cancel"?"确定取消该演示订单？取消后将无法支付。":"确认收到该批次演示商品？"}</p>{error&&<p role="alert" className="po-error">{error}</p>}<div><button className="button secondary" disabled={busy} onClick={()=>setAction(null)}>返回</button><button className="button primary" disabled={busy} onClick={()=>void runAction()}>{busy?"处理中…":action?.type==="receiveShipment"?"确认签收":`确认${actionLabel}`}</button></div></div>
  </Modal>
 </div>;
}
function OrderDetails({order,back,onAction}:{order:ProcurementOrder;back:()=>void;onAction:(a:OrderAction)=>void}){
 const status=orderStatus(order), stages=["提交订单","支付","发货","签收","完成"];
 const stage=order.status==="pending_pay"?0:order.status==="pending_ship"?1:order.status==="shipped"?2:order.status==="received"?3:order.status==="completed"?4:0;
 return <><div className="po-detail-heading"><button className="po-text-button" onClick={back}><ArrowLeft size={16}/> 返回订单列表</button><div><h2>订单详情</h2><span className={`po-status po-status-${status}`}>{statusLabels[status]}</span></div><p>订单号：{order.id}　·　下单时间：{order.created}</p></div>
  {order.status!=="cancelled"&&<ol className="po-steps">{stages.map((name,i)=><li key={name} className={i<=stage?"active":""}><b>{i+1}</b><span>{name}</span></li>)}</ol>}
  <div className="po-detail-grid"><div className="po-detail-main"><section className="po-panel"><h3><Package size={18}/> 商品信息</h3><div className="po-items-table"><table><thead><tr><th>商品 / 编码</th><th>含税单价</th><th>数量</th><th>已发 / 待发</th><th>小计</th></tr></thead><tbody>{order.items.map(item=><tr key={item.id}><td><strong>{item.name}</strong><small>{item.spec} · {item.sku}</small>{item.remark&&<small>备注：{item.remark}</small>}</td><td>{currency(item.price)}</td><td>{item.quantity} {item.unit}</td><td>{item.shipped} / {Math.max(0,item.quantity-item.shipped)}</td><td>{currency(item.price*item.quantity)}</td></tr>)}</tbody></table></div></section>
  <section className="po-panel"><h3><Truck size={18}/> 发货信息</h3>{!order.shipments.length?<p className="po-muted">暂无发货记录</p>:order.shipments.map(s=><div className="po-shipment" key={s.id}><div><strong>{s.company}</strong><span>{s.received?"已签收":"运输中"}</span></div><p>物流单号：{s.tracking||"—"}　·　发货时间：{s.time}</p><ul>{s.lines.map((line,i)=>{const item=order.items.find(x=>x.id===line.itemId);return <li key={i}>{item?.name||"商品"}　× {line.quantity} {item?.unit}</li>;})}</ul>{!s.received&&["pending_ship","shipped"].includes(order.status)&&<button className="button secondary" disabled={!__DEMO__} onClick={()=>onAction({type:"receiveShipment",orderId:order.id,shipmentId:s.id})}>确认本批签收{__DEMO__?"（演示）":""}</button>}</div>)}</section>
  <section className="po-panel"><h3>收货信息</h3><dl className="po-facts"><div><dt>收货人</dt><dd>{order.receiver}</dd></div><div><dt>联系电话</dt><dd>{order.phone}</dd></div><div><dt>收货地址</dt><dd>{order.address}</dd></div><div><dt>采购备注</dt><dd>{order.note||"—"}</dd></div></dl></section></div>
  <aside><section className="po-panel"><h3>订单信息</h3><dl className="po-facts"><div><dt>订单编号</dt><dd>{order.id}</dd></div><div><dt>供应商</dt><dd>{order.supplier}</dd></div><div><dt>下单时间</dt><dd>{order.created}</dd></div><div><dt>支付时间</dt><dd>{order.paidAt||"—"}</dd></div><div><dt>签收时间</dt><dd>{order.receivedAt||"—"}</dd></div></dl></section><section className="po-panel"><h3>费用明细</h3><div className="po-total-line"><span>商品金额（含税）</span><strong>{currency(orderTotal(order))}</strong></div><p className="po-muted">运费以实际确认为准</p>{order.status==="pending_pay"&&__DEMO__&&<button className="button primary po-full" onClick={()=>onAction({type:"simulatePayment",orderId:order.id})}>模拟支付</button>}</section></aside></div>
 </>;
}
