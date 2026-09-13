import { useEffect, useRef, useState, type ElementType } from "react";
import { createPortal } from "react-dom";

/**
 * 被省略号截断的字段：长悬停后用 tips 显示完整内容。
 * 未截断时不出提示，避免重复朗读同一句话。
 * tips 走 portal + fixed，避免被卡片的 overflow 裁掉。
 */
export function EllipsisTip({
  as = "span",
  text,
  className,
  delay = 1500,
}: {
  as?: "h3" | "p" | "span";
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [tip, setTip] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const open = () => {
    window.clearTimeout(timer.current);
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth + 1) return;
    timer.current = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      setTip({
        left: Math.max(12, Math.min(r.left, window.innerWidth - 300)),
        top: Math.min(r.bottom + 6, window.innerHeight - 56),
      });
    }, delay);
  };
  const close = () => {
    window.clearTimeout(timer.current);
    setTip(null);
  };
  const Tag = as as ElementType;
  return (
    <>
      <Tag
        ref={(el: HTMLElement | null) => {
          ref.current = el;
        }}
        className={className}
        onMouseEnter={open}
        onMouseLeave={close}
      >
        {text}
      </Tag>
      {tip &&
        createPortal(
          <span
            className="field-tip"
            role="tooltip"
            style={{ left: tip.left, top: tip.top }}
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  );
}
