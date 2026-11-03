import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Minus, Plus, ShoppingCart, Storefront, Truck } from "@phosphor-icons/react";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState } from "../../components/ui";
import { useApp } from "../../app/AppProvider";
import { useCart } from "./cart";
import { validQuantity, type Product } from "./model";
import { useProducts } from "./ProcurementPage";

export default function ProductDetail() {
  const { productId = "" } = useParams();
  const query = useProducts();
  const product = query.data?.find((p)=>p.id===productId);
  if (query.isPending) return <div className="loading-page">正在加载商品详情…</div>;
  if (query.isError) return <div className="commerce-container"><EmptyState error title="商品暂时无法加载" description={query.error.message} action="重新加载" onAction={()=>void query.refetch()}/><Link to="/procurement" className="button secondary">返回商城</Link></div>;
  if (!product) return <div className="commerce-container"><EmptyState title="商品不存在或已下架" description="您可以返回商城查看其他商品。"/><Link to="/procurement" className="button secondary">返回商城</Link></div>;
  return <ProductContent key={product.id} product={product}/>;
}
function ProductContent({product}:{product:Product}) {
  const [quantity,setQuantity] = useState(product.minimum);
  const [message,setMessage] = useState("");
  const cart = useCart(); const { toast } = useApp(); const navigate=useNavigate();
  function add(goToCart = false) {
    if (!validQuantity(product,quantity)) { setMessage(`请按 ${product.minimum} ${product.unit}起订、每次增加 ${product.increment} ${product.unit}选择，且不超过库存。`); return; }
    try { cart.add(product,quantity); setMessage(""); if(goToCart) navigate("/procurement/cart"); else toast("已加入购物车"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "暂时无法加入购物车"); }
  }
  return <div className="commerce-container product-detail-v2 product-detail-v3 procurement-detail">
    <Breadcrumb detail items={[{label:"集采商城",to:"/procurement"},{label:product.category,to:`/procurement?cat=${encodeURIComponent(product.categoryId)}`},{label:product.name}]}/>
    <section className="procurement-detail-hero">
      <div className="procurement-detail-gallery"><ContentImage src={product.image} alt={product.name} placeholder="暂无商品图片" eager/><div className="procurement-detail-caption">商品图片与规格以供应商发布为准</div></div>
      <div className="procurement-detail-summary">
        <div className="procurement-detail-category">{product.category} · {product.brand || "园区供应商"}</div>
        <h1>{product.name}</h1><p className="procurement-detail-lead">{product.description}</p>
        <div className="procurement-detail-price"><div><span>销售价</span><strong>¥ {product.price.toFixed(2)}</strong><small> / {product.unit}</small><em>含税</em></div>{product.originalPrice>product.price && <p>原价 ¥{product.originalPrice.toFixed(2)} / {product.unit}</p>}</div>
        <dl className="procurement-facts"><div><dt>规格型号</dt><dd>{product.spec || "以供应商发布为准"}</dd></div><div><dt>商品编码</dt><dd>{product.sku || "—"}</dd></div><div><dt>供货周期</dt><dd>{product.leadDays} 天</dd></div><div><dt>起订要求</dt><dd>{product.minimum} {product.unit}起订 · 每次增加 {product.increment} {product.unit}</dd></div><div><dt>当前库存</dt><dd>{product.stock} {product.unit}</dd></div></dl>
        <div className="procurement-quantity"><span>购买数量</span><div className="procurement-stepper"><button onClick={()=>setQuantity(Math.max(product.minimum,quantity-product.increment))} aria-label="减少购买数量"><Minus/></button><input type="number" aria-label="购买数量" value={Number.isNaN(quantity)?"":quantity} onChange={(e)=>setQuantity(e.target.value ? Number(e.target.value) : NaN)} min={product.minimum} max={product.stock} step={product.increment}/><button onClick={()=>setQuantity((Number.isFinite(quantity)?quantity:product.minimum)+product.increment)} aria-label="增加购买数量"><Plus/></button></div><small>{product.unit}</small></div>
        {message && <p className="procurement-inline-error" role="alert">{message}</p>}
        <div className="procurement-detail-actions"><button className="button primary" disabled={product.stock<product.minimum} onClick={()=>add(true)}>立即选购</button><button className="button secondary" disabled={product.stock<product.minimum} onClick={()=>add()}><ShoppingCart size={17}/> 加入购物车</button></div>
      </div>
      <aside className="procurement-provider"><span className="procurement-provider-icon"><Storefront size={25}/></span><div><small>供应商</small><h2>{product.supplierName}</h2></div><p>商品、价格与供货信息由供应商发布。</p><div><CheckCircle size={17}/> 规格与价格清晰可查</div><div><Truck size={17}/> 货期以商品供货信息为准</div></aside>
    </section>
    <section className="procurement-description"><h2>商品信息</h2><p>{product.description}</p><dl><div><dt>商品名称</dt><dd>{product.name}</dd></div><div><dt>品牌</dt><dd>{product.brand || "—"}</dd></div><div><dt>规格型号</dt><dd>{product.spec || "—"}</dd></div><div><dt>销售单位</dt><dd>{product.unit}</dd></div></dl><Link to="/procurement?view=all"><ArrowLeft size={15}/> 返回商品列表</Link></section>
  </div>;
}
