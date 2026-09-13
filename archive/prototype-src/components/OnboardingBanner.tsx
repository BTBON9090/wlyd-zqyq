import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function OnboardingBanner() {
  const { hasActiveEnterprise, pendingApplications, isAuthenticated } = useAuth();
  if (!isAuthenticated || hasActiveEnterprise) return null;

  return (
    <div className="onboard-banner">
      <div className="container onboard-banner__inner">
        <div>
          <strong>完成企业入驻，开通交易权限</strong>
          <span>
            您当前为个人用户
            {pendingApplications.length > 0 && ` · ${pendingApplications.length} 条申请审核中`}
          </span>
        </div>
        <div className="onboard-banner__actions">
          <Link to="/onboarding" className="btn btn-primary btn-sm">立即入驻</Link>
          {pendingApplications.length > 0 && (
            <Link to="/onboarding/status" className="btn btn-ghost btn-sm">查看进度</Link>
          )}
        </div>
      </div>
    </div>
  );
}
