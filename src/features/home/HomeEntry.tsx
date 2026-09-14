import { lazy, Suspense } from "react";
import { useDesignVersion } from "../../app/DesignVersion";
const V1 = lazy(() => import("./HomePage"));
const V2 = lazy(() => import("./HomeV2Page"));
const V3 = lazy(() => import("./HomeV3Page"));
export default function HomeEntry() {
  const { version } = useDesignVersion();
  const Page = version === "v1" ? V1 : version === "v2" ? V2 : V3;
  return <Suspense fallback={<div className="loading-page">正在加载首页…</div>}><Page /></Suspense>;
}