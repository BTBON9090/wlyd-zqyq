import { useEffect, useRef } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AiAssistant } from "./components/AiAssistant";
import { LoginModal } from "./components/auth/LoginModal";
import { OnboardingLayout } from "./components/OnboardingLayout";
import { GuestOnly, RequireAuth } from "./components/RequireAuth";
import { TopBar } from "./components/TopBar";
import { LoginModalProvider, useLoginModal } from "./context/LoginModalContext";
import { useAuth } from "./context/AuthContext";
import { roleHasPermission, type PermissionKey } from "./data/rolePermissions";
import { AccountLayout } from "./pages/account/AccountLayout";
import { DemandBidsPage } from "./pages/account/DemandBidsPage";
import { EnterpriseArchivePage } from "./pages/account/EnterpriseArchivePage";
import { FinanceRecordsPage } from "./pages/account/FinanceRecordsPage";
import { MemberManagePage } from "./pages/account/MemberManagePage";
import { ProcurementOrdersPage } from "./pages/account/ProcurementOrdersPage";
import { ProfilePage } from "./pages/account/ProfilePage";
import { RoleManagePage } from "./pages/account/RoleManagePage";
import { ServiceOrdersPage } from "./pages/account/ServiceOrdersPage";
import { Home } from "./pages/Home";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ProcurementPage } from "./pages/procurement/ProcurementPage";
import { FinancePage } from "./pages/finance/FinancePage";
import { ServiceDetailPage } from "./pages/services/ServiceDetailPage";
import { ServicesHallPage } from "./pages/services/ServicesHallPage";
import { ServicesHotPage } from "./pages/services/ServicesHotPage";
import { ServiceOrderPage } from "./pages/services/ServiceOrderPage";
import { DemandPage } from "./pages/demand/DemandPage";
import { IndustryMapPage } from "./pages/map/IndustryMapPage";
import { NewsPage } from "./pages/news/NewsPage";
import { ApplicationStatusPage } from "./pages/onboarding/ApplicationStatusPage";
import { CreateEnterprisePage } from "./pages/onboarding/CreateEnterprisePage";
import { InviteEnterprisePage } from "./pages/onboarding/InviteEnterprisePage";
import { JoinEnterprisePage } from "./pages/onboarding/JoinEnterprisePage";
import { OnboardingGuidePage } from "./pages/onboarding/OnboardingGuidePage";

/** 一级模块可浏览：未登录 / 未入驻均可进入列表页；详情与交易动作由页内拦截登录 */
function RequireEnterpriseOutlet() {
  return <Outlet />;
}

function RequirePermissionOutlet({ permission }: { permission: PermissionKey }) {
  const { isAuthenticated, activeMembership } = useAuth();
  // 未登录可浏览；已入驻成员按角色权限过滤
  if (!isAuthenticated || !activeMembership) {
    return <Outlet />;
  }
  if (!roleHasPermission(activeMembership.role, permission)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function AccountOrdersGuard() {
  const { hasActiveEnterprise } = useAuth();
  if (!hasActiveEnterprise) {
    return <Navigate to="/account/enterprise" replace />;
  }
  return <Outlet />;
}

function AccountIndexRedirect() {
  const { hasActiveEnterprise, pendingApplications } = useAuth();
  if (hasActiveEnterprise || pendingApplications.length > 0) {
    return <Navigate to="/account/enterprise" replace />;
  }
  return <Navigate to="/account/profile" replace />;
}

function SupplierPortalSso() {
  const { loginFromSupplierPortal } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hashQuery = window.location.hash.includes("?")
      ? window.location.hash.slice(window.location.hash.indexOf("?"))
      : "";
    const params = search.get("from") ? search : new URLSearchParams(hashQuery);
    if (params.get("from") !== "supplier") return;
    const phone = params.get("phone") ?? "";
    if (!/^1\d{10}$/.test(phone)) return;

    // 无论是否已登录，都先清除 SSO 参数，避免退出后因 URL 残留而再次自动登录
    const hashPath = window.location.hash.split("?")[0];
    window.history.replaceState({}, "", `${window.location.pathname}${hashPath}`);

    if (handled.current) return;
    handled.current = true;
    loginFromSupplierPortal(phone);
  }, [loginFromSupplierPortal]);

  return null;
}

function AppShell() {
  return (
    <div className="app">
      <SupplierPortalSso />
      <TopBar />
      <main className="page-main">
        <Routes>
          <Route path="/account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
            <Route index element={<AccountIndexRedirect />} />
            <Route path="enterprise" element={<EnterpriseArchivePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route element={<AccountOrdersGuard />}>
              <Route path="orders/procurement" element={<ProcurementOrdersPage />} />
              <Route path="orders/finance" element={<FinanceRecordsPage />} />
              <Route path="orders/services" element={<ServiceOrdersPage />} />
              <Route path="orders/demand" element={<DemandBidsPage />} />
              <Route path="settings" element={<Navigate to="/account/settings/members" replace />} />
              <Route path="settings/members" element={<MemberManagePage />} />
              <Route path="settings/roles" element={<RoleManagePage />} />
            </Route>
          </Route>

          <Route path="/" element={<Home />} />

          <Route element={<RequireEnterpriseOutlet />}>
            <Route element={<RequirePermissionOutlet permission="services" />}>
              <Route path="/services" element={<ServicesHotPage />} />
              <Route path="/services/hall" element={<ServicesHallPage />} />
              <Route path="/services/:serviceId/order" element={<ServiceOrderPage />} />
              <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
            </Route>
            <Route element={<RequirePermissionOutlet permission="finance" />}>
              <Route path="/finance" element={<FinancePage />} />
            </Route>
            <Route element={<RequirePermissionOutlet permission="procurement" />}>
              <Route path="/procurement" element={<ProcurementPage />} />
            </Route>
            <Route
              path="/logistics"
              element={
                <PlaceholderPage
                  title="智慧物流"
                  brand="万连通"
                  desc="网络货运平台即将上线：一键发运、智能调度、透明结算。当前为占位页，后续接入运单与车货匹配能力。"
                  hints={["找车发货", "运费结算", "智能调度", "运单跟踪"]}
                />
              }
            />
            <Route element={<RequirePermissionOutlet permission="news" />}>
              <Route path="/news" element={<NewsPage />} />
            </Route>
            <Route
              path="/ai"
              element={
                <PlaceholderPage
                  title="AI赋能"
                  brand="AI智能体"
                  desc="企业数字化转型引擎即将开放：大模型定制与智能化方案。当前为占位页，可先通过右下角 AI 助手体验对话能力。"
                  hints={["政策问答", "商机速配", "行情解读", "大模型定制"]}
                />
              }
            />
            <Route element={<RequirePermissionOutlet permission="demand" />}>
              <Route path="/demand" element={<DemandPage />} />
            </Route>
            <Route element={<RequirePermissionOutlet permission="map" />}>
              <Route path="/map" element={<IndustryMapPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="portal-footer portal-footer--ref">
        <div className="portal-footer-ref">
          <p>建设单位：xx市经济技术开发区管理委员会 | 运营支持：万联易达（河北）科技有限公司</p>
          <p>© 2026 万联易达集团 版权所有. 冀ICP备XXXXXX号</p>
        </div>
      </footer>
      <AiAssistant />
      <LoginModal />
    </div>
  );
}

export default function App() {
  return (
    <LoginModalProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginRedirect />
            </GuestOnly>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingLayout />
            </RequireAuth>
          }
        >
          <Route index element={<OnboardingGuidePage />} />
          <Route path="create" element={<CreateEnterprisePage />} />
          <Route path="invite" element={<InviteEnterprisePage />} />
          <Route path="join" element={<JoinEnterprisePage />} />
          <Route path="status" element={<ApplicationStatusPage />} />
        </Route>
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </LoginModalProvider>
  );
}

function LoginRedirect() {
  const { openLogin } = useLoginModal();
  useEffect(() => {
    openLogin();
  }, [openLogin]);
  return <Navigate to="/" replace />;
}
