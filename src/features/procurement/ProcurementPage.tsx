import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CaretRight, MagnifyingGlass, Package, ShieldCheck, ShoppingCart, Storefront, Truck } from "@phosphor-icons/react";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState, Skeletons } from "../../components/ui";
import { EllipsisTip } from "../../components/EllipsisTip";
import { useCart } from "./cart";
import { procurementGateway } from "./gateway";
import type { Product } from "./model";
import "./procurement.css";

export function useProducts() { return useQuery({ queryKey:["procurement-products"], queryFn:({ signal })=>procurementGateway.products(signal), retry:false }); }

export function ProductCard({ product }: { product: Product }) {
  return <article className="service-card procurement-card">
    <Link className="service-card-link" to={`/procurement/${encodeURIComponent(product.id)}`}>
      <ContentImage className="service-cover procurement-card-image" src={product.image} alt={product.name} placeholder="暂无商品图片" />
      <div className="service-card-body">
        <div className="card-eyebrow">{product.category}<span>{product.leadDays} 天货期</span></div>
        <EllipsisTip as="h3" text={product.name}/>
        <EllipsisTip as="p" text={[product.brand, product.spec].filter(Boolean).join(" · ")}/>
        <div className="procurement-card-meta"><span>{product.minimum} {product.unit}起订</span><span>{product.stock > 0 ? `库存 ${product.stock} ${product.unit}` : "暂时无货"}</span></div>
        <div className="card-bottom"><span className="price"><small>¥</small> {product.price.toFixed(2)}<span className="price-unit">/{product.unit}</span></span><span className="procurement-tax">含税</span></div>
      </div>
    </Link>
    <div className="service-card-foot"><div className="provider"><span className="provider-avatar"><Storefront size={15}/></span><EllipsisTip className="provider-name" text={product.supplierName}/></div></div>
  </article>;
}

export default function ProcurementPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const products = useProducts(); const cart = useCart();
  const query = (params.get("q") || "").trim().slice(0, 100);
  const cat = params.get("cat") || "all"; const sort = params.get("sort") || "recommended";
  const [draft, setDraft] = useState(query);
  useEffect(()=>setDraft(query),[query]);
  const patch = (values: Record<string,string>) => { const next = new URLSearchParams(params); next.delete("page"); for (const [key,value] of Object.entries(values)) !value || (key === "cat" && value === "all") || (key === "sort" && value === "recommended") ? next.delete(key) : next.set(key,value); setParams(next); };
  const all = products.data || [];
  const categories = [...new Map(all.map((product)=>[product.categoryId,{id:product.categoryId,name:product.category}])).values()];
  const filtered = all.filter((p)=>(cat === "all" || p.categoryId === cat) && (!query || [p.name,p.brand,p.spec,p.sku,p.supplierName].join(" ").toLowerCase().includes(query.toLowerCase())))
    .sort((a,b)=>sort === "priceAsc" ? a.price-b.price : sort === "priceDesc" ? b.price-a.price : sort === "newest" ? b.updatedAt.localeCompare(a.updatedAt) : 0);
  const catalog = params.has("cat") || params.has("q") || params.get("view") === "all";
  const pageCount = Math.max(1, Math.ceil(filtered.length / 12));
  const rawPage = Number(params.get("page"));
  const page = Math.min(pageCount, Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1);
  const visible = filtered.slice((page-1)*12, page*12);
  const setPage = (value:number) => { const next=new URLSearchParams(params); next.set("view","all"); value>1 ? next.set("page",String(value)) : next.delete("page"); setParams(next); };
  return <div className="commerce-container service-v2 service-v3 procurement-page">
    <Breadcrumb items={[{label:"集采商城"}]}/>
    <div className="service-v2-layout">
      <aside className="service-v2-sidebar procurement-sidebar">
        <nav className="service-page-links">
          <NavLink to="/procurement" end>商城首页 <CaretRight size={14}/></NavLink>
          <Link to="/procurement?view=all">全部商品 <CaretRight size={14}/></Link>
          <Link to="/account/orders/procurement">我的集采订单 <CaretRight size={14}/></Link>
        </nav>
        <h2>全部商品分类</h2>
        <nav aria-label="商品分类">{categories.map((item)=><button key={item.id} className={cat===item.id?"selected":""} onClick={()=>patch({cat:item.id,view:"all"})}><Package size={17}/><span>{item.name}</span><CaretRight size={12}/></button>)}</nav>
        <div className="service-side-help"><strong>采购信息一目了然</strong><p>查看供应商商品、价格与供货信息，按需选择。</p><Link to="/procurement?view=all">浏览全部商品 →</Link></div>
      </aside>
      <div className="service-v2-main">
        {!catalog && <><div className="service-v2-hero procurement-hero">
          <div className="service-promo"><ContentImage src="media/v3/park-hero.webp" alt="园区企业集采" placeholder="集采宣传图" eager/><div><span>园区集采 · 服务企业</span><h1>企业采购所需<br/>在这里轻松找到</h1><p>发现园区供应商的优质商品，按需采购。</p><Link className="button primary" to="/procurement?view=all">浏览全部商品 <ArrowRight size={15}/></Link></div></div>
          <div className="service-match procurement-quick"><span>采购工作台</span><h2>让每次采购更有序</h2><p>商品、数量与供货信息集中查看。</p><ul><li>了解商品规格和价格</li><li>选择商品并确认数量</li><li>在订单中查看采购进度</li></ul><Link className="button secondary full-width" to="/procurement/cart"><ShoppingCart size={17}/> 查看购物车 {cart.count>0 && `(${cart.count})`}</Link></div>
        </div><div className="service-value-strip procurement-values">{[{title:"商品信息清晰",desc:"规格与价格一目了然",Icon:Package},{title:"供应商信息可查",desc:"查看商品与供货方",Icon:Storefront},{title:"供货条件明确",desc:"起订量与货期可见",Icon:Truck},{title:"采购进度可查",desc:"在订单中跟进状态",Icon:ShieldCheck}].map(({title,desc,Icon})=><div key={title}><span className="service-value-icon"><Icon size={21} weight="duotone"/></span><span className="service-value-copy"><strong>{title}</strong><span>{desc}</span></span></div>)}</div></>}
        <section className="service-catalogue procurement-catalogue">
          <div className="service-catalogue-tools">
            <div className="service-catalogue-heading"><div className="service-catalogue-title"><h2>{catalog ? "全部商品" : "集采商品"}</h2>{!catalog && <Link to="/procurement?view=all">查看全部 <ArrowRight size={14}/></Link>}</div>
              <form className="showcase-search" role="search" onSubmit={(e)=>{e.preventDefault(); patch({q:draft.trim(),view:"all"});}}><MagnifyingGlass size={18}/><input aria-label="搜索商品、品牌或供应商" value={draft} onChange={(e)=>setDraft(e.target.value)} maxLength={100} placeholder="搜索商品、品牌或供应商"/><button>搜索</button></form>
            </div>
            {catalog && <div className="procurement-filter"><span>商品分类</span><button aria-pressed={cat==="all"} onClick={()=>patch({cat:"all"})}>全部</button>{categories.map((c)=><button key={c.id} aria-pressed={cat===c.id} onClick={()=>patch({cat:c.id})}>{c.name}</button>)}</div>}
            <div className="service-sort"><div className="service-sort-options">{[["recommended","综合推荐"],["newest","最新发布"],["priceAsc","价格 ↑"],["priceDesc","价格 ↓"]].map(([id,label])=><button key={id} aria-pressed={sort===id} onClick={()=>patch({sort:id})}>{label}</button>)}</div><div className="service-sort-meta"><span>共 {filtered.length} 件商品</span><Link className="procurement-cart-link" to="/procurement/cart"><ShoppingCart size={16}/>购物车{cart.count>0 && ` ${cart.count}`}</Link></div></div>
          </div>
          {products.isPending ? <Skeletons/> : products.isError ? <EmptyState error title="商品暂时无法加载" description={products.error.message} action="重新加载" onAction={()=>void products.refetch()}/> : filtered.length ? <div className="service-v2-grid">{visible.map((product)=><ProductCard key={product.id} product={product}/>)}</div> : <EmptyState title={all.length ? "没有找到相关商品" : "暂无在售商品"} description={all.length ? "试试其他关键词或分类。" : "有商品上架后会在这里展示。"} action={all.length ? "查看全部商品" : undefined} onAction={all.length ? ()=>navigate("/procurement?view=all") : undefined}/>}
          {pageCount > 1 && <nav className="pagination" aria-label="商品分页"><button disabled={page===1} onClick={()=>setPage(page-1)}>上一页</button><span>第 {page} / {pageCount} 页</span><button disabled={page===pageCount} onClick={()=>setPage(page+1)}>下一页</button></nav>}
        </section>
      </div>
    </div>
  </div>;
}
