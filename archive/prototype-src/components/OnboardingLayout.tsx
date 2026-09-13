import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EnterpriseSwitcher } from "./EnterpriseSwitcher";
import { LoginModal } from "./auth/LoginModal";
import { platformName, platformSupport } from "../data";

export function OnboardingLayout() {
  const { selectedPark, hasActiveEnterprise, pendingApplications } = useAuth();
  const { pathname, search } = useLocation();
  const isArchiveEdit = pathname.includes("/create") && search.includes("mode=archive");

  const hint = hasActiveEnterprise
    ? isArchiveEdit
      ? "正在修改企业档案 · 提交后进入运营审核"
      : "您已入驻企业，可随时进入平台或继续关联其他企业"
    : pendingApplications.length > 0
      ? `有 ${pendingApplications.length} 条申请待审核`
      : "审核通过前暂无平台经营权限";

  return (
    <div className="app onboard-app">
      <header className="portal-header">
        <div className="portal-header-inner">
          <Link to={hasActiveEnterprise ? "/" : "/onboarding"} className="portal-brand">
            <span className="portal-brand-mark">万</span>
            <span className="portal-brand-text">
              <strong>{platformName}</strong>
              <em>{selectedPark?.name ?? platformSupport}</em>
            </span>
          </Link>
          <p className="portal-onboard-hint">{hint}</p>
          <div className="portal-actions" style={{ marginLeft: "auto" }}>
            {hasActiveEnterprise ? (
              <>
                {isArchiveEdit && (
                  <Link to="/account/enterprise" className="portal-login-link">
                    返回档案
                  </Link>
                )}
                <Link to="/" className="portal-console-btn">
                  进入平台
                </Link>
              </>
            ) : (
              <Link to="/onboarding/status" className="portal-login-link">
                申请进度
              </Link>
            )}
            <EnterpriseSwitcher />
          </div>
        </div>
      </header>
      <main className="page-main">
        <Outlet />
      </main>
      <footer className="portal-footer">
        <div className="portal-footer-inner" style={{ gridTemplateColumns: "1fr auto" }}>
          <div>
            <div className="portal-footer-brand">
              <span className="portal-brand-mark">万</span>
              <strong>{isArchiveEdit ? "企业档案变更" : "企业入驻"}</strong>
            </div>
            <p>
              {isArchiveEdit
                ? "修改并提交后由园区运营审核；审核期间可继续使用平台功能。"
                : "完成园区选择与企业审核后，即可开通集采、金融、企服等功能。"}
            </p>
          </div>
          {hasActiveEnterprise && (
            <Link to="/" className="portal-console-btn" style={{ alignSelf: "center" }}>
              返回平台首页
            </Link>
          )}
        </div>
      </footer>
      <LoginModal />
    </div>
  );
}
