import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight, CaretLeft, CaretRight, CheckCircle, Sparkle, List, Package,
  Wrench, Stack, Cpu, ShieldCheck, Printer, Leaf, Drop, SlidersHorizontal, Gauge, Lightning, Fire, type Icon,
} from "@phosphor-icons/react";
import { EmptyState, Skeletons } from "../../components/ui";
import { getCategories, prototype, resolveCategory, useProducts } from "./catalogue";
import { MarketHeader, CategorySelect } from "./MarketHeader";
import { ProductCard } from "./ProductCard";
import "./procurement.css";
import "./market-home.css";

type Slide = { tag:string; title:string; subtitle:string; badges:string[]; action:string; image:string };
const emptySlide:Slide = {tag:"园区集采 · 企业采购",title:"集采商城，连接企业与供应",subtitle:"浏览园区供应商商品，查看规格、价格和供货信息。",badges:["供应商商品","供货信息清晰","按需采购"],action:"浏览全部商品",image:""};
type Bulletin = {tag:string;title:string;time:string};
const emptyBulletins:Record<"news"|"tenders"|"prices",Bulletin[]> = {news:[],tenders:[],prices:[]};

const icons:Record<string,Icon> = {fasteners_hardware:Wrench,raw_materials:Stack,machinery_spares:Cpu,safety_ppe:ShieldCheck,logistics_packing:Package,office_supplies:Printer,energy_saving:Leaf,chemicals_lubricants:Drop,pumps_valves:SlidersHorizontal,instruments_testing:Gauge,hvac_power:Lightning,robotics_welding:Fire};

export default function ProcurementPage() {
  const [params,setParams]=useSearchParams(); const navigate=useNavigate();
  const products=useProducts();
  const all=products.data||[];
  const categories=getCategories(all);
  const rawCat=params.get("cat")||"all";
  const cat=resolveCategory(rawCat,categories);
  const query=(params.get("q")||"").trim().slice(0,100), sort=params.get("sort")||"recommended";
  const [slide,setSlide]=useState(1); const [paused,setPaused]=useState(false); const [expandedCategory,setExpandedCategory]=useState<string|null>(null);
  const [bulletin,setBulletin]=useState<"news"|"tenders"|"prices">("news"); const bulletins=prototype?.prototypeBulletins || emptyBulletins;
  const slides:Slide[]=prototype?.prototypeSlides || [emptySlide];
  const current=slides[slide%slides.length];
  useEffect(()=>{if(paused || slides.length<2)return;const id=window.setInterval(()=>setSlide((n)=>(n+1)%slides.length),6500);return ()=>window.clearInterval(id);},[paused,slides.length]);
  const patch=(values:Record<string,string>)=>{const next=new URLSearchParams(params);next.delete("page");for(const [key,value] of Object.entries(values)) !value||(key==="cat"&&value==="all")||(key==="sort"&&value==="recommended") ? next.delete(key) : next.set(key,value);setParams(next);};
  const chooseCategory=(id:string, scroll=false)=>{patch({cat:id,view:"all"});if(scroll)requestAnimationFrame(()=>document.getElementById("market-products")?.scrollIntoView({behavior:"smooth",block:"start"}));};
  const filtered=all.filter((p)=>(cat==="all"||p.categoryId===cat)&&(!query||[p.name,p.brand,p.spec,p.sku,p.code,p.model,p.supplierName].join(" ").toLowerCase().includes(query.toLowerCase())))
    .sort((a,b)=>sort==="priceAsc"?a.price-b.price:sort==="priceDesc"?b.price-a.price:sort==="newest"?b.updatedAt.localeCompare(a.updatedAt):sort==="sales"?(b.sales ?? -1)-(a.sales ?? -1):0);
  const catalog=params.has("cat")||params.has("q")||params.get("view")==="all";
  const pageCount=Math.max(1,Math.ceil(filtered.length/12)),rawPage=Number(params.get("page"));
  const page=Math.min(pageCount,Number.isSafeInteger(rawPage)&&rawPage>0?rawPage:1);
  const visible=filtered.slice((page-1)*12,page*12);
  const setPage=(value:number)=>{const next=new URLSearchParams(params);next.set("view","all");value>1?next.set("page",String(value)):next.delete("page");setParams(next);};
  const expanded=categories.find((item)=>item.id===expandedCategory);
  return <div className="procurement-page">
    <MarketHeader/>
    <div className="market-width market-main">
      <div className="market-hero-grid">
        <div className="market-category-wrap" onMouseLeave={()=>setExpandedCategory(null)} onBlur={(event)=>{if(!event.currentTarget.contains(event.relatedTarget as Node | null))setExpandedCategory(null);}}><aside className="market-category-panel" aria-label="物资分类"><button className="market-category-heading" onClick={()=>chooseCategory("all",true)}><List size={19}/> 全部物资分类</button><div className="market-category-list">{categories.map((item)=>{const CategoryIcon=icons[item.id]||Package;return <button key={item.id} title={item.name} aria-pressed={cat===item.id} onMouseEnter={()=>setExpandedCategory(item.id)} onFocus={()=>setExpandedCategory(item.id)} onClick={()=>{setExpandedCategory(null);chooseCategory(item.id,true);}}><CategoryIcon size={17}/><span>{item.name}</span><CaretRight size={14}/></button>;})}{!categories.length&&<p>暂无可展示分类</p>}</div></aside>{expanded?.groups?.length ? <div className="market-category-flyout" aria-label={`${expanded.name}细分物资`}><p className="market-category-flyout-hint">选择细分物资，按关键词查找</p>{expanded.groups.map((group)=><div key={group.name}><strong>{group.name}</strong><span>{group.items.map((name)=><button key={name} onClick={()=>{setExpandedCategory(null);patch({cat:expanded.id,q:name,view:"all"});requestAnimationFrame(()=>document.getElementById("market-products")?.scrollIntoView({behavior:"smooth",block:"start"}));}}>{name}</button>)}</span></div>)}</div> : null}</div>
        <section className="market-hero" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} style={current.image ? {backgroundImage:`linear-gradient(100deg, color-mix(in srgb, var(--color-primary-deep) 94%, transparent), color-mix(in srgb, var(--color-primary) 75%, transparent)), url("${current.image}")`} : undefined}>
          <div className="market-hero-content"><span className="market-hero-tag"><Sparkle size={15}/> {current.tag}</span><h1>{current.title}</h1><p>{current.subtitle}</p><div className="market-hero-badges">{current.badges.map((badge)=><span key={badge}><CheckCircle size={15}/> {badge}</span>)}</div></div>
          <div className="market-hero-bottom"><button className="market-hero-action" onClick={()=>chooseCategory(current.title.includes("节能")?"energy_saving":current.title.includes("备件")?"machinery_spares":"all",true)}>{current.action} <ArrowRight size={16}/></button>{slides.length>1 && <div className="market-carousel-controls"><div>{slides.map((s,i)=><button key={s.title} aria-label={`切换至第 ${i+1} 屏`} aria-pressed={i===slide%slides.length} onClick={()=>setSlide(i)}/>)}</div><button aria-label="上一张" onClick={()=>setSlide((slide-1+slides.length)%slides.length)}><CaretLeft size={17}/></button><button aria-label="下一张" onClick={()=>setSlide((slide+1)%slides.length)}><CaretRight size={17}/></button></div>}</div>
        </section>
        <aside className="market-information"><section className="market-bulletin"><div className="market-bulletin-tabs">{([["news","集采快报"],["tenders","招采寻源"],["prices","价格行情"]] as const).map(([id,label])=><button key={id} aria-pressed={bulletin===id} onClick={()=>setBulletin(id)}>{label}</button>)}</div>{bulletins[bulletin].length ? <ul>{bulletins[bulletin].map((item)=><li key={item.title}><span>{item.tag}</span><p title={item.title}>{item.title}</p><time>{item.time}</time></li>)}</ul> : <p className="market-bulletin-empty">暂无资讯</p>}</section></aside>
      </div>
      <section className="market-products" id="market-products"><div className="market-products-heading"><div><h2>{catalog?"全部集采商品":"热门集采物资"}</h2><span>共 {filtered.length} 项集采商品</span></div><div className="market-toolbar-controls"><CategorySelect value={cat} onChange={chooseCategory} categories={categories} label="筛选商品分类" allLabel="全部分类" variant="filter" /><div className="market-sort">{([["recommended","综合推荐"],["sales","销量优先"],["newest","最新上架"],["priceAsc","销售价 ↑"],["priceDesc","销售价 ↓"]] as const).map(([id,label])=><button key={id} aria-pressed={sort===id} onClick={()=>patch({sort:id})}>{label}</button>)}</div></div></div>
        {products.isPending ? <Skeletons/> : products.isError ? <EmptyState error title="商品暂时无法加载" description={products.error.message} action="重新加载" onAction={()=>void products.refetch()}/> : visible.length ? <div className="market-product-grid">{visible.map((product)=><ProductCard key={product.id} product={product}/>)}</div> : <EmptyState title={all.length?"没有找到相关商品":"暂无在售商品"} description={all.length?"试试其他关键词或分类。":"有商品上架后会在这里展示。"} action={all.length?"查看全部商品":undefined} onAction={all.length?()=>navigate("/procurement"):undefined}/>}
        {pageCount>1 && <nav className="pagination" aria-label="商品分页"><button disabled={page===1} onClick={()=>setPage(page-1)}>上一页</button><span>第 {page} / {pageCount} 页</span><button disabled={page===pageCount} onClick={()=>setPage(page+1)}>下一页</button></nav>}
      </section>
    </div>
  </div>;
}
