import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Storefront } from "@phosphor-icons/react";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState } from "../../components/ui";
import { currency } from "../../lib/money";
import { useCart } from "./cart";
import { validQuantity } from "./model";
import { useProducts } from "./ProcurementPage";

export default function CheckoutPage() {
  const cart=useCart(); const query=useProducts();
  const [receiver,setReceiver]=useState(""); const [phone,setPhone]=useState("");
  const [address,setAddress]=useState(""); const [note,setNote]=useState("");
  const rows=cart.items.map((item)=>({item,product:query.data?.find((p)=>p.id===item.productId)}));
  const allValid=rows.length>0 && rows.every(({item,product})=>product && validQuantity(product,item.quantity));
  const total=rows.reduce((sum,{item,product})=>sum+(product ? product.price*item.quantity : 0),0);
  return <div className="commerce-container procurement-checkout">
    <Breadcrumb items={[{label:"集采商城",to:"/procurement"},{label:"购物车",to:"/procurement/cart"},{label:"确认采购信息"}]}/>
    <div className="procurement-page-heading"><div><span>集采商城</span><h1>确认采购信息</h1><p>核对商品、数量和收货信息。</p></div><Link to="/procurement/cart"><ArrowLeft size={15}/> 返回购物车</Link></div>
    {query.isPending ? <div className="loading-page">正在加载商品…</div> : query.isError ? <EmptyState error title="采购信息暂时无法加载" description={query.error.message} action="重新加载" onAction={()=>void query.refetch()}/> : !allValid ? <div className="procurement-empty"><h2>购物车中的商品需要调整</h2><p>部分商品已不可用或数量不符合供货要求。</p><Link className="button primary" to="/procurement/cart">返回购物车</Link></div> : <div className="procurement-checkout-layout">
      <div className="procurement-checkout-main">
        <section className="procurement-panel"><h2><MapPin size={20}/> 收货信息</h2><p>请填写收货人和详细地址。</p><div className="procurement-address-form"><label>收货人<input value={receiver} onChange={(e)=>setReceiver(e.target.value)} placeholder="填写收货人姓名" autoComplete="name"/></label><label>联系电话<input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="填写联系电话" autoComplete="tel"/></label><label className="procurement-wide-field">详细地址<input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="填写省市区、街道及门牌号" autoComplete="street-address"/></label></div></section>
        <section className="procurement-panel"><h2><Storefront size={20}/> 商品清单</h2><div className="procurement-checkout-items">{rows.map(({item,product})=>product && <div key={item.productId}><ContentImage src={product.image} alt={product.name} placeholder="暂无图片"/><div><strong>{product.name}</strong><p>{product.spec} · {product.supplierName}</p><small>{currency(product.price)} / {product.unit} × {item.quantity}</small></div><strong>{currency(product.price*item.quantity)}</strong></div>)}</div><label className="procurement-note">采购备注 <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="填写需要告知供应商的事项（选填）" maxLength={200}/></label></section>
      </div>
      <aside className="procurement-panel procurement-order-summary"><h2>费用明细</h2><dl><div><dt>商品合计</dt><dd>{currency(total)}</dd></div><div><dt>运费</dt><dd>以实际确认为准</dd></div></dl><div className="procurement-order-total"><span>商品金额（含税）</span><strong>{currency(total)}</strong></div><button className="button primary full-width" disabled>暂无法提交订单</button><p>订单提交与后续流程待确认，当前可先核对采购信息。</p></aside>
    </div>}
  </div>;
}
