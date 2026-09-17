import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";

const storageKey = "park-acceptance-position-v4";
type Position = { x: number; y: number };
export function useDraggableTool() {
  const ref = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const drag = useRef<{ x: number; y: number; origin: Position; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  function move(next: Position, persist = true) {
    const rect = ref.current?.getBoundingClientRect();
    const bounded = {
      x: Math.max(8, Math.min(next.x, window.innerWidth - (rect?.width ?? 120) - 8)),
      y: Math.max(8, Math.min(next.y, window.innerHeight - (rect?.height ?? 44) - 8)),
    };
    setPosition(bounded);
    if (persist) try { localStorage.setItem(storageKey, JSON.stringify(bounded)); } catch { /* Storage may be disabled. */ }
  }
  useEffect(() => {
    const rect = ref.current!.getBoundingClientRect();
    const versions = document.querySelector(".global-tools")?.getBoundingClientRect();
    let initial = { x: versions ? versions.right + 12 : 210, y: versions ? versions.top : window.innerHeight - rect.height - 24 };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) initial = saved;
    } catch { /* Use the default corner position. */ }
    move(initial, false);
    const syncDefault = () => {
      try { if (localStorage.getItem(storageKey)) return; } catch { /* Use default position. */ }
      const versions = document.querySelector(".global-tools")?.getBoundingClientRect();
      if (versions) move({ x: versions.right + 12, y: versions.top }, false);
    };
    const frame = requestAnimationFrame(syncDefault);
    const observer = new ResizeObserver(syncDefault);
    const toolbar = document.querySelector(".global-tools");
    if (toolbar) observer.observe(toolbar);
    const resize = () => {
      const bounds = ref.current!.getBoundingClientRect();
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      const versions = document.querySelector(".global-tools")?.getBoundingClientRect();
      let custom = false;
      try { custom = !!localStorage.getItem(storageKey); } catch { /* Use default position. */ }
      move(custom ? { x: bounds.x, y: bounds.y } : { x: versions ? versions.right + 12 : 210, y: window.innerHeight - bounds.height - 24 }, false);
    };
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);
  const above = (position?.y ?? viewport.height) > viewport.height / 2;
  const space = above ? (position?.y ?? viewport.height - 70) : viewport.height - (position?.y ?? 0) - 54;
  return {
    ref,
    style: position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined,
    panelStyle: {
      position: "absolute" as const,
      ...(above ? { bottom: "calc(100% + 10px)" } : { top: "calc(100% + 10px)" }),
      ...((position?.x ?? viewport.width) < 330 ? { left: 0 } : { right: 0 }),
      maxHeight: Math.max(80, space - 18),
      maxWidth: "calc(100vw - 16px)",
    },
    triggerProps: {
      title: "拖拽移动，点击展开；方向键可调整位置",
      onPointerDown(e: PointerEvent<HTMLButtonElement>) {
        if (e.button !== 0) return;
        const rect = ref.current!.getBoundingClientRect();
        suppressClick.current = false;
        drag.current = { x: e.clientX, y: e.clientY, origin: { x: rect.x, y: rect.y }, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove(e: PointerEvent<HTMLButtonElement>) {
        const current = drag.current;
        if (!current) return;
        const dx = e.clientX - current.x, dy = e.clientY - current.y;
        if (Math.hypot(dx, dy) > 5) current.moved = true;
        if (current.moved) move({ x: current.origin.x + dx, y: current.origin.y + dy });
      },
      onPointerUp() { suppressClick.current = !!drag.current?.moved; drag.current = null; },
      onPointerCancel() { drag.current = null; suppressClick.current = true; },
      onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
        const offsets: Record<string, [number, number]> = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
        const delta = offsets[e.key];
        if (!delta || !position) return;
        e.preventDefault();
        move({ x: position.x + delta[0], y: position.y + delta[1] });
      },
    },
    allowClick() { const allow = !suppressClick.current; suppressClick.current = false; return allow; },
  };
}
