import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { emptyModules } from "../data/navigation";
import { BlankModule } from "../components/BlankModule";
import { Shell } from "../components/Shell";
import { EmptyState } from "../components/ui";
import { site } from "../lib/config";
const Home = lazy(() => import("../features/home/HomeEntry"));
const Onboarding = lazy(() => import("../features/auth/OnboardingPage"));
const Legal = lazy(() => import("../features/auth/LegalPage"));
const Account = lazy(() => import("../features/account/AccountPage"));
const Services = lazy(() => import("../features/services/ServicesPage"));
const Detail = lazy(() => import("../features/services/ServiceDetailPage"));
const Request = lazy(() => import("../features/services/ServiceRequestPage"));
const Requests = lazy(() =>
  import("../features/services/ServiceRequestPage").then((m) => ({
    default: m.ServiceRequestsPage,
  })),
);
const Acceptance = __DEMO__
  ? lazy(() => import("../dev/AcceptancePanel"))
  : null;
function PageTitle() {
  const location = useLocation();
  useEffect(() => {
    const name = location.pathname.startsWith("/account")
      ? "个人中心"
      : location.pathname.startsWith("/services")
        ? "企业服务"
        : location.pathname.startsWith("/onboarding")
          ? "企业入驻"
          : emptyModules.find((item) => item.to === location.pathname)?.label ||
            "首页";
    document.title = `${name} · ${site.name}`;
  }, [location.pathname]);
  return null;
}
export default function App() {
  return (
    <>
      <PageTitle />
      <Suspense
        fallback={
          <div className="loading-page" role="status">
            正在加载页面…
          </div>
        }
      >
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            {emptyModules.map((item) => (
              <Route
                key={item.to}
                path={item.to.slice(1)}
                element={<BlankModule label={item.label} />}
              />
            ))}
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="onboarding/:step" element={<Onboarding />} />
            <Route path="services" element={<Services />} />
            <Route path="services/hall" element={<Services />} />
            <Route path="services/requests" element={<Requests />} />
            <Route path="services/:serviceId" element={<Detail />} />
            <Route path="services/:serviceId/order" element={<Request />} />
            <Route path="account/*" element={<Account />} />
            <Route path="legal/:type" element={<Legal />} />
            <Route
              path="*"
              element={
                <div className="container not-found">
                  <EmptyState
                    title="这个页面暂时不可用"
                    description="试点已开放首页、登录注册与企业服务。"
                  />
                  <a className="button primary" href={import.meta.env.BASE_URL}>
                    返回首页
                  </a>
                </div>
              }
            />
          </Route>
        </Routes>
      </Suspense>
      {Acceptance && (
        <Suspense fallback={null}>
          <Acceptance />
        </Suspense>
      )}
    </>
  );
}
