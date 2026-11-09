import { useEffect, useRef, useState } from 'react';
import { Barcode, ClipboardText, X } from '@phosphor-icons/react';
import { recognizeClipboardCodes, type ClipboardCode } from './clipboardCodes';
import type { Product } from './model';

export function SkuClipboardInput({value,onChange,products}:{value:string;onChange:(value:string)=>void;products:Product[]}) {
  const [open,setOpen]=useState(false),[reading,setReading]=useState(false);
  const [codes,setCodes]=useState<ClipboardCode[]>([]),[hint,setHint]=useState('');
  const input=useRef<HTMLInputElement>(null),requestId=useRef(0),suppressFocus=useRef(false);
  useEffect(()=>()=>{requestId.current++},[]);
  function close(){requestId.current++;setOpen(false);setReading(false)}
  async function readClipboard(automatic=false){
    const id=++requestId.current;
    if(automatic){
      // Browsers that have already granted access can suggest on field focus.
      // First-time permission requests stay behind the explicit clipboard button.
      try {const permission=await navigator.permissions.query({name:'clipboard-read' as PermissionName});if(permission.state!=='granted')return}
      catch{return}
    }
    if(id!==requestId.current)return;
    setOpen(true);setReading(true);setHint('');setCodes([]);
    try {
      if(!navigator.clipboard?.readText)throw new Error('unsupported');
      const text=await navigator.clipboard.readText();
      if(id!==requestId.current)return;
      const matches=recognizeClipboardCodes(text,products);setCodes(matches);
      if(!matches.length)setHint('未识别到当前园区的商品编码，可直接输入或粘贴。');
    }catch{if(id===requestId.current)setHint('无法读取剪贴板，请允许浏览器读取，或直接粘贴到输入框。')}
    finally{if(id===requestId.current)setReading(false)}
  }
  function restoreInputFocus(){if(document.activeElement!==input.current){suppressFocus.current=true;input.current?.focus()}}
  function choose(code:string){onChange(code);close();restoreInputFocus()}
  return <div className="buyer-sku-field" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))close()}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();close();restoreInputFocus()}}}>
    <input id="quick-sku" ref={input} value={value} onChange={event=>onChange(event.target.value)} onFocus={()=>{if(suppressFocus.current){suppressFocus.current=false;return}void readClipboard(true)}} placeholder="输入商品编码或 SKU" autoComplete="off" />
    <button type="button" className="buyer-clipboard-trigger" title="识别剪贴板中的商品编码" aria-label="识别剪贴板中的商品编码" aria-expanded={open} aria-controls="clipboard-codes" onClick={()=>void readClipboard()}><ClipboardText size={18}/></button>
    {open&&<div className="buyer-clipboard-dropup" id="clipboard-codes">
      <div className="buyer-clipboard-heading"><strong><ClipboardText size={17}/>剪贴板商品编码</strong><button type="button" onClick={close} aria-label="关闭剪贴板建议"><X size={15}/></button></div>
      {reading?<p role="status">正在识别…</p>:codes.length?<><p>点击编码填入，再选择“添加商品”</p><ul>{codes.map(item=><li key={item.code}><button type="button" onClick={()=>choose(item.code)}><Barcode size={18}/><span><b>{item.code}</b><small>{item.productName}</small></span></button></li>)}</ul></>:<p role="status">{hint}</p>}
    </div>}
  </div>;
}
