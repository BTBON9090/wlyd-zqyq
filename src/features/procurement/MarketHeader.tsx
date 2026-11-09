import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ClipboardText, MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react";
import { useCart } from "./cart";
import { ChoiceSelect } from "../../components/ChoiceSelect";
export const channels = {buy:"集采专区",benefits:"福利商城",sourcing:"商机寻源",offers:"特价专区"} as const;
import "./procurement.css";
import "./market-header.css";

function ChannelSelect({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <ChoiceSelect label="搜索类型" value={value} onChange={onChange}
    options={[{id:"product",name:"商品"},{id:"shop",name:"店铺"}]}
    placeholder="商品" className="market-search-category"/>;
}

export function MarketHeader() {
  const navigate=useNavigate(); const [params]=useSearchParams();
  const cart=useCart(), channel=params.get("channel") || "buy", query=params.get("q")||"";
  const [searchType,setSearchType]=useState(params.get("searchType")==="shop"?"shop":"product");
  useEffect(()=>setSearchType(params.get("searchType")==="shop"?"shop":"product"),[params]);
  const [draft,setDraft]=useState(query);
  useEffect(()=>setDraft(query),[query]);
  function search() { const next=new URLSearchParams({view:"all"}); if(draft.trim())next.set("q",draft.trim());if(channel!=="buy")next.set("channel",channel);if(searchType==="shop")next.set("searchType","shop");navigate(`/procurement?${next}`);window.scrollTo(0,0); }
  return <div className="market-search-band"><div className="market-width market-search-row">
    <form className="market-search" role="search" onSubmit={(event)=>{event.preventDefault();search();}}>
      <ChannelSelect value={searchType} onChange={setSearchType}/>
      <MagnifyingGlass size={20}/><input aria-label={searchType==="shop"?"搜索店铺":"搜索商品、品牌或物料编码"} value={draft} onChange={(event)=>setDraft(event.target.value)} maxLength={100} placeholder={searchType==="shop"?"搜索店铺名称…":"搜索工业品、紧固件、品牌或物料编码…"}/>
      <button type="submit" className="market-search-submit"><MagnifyingGlass size={17}/> 搜索</button>
    </form>
    <div className="market-search-actions"><Link className="button secondary market-order-link" to="/account/orders/procurement"><ClipboardText size={19}/> 我的订单</Link><Link className="button primary market-cart-button" to="/procurement/cart"><ShoppingCart size={20}/> 购物车{cart.count>0 && <span>{cart.count}</span>}</Link></div>
  </div></div>;
}
