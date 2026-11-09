import { useEffect, useId, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

/** Notes are readable immediately; only overflowing notes need a disclosure. */
export function ProductRemark({ text }: { text: string }) {
  const id = useId(), measure = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false), [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const element = measure.current;
    if (!element) return;
    const update = () => setOverflow(element.scrollWidth > element.clientWidth + 1 || /[\r\n]/.test(text.trim()));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);
  const showFull = expanded && overflow;
  return <div className={`purchase-product-remark${showFull ? " is-expanded" : ""}`}>
    <span ref={measure} className="purchase-remark-measure" aria-hidden="true">{text}</span>
    <p id={id}>{text}</p>
    {overflow && <button type="button" className="purchase-remark-toggle" aria-expanded={showFull}
      aria-controls={id} aria-label={showFull ? "收起商品备注" : "展开商品备注"}
      onClick={() => setExpanded(!showFull)}>
      <CaretDown size={16} aria-hidden="true"/>
    </button>}
  </div>;
}
