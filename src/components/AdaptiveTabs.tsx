import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
export function AdaptiveTabs({items,value,onChange,label="状态筛选"}:{items:{value:string;label:string;count?:number}[];value:string;onChange:(value:string)=>void;label?:string}) {
  const root=useRef<HTMLDivElement>(null), measure=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(items.length),[open,setOpen]=useState(false);
  const signature=items.map(i=>`${i.value}:${i.label}:${i.count}`).join("|");
  useLayoutEffect(()=>{
    const update=()=>{
      if(!root.current||!measure.current)return;
      const widths=Array.from(measure.current.children).map(e=>e.getBoundingClientRect().width);
      const available=root.current.clientWidth;
      if(widths.reduce((a,b)=>a+b,0)+Math.max(0,widths.length-1)*6<=available){setVisible(items.length);return;}
      let used=76,count=0;
      for(const width of widths){if(used+width+6>available)break;used+=width+6;count++;}
      setVisible(Math.max(1,count));
    };
    const observer=new ResizeObserver(update);if(root.current)observer.observe(root.current);update();
    document.fonts.ready.then(update);
    return()=>observer.disconnect();
  },[signature,items.length]);
  useEffect(()=>{
    if(!open)return;
    const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!root.current?.contains(e.target))setOpen(false);};
    const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);};
    document.addEventListener("pointerdown",outside);document.addEventListener("keydown",key);
    return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",key);};
  },[open]);
  return <div ref={root} className="adaptive-tabs v3-account-tabs" aria-label={label}>
    <div ref={measure} className="adaptive-measure" aria-hidden="true">{items.map(i=><button key={i.value} tabIndex={-1}>{i.label}{i.count!==undefined&&<span>{i.count}</span>}</button>)}</div>
    {items.slice(0,visible).map(i=><button key={i.value} aria-pressed={value===i.value} onClick={()=>onChange(i.value)}>{i.label}{i.count!==undefined&&<span>{i.count}</span>}</button>)}
    {visible<items.length&&<div className="adaptive-more"><button aria-expanded={open} aria-haspopup="menu" aria-label="更多筛选条件" className={items.slice(visible).some(i=>i.value===value)?"is-selected":""} onClick={()=>setOpen(!open)}>更多<CaretDown size={14}/></button>{open&&<div className="adaptive-menu" role="menu">{items.slice(visible).map(i=><button key={i.value} role="menuitemradio" aria-checked={value===i.value} onClick={()=>{onChange(i.value);setOpen(false);}}>{i.label}{i.count!==undefined&&<span>{i.count}</span>}</button>)}</div>}</div>}
  </div>;
}
