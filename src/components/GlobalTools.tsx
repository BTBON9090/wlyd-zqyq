import { useEffect, useRef, useState } from "react";
import { useDesignVersion, type DesignVersion as Version } from "../app/DesignVersion";

/** 全局工具栏：版本切换 + 验收工具（可拖拽） */
export function GlobalTools() {
  const { version, switchVersion } = useDesignVersion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem("park-tools-position");
      if (saved) return JSON.parse(saved) as { x: number; y: number };
    } catch {
      /* ignore */
    }
    return { x: 20, y: window.innerHeight - 120 };
  });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const clamp = () => setPosition(current => ({
      x: Math.max(0, Math.min(current.x, window.innerWidth - (containerRef.current?.offsetWidth || 180))),
      y: Math.max(0, Math.min(current.y, window.innerHeight - 50)),
    }));
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);

  // 拖拽逻辑
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const x = Math.max(0, Math.min(window.innerWidth - (containerRef.current?.offsetWidth || 180), e.clientX - offset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - offset.current.y));
      setPosition({ x, y });
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.userSelect = "";
        // 保存位置
        try {
          localStorage.setItem("park-tools-position", JSON.stringify(position));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [position]);

  const startDrag = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    dragging.current = true;
    document.body.style.userSelect = "none";
    const rect = containerRef.current.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const switchTo = (v: Version) => switchVersion(v);

  if (!__DEMO__) return null;

  return (
    <div
      ref={containerRef}
      className="global-tools"
      style={{ left: position.x, top: position.y }}
    >
      <div className="global-tools-handle" onPointerDown={startDrag} title="拖拽移动">
        ⋮⋮
      </div>
      <div className="global-tools-versions">
        {(["v1", "v2", "v3", "v4"] as const).map((v) => (
          <button
            key={v}
            className={version === v ? "is-active" : ""}
            onClick={() => switchTo(v)}
            aria-pressed={version === v}
            title={`切换到 ${v.toUpperCase()} 版本`}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
