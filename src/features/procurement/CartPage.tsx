import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingCart, Trash } from "@phosphor-icons/react";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState } from "../../components/ui";
import { currency } from "../../lib/money";
import { useCart } from "./cart";
import { validQuantity } from "./model";
import { useProducts } from "./catalogue";
import { MarketHeader } from "./MarketHeader";
import "./cart-refinements.css";

export default function CartPage() {
  const cart=useCart(); const query=useProducts(); const [sku,setSku]=useState(""); const [message,setMessage]=useState("");
  const rows=cart.items.map((item)=>({item, product:query.data?.find((p)=>p.id===item.productId)}));
  const selected=rows.filter(({item})=>item.selected);
  const valid=selected.length>0 && selected.every(({item,product})=>product && validQuantity(product,item.quantity));
  const total=selected.reduce((sum,{item,product})=>sum+(product ? product.price*item.quantity : 0),0);
  function addBySku() {
    const product=query.data?.find((p)=>[p.sku,p.code].some((value)=>value?.toLowerCase()===sku.trim().toLowerCase()));
    if(!product) {setMessage("未找到该商品编码，请检查后重试。"); return;}
    try {cart.add(product,product.minimum); setSku(""); setMessage("已加入购物车。");} catch(error) {setMessage(error instanceof Error?error.message:"暂时无法加入购物车");}
  }
  function exportRows(quote:boolean) {
    const cell=(v:string|number)=>{const s=String(v); return `"${(/^[=+\-@\t\r]/.test(s)?"'":"")+s.replaceAll('"','""')}"`;};
    const lines=[["商品名称","商品编码","规格型号","单位","数量","含税单价（元）","含税小计（元）","备注"],...selected.filter(({product})=>!!product).map(({item,product})=>[product!.name,product!.sku,product!.spec,product!.unit,item.quantity,product!.price.toFixed(2),(product!.price*item.quantity).toFixed(2),item.remark])];
    if(quote) lines.push(["价格仅供参考，最终以实际确认为准"]);
    const url=URL.createObjectURL(new Blob(["\ufeff"+lines.map((line)=>line.map(cell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a"); a.href=url; a.download=quote?"集采报价参考.csv":"集采商品清单.csv"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <><MarketHeader/><div className="commerce-container procurement-cart-page">
    <Breadcrumb items={[{label:"集采商城",to:"/procurement"},{label:"购物车"}]}/>
    <div className="market-cart-heading"><h1>我的购物车</h1><Link to="/procurement?view=all"><ArrowLeft size={15}/> 继续选购</Link></div>
    {query.isPending ? <div className="loading-page">正在加载商品…</div> : query.isError ? <EmptyState error title="购物车暂时无法加载" description={query.error.message} action="重新加载" onAction={()=>void query.refetch()}/> : !rows.length ? <div className="procurement-empty"><span><ShoppingCart size={32}/></span><h2>购物车还是空的</h2><p>浏览集采商品，选择需要的物资。</p><Link className="button primary" to="/procurement?view=all">浏览商品 <ArrowRight size={15}/></Link></div> : <>
      <div className="market-cart-table-wrap"><table className="market-cart-table"><thead><tr><th><input type="checkbox" aria-label="全选商品" checked={selected.length===rows.length} onChange={(e)=>cart.selectAll(e.target.checked)}/></th><th>商品信息</th><th>单位</th><th>规格型号</th><th>商品编码</th><th>单价</th><th>数量</th><th>小计</th><th>需求描述</th><th>操作</th></tr></thead><tbody>{rows.map(({item,product})=><tr key={item.productId}>
        <td><input type="checkbox" aria-label={`选择${product?.name||"商品"}`} checked={item.selected} onChange={(e)=>cart.select(item.productId,e.target.checked)}/></td>
        <td><div className="market-cart-product"><ContentImage src={product?.image} alt={product?.name||"商品"} placeholder="暂无图片"/><div>{product?<><Link to={`/procurement/${encodeURIComponent(product.id)}`}><strong>{product.name}</strong></Link><small>{product.supplierName}</small></>:<strong>商品已下架或不可用</strong>}</div></div></td>
        <td>{product?.unit||"—"}</td><td>{product?.spec||"—"}</td><td>{product?.code||product?.sku||"—"}</td><td>{product?<><strong>{currency(product.price)}</strong><small>含税</small><small>未税参考 {currency(product.price/(1+product.taxRate/100))}</small></>:"—"}</td>
        <td>{product&&<><div className="procurement-stepper market-cart-stepper"><button aria-label="减少数量" disabled={item.quantity<=product.minimum} onClick={()=>cart.update(item.productId,Math.max(product.minimum,item.quantity-product.increment))}><Minus size={13}/></button><input type="number" aria-label={`${product.name}购买数量`} value={item.quantity} onChange={(e)=>{const n=Number(e.target.value);if(Number.isSafeInteger(n)&&n>0)cart.update(item.productId,n);}}/><button aria-label="增加数量" disabled={item.quantity+product.increment>product.stock} onClick={()=>cart.update(item.productId,item.quantity+product.increment)}><Plus size={13}/></button></div>{!validQuantity(product,item.quantity)&&<small className="procurement-inline-error">最少 {product.minimum} {product.unit}，按 {product.increment} {product.unit}递增，库存 {product.stock} {product.unit}</small>}</>}</td>
        <td><strong>{product?currency(product.price*item.quantity):"—"}</strong></td><td><textarea className="market-cart-remark" aria-label={`${product?.name||"商品"}需求描述`} placeholder="填写需求描述（选填）" maxLength={200} rows={2} value={item.remark} onChange={(e)=>cart.remark(item.productId,e.target.value)}/></td><td><button className="procurement-remove" onClick={()=>cart.remove([item.productId])} aria-label={`移除${product?.name||"商品"}`}><Trash size={16}/> 移除</button></td>
      </tr>)}</tbody></table></div>
      <div className="market-cart-quick"><label>商品编码 <input value={sku} onChange={(e)=>setSku(e.target.value)} placeholder="输入商品编码" onKeyDown={(e)=>{if(e.key==="Enter")addBySku();}}/></label><button className="button secondary" onClick={addBySku}>快速添加</button>{message&&<span role="status">{message}</span>}</div>
      <div className="market-cart-footer"><div><label><input type="checkbox" checked={selected.length===rows.length} onChange={(e)=>cart.selectAll(e.target.checked)}/> 全选</label><button onClick={()=>cart.remove(selected.map(({item})=>item.productId))} disabled={!selected.length}>删除选中商品</button><button onClick={()=>exportRows(false)} disabled={!valid}>导出商品</button><button onClick={()=>exportRows(true)} disabled={!valid}>导出报价参考</button></div><div>已选 <strong>{selected.length}</strong> 种商品 <span>合计（含税）</span><strong className="market-cart-total">{currency(total)}</strong><Link className={`button primary${valid?"":" is-disabled"}`} to={valid?"/procurement/checkout":"#"} aria-disabled={!valid} onClick={(e)=>{if(!valid)e.preventDefault();}}>去结算 <ArrowRight size={16}/></Link></div></div>
    </>}
  </div></>;
}
