import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Storefront, ArrowRight, CaretLeft, CaretRight, CaretDown, CaretUp, Plus, Package,
  Wrench, Stack, Cpu, ShieldCheck, Printer, Leaf, Drop, SlidersHorizontal, Gauge, Lightning, Fire, type Icon,
} from "@phosphor-icons/react";
import { useStickyList } from "../../components/useStickyList";
import { EmptyState, Skeletons } from "../../components/ui";
import { getCategories, prototype, resolveCategory, useProducts } from "./catalogue";
import { MarketHeader, channels } from "./MarketHeader";
import { useDelivery } from "./AddressPicker";
import { quote } from "./delivery";
import { ProductCard } from "./ProductCard";
import "./procurement.css";
import "./market-home.css";

type Slide = { tag:string; title:string; subtitle:string; badges:string[]; action:string; image:string };
const emptySlide:Slide = {tag:"园区集采 · 企业采购",title:"集采商城，连接企业与供应",subtitle:"浏览园区供应商商品，查看规格、价格和供货信息。",badges:["供应商商品","供货信息清晰","按需采购"],action:"浏览全部商品",image:""};
type Bulletin = {tag:string;title:string;time:string};
const emptyBulletins:Record<"news"|"tenders"|"prices",Bulletin[]> = {news:[],tenders:[],prices:[]};

const icons:Record<string,Icon> = {fasteners_hardware:Wrench,raw_materials:Stack,machinery_spares:Cpu,safety_ppe:ShieldCheck,logistics_packing:Package,office_supplies:Printer,energy_saving:Leaf,chemicals_lubricants:Drop,pumps_valves:SlidersHorizontal,instruments_testing:Gauge,hvac_power:Lightning,robotics_welding:Fire};

function FilterRow({label,options,values,onPick,multiple=false}:{label:string;options:string[];values:string[];onPick:(v:string[])=>void;multiple?:boolean}){
  const [expanded,setExpanded]=useState(false);
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState<string[]>([]);
  const selected=editing?draft:values;
  const choices=expanded||editing?options:[...new Set([...options.slice(0,6),...values.filter(v=>options.includes(v))])];
  const toggle=(value:string)=>setDraft(current=>current.includes(value)?current.filter(v=>v!==value):[...current,value]);
  return <div className="market-facet"><b>{label}</b><div className="market-facet-content">
    <div className="market-facet-options">
      {!editing&&<button aria-pressed={!values.length} onClick={()=>onPick([])}>全部</button>}
      {choices.map(v=>editing?<label className="market-facet-check" key={v}><input type="checkbox" checked={selected.includes(v)} onChange={()=>toggle(v)}/><span>{v}</span></label>:<button key={v} aria-pressed={selected.includes(v)} onClick={()=>onPick([v])}>{v}</button>)}
    </div>
    <div className="market-facet-actions">
      {!editing&&options.length>6&&<button className="market-facet-toggle" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?"收起":"展开全部"} {expanded?<CaretUp size={14}/>:<CaretDown size={14}/>}</button>}
      {!editing&&multiple&&options.length>1&&<button className="market-facet-multiple" onClick={()=>{setDraft(values);setEditing(true);}}><Plus size={14}/> 多选</button>}
    </div>
    {editing&&<div className="market-facet-confirm"><button className="market-facet-apply" onClick={()=>{onPick(draft);setEditing(false);}}>确定{draft.length? `（${draft.length}）`:""}</button><button onClick={()=>setEditing(false)}>取消</button></div>}
  </div></div>;
}
export default function ProcurementPage() {
  const [params,setParams]=useSearchParams(); const navigate=useNavigate();
  const root=useRef<HTMLDivElement>(null);
  useStickyList(root,true);
  const products=useProducts();
  const delivery=useDelivery();
  const all=(products.data||[]).map(p=>quote(p,delivery.region));
  const categories=getCategories(all);
  const rawCat=params.get("cat")||"all";
  const cat=resolveCategory(rawCat,categories);
  const channel=params.get("channel") || "buy";
  const isOffers=channel==="offers", isSourcing=channel==="sourcing", isBenefits=channel==="benefits";
  const query=(params.get("q")||"").trim().slice(0,100), sort=params.get("sort")||"recommended";
  const [slide,setSlide]=useState(1); const [paused,setPaused]=useState(false); const [expandedCategory,setExpandedCategory]=useState<string|null>(null);
  const [bulletin,setBulletin]=useState<"news"|"tenders"|"prices">("news"); const bulletins=prototype?.prototypeBulletins || emptyBulletins;
  const slides:Slide[]=prototype?.prototypeSlides || [emptySlide];
  const current=slides[slide%slides.length];
  useEffect(()=>{if(paused || slides.length<2)return;const id=window.setInterval(()=>setSlide((n)=>(n+1)%slides.length),6500);return ()=>window.clearInterval(id);},[paused,slides.length]);
  const patch=(values:Record<string,string>)=>{const next=new URLSearchParams(params);next.delete("page");for(const [key,value] of Object.entries(values)) !value||(key==="cat"&&value==="all")||(key==="sort"&&value==="recommended") ? next.delete(key) : next.set(key,value);setParams(next);};
  const enterCategory=(id:string, group="", leaf="")=>{setExpandedCategory(null);patch({cat:id,group,leaf,brand:"",q:"",view:"all"});window.scrollTo(0,0);};
  // Existing links encoded a leaf as q. Resolve exact category searches to their path.
  const matched=params.get("searchType")==="shop"?undefined:categories.find(c=>(cat==="all"||cat===c.id)&&(c.name===query||c.groups?.some(g=>g.name===query||g.items.includes(query))));
  const activeCat=categories.find(c=>c.id===cat)||matched;
  const groups=activeCat?.groups||[];
  const activeGroup=groups.find(g=>g.name===params.get("group"))||groups.find(g=>g.name===query||g.items.includes(query));
  const selectedLeaves=params.getAll("leaf").filter(Boolean);
  const leaves=selectedLeaves.length?selectedLeaves:(activeGroup?.items.includes(query)?[query]:[]);
  const leaf=leaves.length===1?leaves[0]:leaves.length>1?`已选 ${leaves.length} 个分类`:"";
  const shopSearch=params.get("searchType")==="shop";
  const keyword=matched&&!shopSearch?"":query;
  const brand=params.get("brand")||"";
  const candidates=all.filter(p=>{
    if((isOffers&&p.originalPrice<=p.price)||(activeCat&&p.categoryId!==activeCat.id))return false;
    const terms=[p.name,p.spec,p.model,p.category,p.categoryGroup,p.categoryLeaf].filter(Boolean).join(" ");

    if(activeGroup && !(p.categoryGroup===activeGroup.name||terms.includes(activeGroup.name)||activeGroup.items.some(i=>terms.includes(i))))return false;
    return (!params.get("supplier")||p.supplierId===params.get("supplier")) && (!keyword||(shopSearch?p.supplierName:[terms,p.sku,p.code,p.brand].join(" ")).toLowerCase().includes(keyword.toLowerCase()));
  });
  const scoped=candidates.filter(p=>!leaves.length||leaves.includes(p.categoryLeaf||""));
  const leafOptions=[...new Set(query && activeGroup?.items.includes(query) ? [query] : keyword || !activeCat ? candidates.map(p=>p.categoryLeaf).filter((v):v is string=>!!v) : activeGroup?.items || groups.flatMap(g=>g.items))];
  const list=useRef<HTMLDivElement>(null);
  const [more,setMore]=useState(false);
  const home=!params.has("q")&&!params.has("cat")&&params.get("view")!=="all"&&channel==="buy";
  useEffect(()=>{const el=list.current;if(!el)return;
    const update=()=>setMore(el.scrollHeight-el.clientHeight-el.scrollTop>2);
    const observer=new ResizeObserver(update);observer.observe(el);update();el.addEventListener("scroll",update,{passive:true});
    return ()=>{observer.disconnect();el.removeEventListener("scroll",update);};
  },[home,categories.length]);
  const brands=[...new Set(scoped.map(p=>p.brand).filter(Boolean))];
  const filtered=scoped.filter(p=>!brand||brand===p.brand)
    .sort((a,b)=>sort==="priceAsc"?a.price-b.price:sort==="priceDesc"?b.price-a.price:sort==="newest"?b.updatedAt.localeCompare(a.updatedAt):sort==="sales"?(b.sales ?? -1)-(a.sales ?? -1):0);
  const shopResults=[...new Map(candidates.map(p=>[p.supplierId,p])).values()];
  const catalog=params.has("cat")||params.has("q")||params.get("view")==="all";
  const pageCount=Math.max(1,Math.ceil(filtered.length/12)),rawPage=Number(params.get("page"));
  const page=Math.min(pageCount,Number.isSafeInteger(rawPage)&&rawPage>0?rawPage:1);
  const visible=filtered.slice((page-1)*12,page*12);
  const setPage=(value:number)=>{const next=new URLSearchParams(params);next.set("view","all");value>1?next.set("page",String(value)):next.delete("page");setParams(next);};
  const expanded=categories.find((item)=>item.id===expandedCategory);
  const FlyoutIcon=(expanded&&icons[expanded.id])||Package;
  const ResultIcon=(activeCat && icons[activeCat.id])||Package;
  const facet=(label:string,options:string[],value:string,onPick:(v:string)=>void)=><FilterRow key={label+activeCat?.id} label={label} options={options} values={value?[value]:[]} onPick={v=>onPick(v[0]||"")}/>;
  const pickLeaves=(values:string[])=>{const next=new URLSearchParams(params);next.delete("page");next.delete("leaf");next.delete("brand");next.delete("q");if(keyword)next.set("q",keyword);values.forEach(v=>next.append("leaf",v));if(activeCat)next.set("cat",activeCat.id);if(activeGroup)next.set("group",activeGroup.name);next.set("view","all");setParams(next);};
  return <div className="procurement-page" ref={root}>
    <MarketHeader/>
    <div className="market-width market-main">
      {!catalog&&<nav className="market-channels" aria-label="商城频道">{Object.entries(channels).map(([key,label])=><button key={key} aria-pressed={key===channel} onClick={()=>{setExpandedCategory(null);setParams(key==="buy"?{}:{channel:key});}}>{label}</button>)}</nav>}
      {isBenefits?<div className="market-channel-content"><h1>福利商城</h1><EmptyState title="暂无福利商品" description="福利商品上架后会在这里展示。"/></div>:isSourcing?<section className="market-channel-content"><h1>商机寻源</h1>{bulletins.tenders.some(item=>item.title.includes(query)||item.tag.includes(query))?<ul>{bulletins.tenders.filter(item=>item.title.includes(query)||item.tag.includes(query)).map(item=><li key={item.title}><b>{item.tag}</b><span>{item.title}</span><time>{item.time}</time></li>)}</ul>:<p>暂无寻源信息</p>}</section>:<>
      {!catalog&&!isOffers&&<div className="market-hero-grid">
        <div className="market-category-wrap" onKeyDown={e=>{if(e.key==="Escape")setExpandedCategory(null);}} onMouseLeave={()=>setExpandedCategory(null)} onBlur={(event)=>{if(!event.currentTarget.contains(event.relatedTarget as Node | null))setExpandedCategory(null);}}><aside className="market-category-panel" aria-label="物资分类"><div ref={list} className="market-category-list" data-more={more}>{categories.map((item)=>{const CategoryIcon=icons[item.id]||Package;return <button key={item.id} title={item.name} aria-pressed={cat===item.id} onMouseEnter={()=>setExpandedCategory(item.id)} onFocus={()=>setExpandedCategory(item.id)} onClick={()=>{setExpandedCategory(null);enterCategory(item.id);}}><CategoryIcon size={17}/><span>{item.name}</span><CaretRight size={14}/></button>;})}{!categories.length&&<p>暂无可展示分类</p>}</div></aside>{expanded?.groups?.length ? <div className="market-category-flyout" aria-label={`${expanded.name}细分物资`}><h2><FlyoutIcon size={20}/>{expanded.name}</h2>{expanded.groups.map((group)=><div key={group.name}><button className="market-group-link" onClick={()=>enterCategory(expanded.id,group.name)}>{group.name}</button><span>{group.items.map((name)=><button key={name} onClick={()=>{enterCategory(expanded.id,group.name,name);}}>{name}</button>)}</span></div>)}</div> : null}</div>
        <section className="market-hero" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} style={current.image ? {backgroundImage:`linear-gradient(90deg, rgb(0 0 0 / 82%), rgb(0 0 0 / 62%) 52%, rgb(0 0 0 / 20%)), url("${current.image}")`} : undefined}>
          <div className="market-hero-content"><span className="market-hero-tag">{current.tag}</span><h1>{current.title}</h1><p>{current.subtitle}</p></div>
          <div className="market-hero-bottom"><button className="market-hero-action" onClick={()=>enterCategory(current.title.includes("节能")?"energy_saving":current.title.includes("备件")?"machinery_spares":"all")}>{current.action} <ArrowRight size={16}/></button>{slides.length>1 && <div className="market-carousel-controls"><div>{slides.map((s,i)=><button key={s.title} aria-label={`切换至第 ${i+1} 屏`} aria-pressed={i===slide%slides.length} onClick={()=>setSlide(i)}/>)}</div><button aria-label="上一张" onClick={()=>setSlide((slide-1+slides.length)%slides.length)}><CaretLeft size={17}/></button><button aria-label="下一张" onClick={()=>setSlide((slide+1)%slides.length)}><CaretRight size={17}/></button></div>}</div>
        </section>
        <aside className="market-information"><section className="market-bulletin"><div className="market-bulletin-tabs">{([["news","集采快报"],["tenders","招采寻源"],["prices","价格行情"]] as const).map(([id,label])=><button key={id} aria-pressed={bulletin===id} onClick={()=>setBulletin(id)}>{label}</button>)}</div>{bulletins[bulletin].length ? <ul>{bulletins[bulletin].map((item)=><li key={item.title}><span data-tag={item.tag}>{item.tag}</span><p title={item.title}>{item.title}</p><time>{item.time}</time></li>)}</ul> : <p className="market-bulletin-empty">暂无资讯</p>}</section></aside>
      </div>}
      {catalog&&!shopSearch&&<section className="market-results-filters"><div className="market-crumb"><button onClick={()=>navigate(channel==="buy"?"/procurement":`/procurement?channel=${channel}`)}><Storefront size={16}/>商城首页</button><CaretRight size={14}/><ResultIcon size={18}/><strong>{leaf||activeGroup?.name||activeCat?.name||"全部物资"}</strong>{keyword&&<span>搜索：{keyword}</span>}</div>
        {<FilterRow key={"leaf"+activeCat?.id+activeGroup?.name} label="三级分类" options={leafOptions} values={leaves} onPick={pickLeaves} multiple/>}
        {brands.length||brand?facet("品牌",Array.from(new Set([...brands,...(brand?[brand]:[])])),brand,v=>patch({brand:v})): <div className="market-facet"><b>品牌</b><span>当前条件下暂无品牌</span></div>}
      </section>}
      {shopSearch ? <section className="market-shop-results"><h2>店铺搜索结果 <small>共 {shopResults.length} 家店铺</small></h2>
        {products.isPending ? <Skeletons/> : products.isError ? <EmptyState error title="店铺暂时无法加载" description={products.error.message} action="重新加载" onAction={()=>void products.refetch()}/> : shopResults.length ? <div className="market-shop-grid">{shopResults.map(p=><article key={p.supplierId}><Storefront size={24}/><div><strong>{p.supplierName}</strong><small>在售商品 {all.filter(x=>x.supplierId===p.supplierId).length} 件</small></div><button onClick={()=>navigate('/procurement?view=all&supplier='+encodeURIComponent(p.supplierId))}>查看商品 <ArrowRight size={16}/></button></article>)}</div> : <EmptyState title="没有找到相关店铺" description="试试其他店铺名称。"/>}</section> :
      <section className="market-products" id="market-products"><div className="market-products-heading" data-list-sticky><div><Package className="market-products-icon" size={19} aria-hidden="true"/><h2>{isOffers?"特价物资":catalog?"全部集采商品":"热门集采物资"}</h2><span>共 {filtered.length} 项集采商品</span></div><div className="market-toolbar-controls"><div className="service-v3"><div className="service-sort"><div className="service-sort-options">{([["recommended","综合推荐"],["sales","销量优先"],["newest","最新上架"],["priceAsc","销售价 ↑"],["priceDesc","销售价 ↓"]] as const).map(([id,label])=><button key={id} aria-pressed={sort===id} onClick={()=>patch({sort:id})}>{label}</button>)}</div></div></div></div></div>
        {products.isPending ? <Skeletons/> : products.isError ? <EmptyState error title="商品暂时无法加载" description={products.error.message} action="重新加载" onAction={()=>void products.refetch()}/> : visible.length ? <div className="market-product-grid">{visible.map((product)=><ProductCard key={product.id} product={product}/>)}</div> : <EmptyState title={all.length?"没有找到相关商品":"暂无在售商品"} description={all.length?"试试其他关键词或分类。":"有商品上架后会在这里展示。"} action={all.length?"查看全部商品":undefined} onAction={all.length?()=>navigate("/procurement"):undefined}/>}
        {pageCount>1 && <nav className="pagination" aria-label="商品分页"><button disabled={page===1} onClick={()=>setPage(page-1)}>上一页</button><span>第 {page} / {pageCount} 页</span><button disabled={page===pageCount} onClick={()=>setPage(page+1)}>下一页</button></nav>}
      </section>}</>}
    </div>
  </div>;
}
