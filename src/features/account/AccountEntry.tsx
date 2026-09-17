import { lazy, Suspense } from "react";
import { useDesignVersion } from "../../app/DesignVersion";
const Legacy = lazy(() => import("./AccountPage"));
const V3 = lazy(() => import("./AccountV3Page"));
export default function AccountEntry() {
  const { commerceVersion: version } = useDesignVersion();
  const Page = version === "v3" ? V3 : Legacy;
  return <Suspense fallback={<div className="loading-page">正在加载个人中心…</div>}><Page /></Suspense>;
}
