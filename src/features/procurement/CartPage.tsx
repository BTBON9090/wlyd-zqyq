import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingCart, Trash } from "@phosphor-icons/react";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState } from "../../components/ui";
import { currency } from "../../lib/money";
import { useCart } from "./cart";
import { validQuantity } from "./model";
import { useProducts } from "./ProcurementPage";

export default function CartPage() {
  const cart=useCart(); const query=useProducts();
  const rows=cart.items.map((item)=>({item, product:query.data?.find((p)=>p.id===item.productId)}));
  const valid=rows.length>0 && rows.every(({item,product})=>product && validQuantity(product,item.quantity));
  const total=rows.reduce((sum,{item,product})=>sum+(product ? product.price*item.quantity : 0),0);
  return <div className="commerce-container procurement-cart-page">
    <Breadcrumb items={[{label:"集采商城",to:"/procurement"},{label:"购物车"}]}/>
    <div className="procurement-page-heading"><div><span>集采商城</span><h1>购物车</h1><p>确认商品与数量，按供应商供货条件选购。</p></div><Link to="/procurement?view=all"><ArrowLeft size={15}/> 继续选购</Link></div>
    {query.isPending ? <div className="loading-page">正在加载商品…</div> : query.isError ? <EmptyState error title="购物车暂时无法加载" description={query.error.message} action="重新加载" onAction={()=>void query.refetch()}/> : !rows.length ? <div className="procurement-empty"><span><ShoppingCart size={32}/></span><h2>购物车还是空的</h2><p>浏览集采商品，选择需要的物资。</p><Link className="button primary" to="/procurement?view=all">浏览商品 <ArrowRight size={15}/></Link></div> : <>
      <div className="procurement-cart-head"><span>商品信息</span><span>含税单价</span><span>数量</span><span>小计</span><span>操作</span></div>
      <div className="procurement-cart-list">{rows.map(({item,product})=><article className="procurement-cart-row" key={item.productId}>
        <div className="procurement-cart-product"><ContentImage src={product?.image} alt={product?.name||"商品"} placeholder="暂无图片"/><div>{product ? <><small>{product.supplierName}</small><Link to={`/procurement/${encodeURIComponent(product.id)}`}><strong>{product.name}</strong></Link><p>{product.spec} · {product.sku}</p></> : <><strong>商品已不可用</strong><p>该商品可能已下架，请移除后继续。</p></>}</div></div>
        <div>{product ? currency(product.price) : "—"}</div>
        <div>{product && <><input className="procurement-cart-qty" aria-label={`${product.name}购买数量`} type="number" min={1} step={1} value={item.quantity} onChange={(e)=>{const n=Number(e.target.value); if(Number.isSafeInteger(n)&&n>0) cart.update(item.productId,n);}}/><small className="procurement-qty-note">{product.minimum} 起订 · 递增 {product.increment}</small>{!validQuantity(product,item.quantity) && <small className="procurement-inline-error">请调整数量或库存</small>}</>}</div>
        <strong>{product ? currency(product.price*item.quantity) : "—"}</strong>
        <button className="procurement-remove" onClick={()=>cart.remove([item.productId])} aria-label={`移除${product?.name||"商品"}`}><Trash size={17}/> 移除</button>
      </article>)}</div>
      <div className="procurement-cart-footer"><div>已选 <strong>{rows.length}</strong> 种商品 <small>价格以提交时确认的信息为准</small></div><div><span>商品合计（含税）</span><strong>{currency(total)}</strong><Link className={`button primary${valid?"":" is-disabled"}`} to={valid?"/procurement/checkout":"#"} aria-disabled={!valid} onClick={(e)=>{if(!valid)e.preventDefault();}}>去结算 <ArrowRight size={16}/></Link></div></div>
    </>}
  </div>;
}
