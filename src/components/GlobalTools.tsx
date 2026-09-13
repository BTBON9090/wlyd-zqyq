import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Version = "v1" | "v2" | "v3";

function getVersion(): Version {
  try {
    const value = localStorage.getItem("park-home-version");
    if (value === "v1" || value === "v2" || value === "v3") return value;
  } catch {
    /* ignore */
  }
  return "v3";
}

function setVersion(v: Version) {
  try {
    localStorage.setItem("park-home-version", v);
    // 触发其他标签页和同页面的监听
    window.dispatchEvent(new StorageEvent("storage", { key: "park-home-version", newValue: v }));
  } catch {
    /* ignore */
  }
}

/** 全局工具栏：版本切换 + 验收工具（可拖拽） */
export function GlobalTools() {
  const location = useLocation();
  const navigate = useNavigate();
  const [version, setVersionState] = useState(getVersion);
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

  // 监听版本变化
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "park-home-version") setVersionState(getVersion());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 拖拽逻辑
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const x = Math.max(0, Math.min(window.innerWidth - 140, e.clientX - offset.current.x));
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

  const switchTo = (v: Version) => {
    setVersion(v);
    setVersionState(v);
    // 如果在首页，刷新 URL 参数触发重新渲染
    if (location.pathname === "/" || location.pathname === "") {
      const params = new URLSearchParams(location.search);
      params.set("home", v);
      navigate(`/?${params.toString()}`, { replace: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

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
        {(["v1", "v2", "v3"] as const).map((v) => (
          <button
            key={v}
            className={version === v ? "is-active" : ""}
            onClick={() => switchTo(v)}
            title={`切换到 ${v.toUpperCase()} 版本`}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
