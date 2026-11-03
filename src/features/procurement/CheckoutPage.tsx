import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "../../app/AppProvider";
import { ordersGateway } from "./orders/gateway";
import type { NewOrder } from "./orders/types";
import { ArrowLeft, MapPin, Storefront } from "@phosphor-icons/react";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState } from "../../components/ui";
import { currency } from "../../lib/money";
import { useCart } from "./cart";
import { validQuantity } from "./model";
import { useProducts } from "./catalogue";
import { MarketHeader } from "./MarketHeader";

export default function CheckoutPage() {
  const cart=useCart(); const query=useProducts(); const [params]=useSearchParams(); const navigate=useNavigate(); const client=useQueryClient();
  const {session,openAuth}=useApp(); const [error,setError]=useState(""); const [pending,setPending]=useState(false);
  const [receiver,setReceiver]=useState(""); const [phone,setPhone]=useState("");
  const [address,setAddress]=useState(""); const [note,setNote]=useState("");
  const direct=params.get("product"); const quantity=Number(params.get("quantity"));
  const checkoutItems=direct ? [{productId:direct,quantity,selected:true,remark:""}] : cart.items.filter((item)=>item.selected);
  const rows=checkoutItems.map((item)=>({item,product:query.data?.find((p)=>p.id===item.productId)}));
  const allValid=rows.length>0 && rows.every(({item,product})=>product && validQuantity(product,item.quantity));
  const total=rows.reduce((sum,{item,product})=>sum+(product ? product.price*item.quantity : 0),0);
  async function submitDemo() {
    if(!__DEMO__||pending||!allValid)return;
    if(!session){openAuth({returnTo:window.location.pathname+window.location.search});return;}
    if(!receiver.trim()||!phone.trim()||!address.trim()){setError("请填写完整的收货人、联系电话和详细地址。");return;}
    if(!/^[+\d][\d -]{5,19}$/.test(phone.trim())){setError("请填写有效的联系电话。");return;}
    setPending(true);setError("");
    try {
      const groups=new Map<string,NewOrder>();
      for(const {item,product} of rows){if(!product)continue;const supplier=product.supplierName;let group=groups.get(product.supplierId);if(!group){group={supplier,receiver:receiver.trim(),phone:phone.trim(),address:address.trim(),note:note.trim(),items:[]};groups.set(product.supplierId,group);}group.items.push({id:product.id,productId:product.id,name:product.name,sku:product.sku,spec:product.spec,unit:product.unit,quantity:item.quantity,price:product.price,shipped:0,image:product.image,remark:item.remark});}
      const ids=await ordersGateway.create(session.id,[...groups.values()]);
      if(!direct)cart.remove(checkoutItems.map(item=>item.productId));
      await client.invalidateQueries({queryKey:["procurement-orders",session.id]});
      navigate(ids.length===1?`/account/orders/procurement?order=${encodeURIComponent(ids[0])}`:"/account/orders/procurement");
    }catch(e){setError(e instanceof Error?e.message:"演示订单暂时无法提交");}finally{setPending(false);}
  }
  return <><MarketHeader/><div className="commerce-container procurement-checkout">
    <Breadcrumb items={[{label:"集采商城",to:"/procurement"},{label:"购物车",to:"/procurement/cart"},{label:"确认采购信息"}]}/>
    <div className="procurement-page-heading"><div><span>集采商城</span><h1>确认采购信息</h1><p>核对商品、数量和收货信息。</p></div><Link to="/procurement/cart"><ArrowLeft size={15}/> 返回购物车</Link></div>
    {query.isPending ? <div className="loading-page">正在加载商品…</div> : query.isError ? <EmptyState error title="采购信息暂时无法加载" description={query.error.message} action="重新加载" onAction={()=>void query.refetch()}/> : !allValid ? <div className="procurement-empty"><h2>购物车中的商品需要调整</h2><p>部分商品已不可用或数量不符合供货要求。</p><Link className="button primary" to="/procurement/cart">返回购物车</Link></div> : <div className="procurement-checkout-layout">
      <div className="procurement-checkout-main">
        <section className="procurement-panel"><h2><MapPin size={20}/> 收货信息</h2><p>请填写收货人和详细地址。</p><div className="procurement-address-form"><label>收货人<input value={receiver} onChange={(e)=>setReceiver(e.target.value)} placeholder="填写收货人姓名" autoComplete="name"/></label><label>联系电话<input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="填写联系电话" autoComplete="tel"/></label><label className="procurement-wide-field">详细地址<input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="填写省市区、街道及门牌号" autoComplete="street-address"/></label></div></section>
        <section className="procurement-panel"><h2><Storefront size={20}/> 商品清单</h2><div className="procurement-checkout-items">{rows.map(({item,product})=>product && <div key={item.productId}><ContentImage src={product.image} alt={product.name} placeholder="暂无图片"/><div><strong>{product.name}</strong><p>{product.spec} · {product.supplierName}{item.remark && ` · 备注：${item.remark}`}</p><small>{currency(product.price)} / {product.unit} × {item.quantity}</small></div><strong>{currency(product.price*item.quantity)}</strong></div>)}</div><label className="procurement-note">采购备注 <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="填写需要告知供应商的事项（选填）" maxLength={200}/></label></section>
      </div>
      <aside className="procurement-panel procurement-order-summary"><h2>费用明细</h2><dl><div><dt>商品合计</dt><dd>{currency(total)}</dd></div><div><dt>运费</dt><dd>以实际确认为准</dd></div></dl><div className="procurement-order-total"><span>商品金额（含税）</span><strong>{currency(total)}</strong></div>{error&&<p role="alert" className="procurement-inline-error">{error}</p>}{__DEMO__?<><button className="button primary full-width" disabled={pending} onClick={()=>void submitDemo()}>{pending?"正在创建…":"提交演示订单"}</button><p>按供应商分别生成演示订单，仅保存在本浏览器，不发送真实订单或支付。</p></>:<><button className="button primary full-width" disabled>订单提交暂未接入</button><p>请待真实订单接口接入后提交。</p></>}</aside>
    </div>}
  </div></>;
}
