import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const V1 = lazy(() => import("./HomePage"));
const V2 = lazy(() => import("./HomeV2Page"));
const V3 = lazy(() => import("./HomeV3Page"));

type Version = "v1" | "v2" | "v3";

function savedVersion(): Version {
  try {
    const value = localStorage.getItem("park-home-version");
    if (value === "v1" || value === "v2" || value === "v3") return value;
  } catch {
    /* ignore */
  }
  return "v3";
}

export default function HomeEntry() {
  const [params] = useSearchParams();
  const [version, setVersion] = useState(savedVersion);

  // 监听版本变化（来自 GlobalTools 或其他标签页）
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "park-home-version") setVersion(savedVersion());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // URL 参数优先
  useEffect(() => {
    const urlVersion = params.get("home");
    if (urlVersion === "v1" || urlVersion === "v2" || urlVersion === "v3") {
      setVersion(urlVersion);
    }
  }, [params]);

  const finalVersion = __DEMO__
    ? version
    : (import.meta.env.VITE_HOME_VERSION as Version) || "v2";

  const Page = finalVersion === "v1" ? V1 : finalVersion === "v2" ? V2 : V3;

  return (
    <Suspense fallback={<div className="loading-page">正在加载首页…</div>}>
      <Page />
    </Suspense>
  );
}
