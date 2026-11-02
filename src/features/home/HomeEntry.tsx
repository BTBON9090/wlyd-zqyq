import { lazy, Suspense } from "react";
const Home = lazy(() => import("./HomeV4Page"));
export default function HomeEntry() {
  return <Suspense fallback={<div className="loading-page">正在加载首页…</div>}><Home /></Suspense>;
}
