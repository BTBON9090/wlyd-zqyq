import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CaretDown, Check, ClipboardText, MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react";
import { useCart } from "./cart";
export const channels = {buy:"集采专区",benefits:"福利商城",sourcing:"商机寻源",offers:"特价专区"} as const;
import "./procurement.css";
import "./market-header.css";

function ChannelSelect({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  const label="搜索频道";
  const [open,setOpen]=useState(false), [focusIndex,setFocusIndex]=useState(0);
  const menuRef=useRef<HTMLDivElement>(null), triggerRef=useRef<HTMLButtonElement>(null);
  const optionRefs=useRef<Array<HTMLButtonElement|null>>([]);
  const options=Object.entries(channels).map(([id,name])=>({id,name}));
  const selectedName=options.find((item)=>item.id===value)?.name || channels.buy;
  useEffect(()=>{
    if(!open)return;
    const closeOutside=(event:PointerEvent)=>{if(!menuRef.current?.contains(event.target as Node))setOpen(false);};
    document.addEventListener("pointerdown",closeOutside);
    return ()=>document.removeEventListener("pointerdown",closeOutside);
  },[open]);
  function showOptions(focus=false) {const index=Math.max(0,options.findIndex(item=>item.id===value));setFocusIndex(index);setOpen(true);if(focus)requestAnimationFrame(()=>optionRefs.current[index]?.focus());}
  function selectOption(id:string) {onChange(id);setOpen(false);triggerRef.current?.focus();}
  function onOptionKey(event:React.KeyboardEvent, index:number) {
    if(event.key==="Escape"){event.preventDefault();setOpen(false);triggerRef.current?.focus();return;}
    let next=index;
    if(event.key==="ArrowDown")next=(index+1)%options.length;
    else if(event.key==="ArrowUp")next=(index-1+options.length)%options.length;
    else if(event.key==="Home")next=0;
    else if(event.key==="End")next=options.length-1;
    else if(event.key==="Tab"){setOpen(false);return;}
    else return;
    event.preventDefault();setFocusIndex(next);optionRefs.current[next]?.focus();
  }
  return <div className="market-category-control market-search-category" ref={menuRef}>
    <button ref={triggerRef} type="button" className="market-category-trigger" aria-label={`${label}：${selectedName}`} aria-haspopup="listbox" aria-expanded={open} onClick={()=>open?setOpen(false):showOptions()} onKeyDown={(event)=>{if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();showOptions(true);} else if(open&&event.key==="Escape"){event.preventDefault();setOpen(false);}}}>
      <span title={selectedName}>{selectedName}</span><CaretDown size={15} className={open?"is-open":""}/>
    </button>
    {open&&<div className="market-category-menu" role="listbox" aria-label={label}>{options.map((option,index)=><button type="button" role="option" aria-selected={value===option.id} tabIndex={focusIndex===index?0:-1} ref={(node)=>{optionRefs.current[index]=node;}} key={option.id} onClick={()=>selectOption(option.id)} onKeyDown={(event)=>onOptionKey(event,index)}><span>{option.name}</span>{value===option.id&&<Check size={16}/>}</button>)}</div>}
  </div>;
}

export function MarketHeader() {
  const navigate=useNavigate(); const [params]=useSearchParams();
  const cart=useCart(), channel=params.get("channel") || "buy", query=params.get("q")||"";
  const [draft,setDraft]=useState(query);
  useEffect(()=>setDraft(query),[query]);
  function switchChannel(id:string){navigate(id==="buy"?"/procurement":`/procurement?channel=${id}`);setDraft("");window.scrollTo(0,0);}
  function search() { const next=new URLSearchParams({view:"all"}); if(draft.trim())next.set("q",draft.trim());if(channel!=="buy")next.set("channel",channel);navigate(`/procurement?${next}`);window.scrollTo(0,0); }
  return <div className="market-search-band"><div className="market-width market-search-row">
    <form className="market-search" role="search" onSubmit={(event)=>{event.preventDefault();search();}}>
      <ChannelSelect value={channel} onChange={switchChannel}/>
      <MagnifyingGlass size={20}/><input aria-label="搜索商品、品牌或物料编码" value={draft} onChange={(event)=>setDraft(event.target.value)} maxLength={100} placeholder="搜索工业品、紧固件、品牌或物料编码…"/>
      <button type="submit" className="market-search-submit"><MagnifyingGlass size={17}/> 搜索</button>
    </form>
    <div className="market-search-actions"><Link className="button secondary market-order-link" to="/account/orders/procurement"><ClipboardText size={19}/> 我的订单</Link><Link className="button primary market-cart-button" to="/procurement/cart"><ShoppingCart size={20}/> 购物车{cart.count>0 && <span>{cart.count}</span>}</Link></div>
  </div></div>;
}
