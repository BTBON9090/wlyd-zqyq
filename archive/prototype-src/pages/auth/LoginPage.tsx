import { useLocation, useNavigate } from "react-router-dom";
import { LoginForm } from "../../components/auth/LoginForm";
import { DemoStatePanel } from "../../components/DemoStatePanel";
import { IconMark } from "../../components/Icons";
import { parkName } from "../../data";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const afterLogin = (result: {
    hasActiveEnterprise?: boolean;
    hasPendingApplications?: boolean;
  }) => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from && from.startsWith("/") && !from.startsWith("/login")) {
      navigate(from, { replace: true });
      return;
    }
    if (result.hasActiveEnterprise) {
      navigate("/", { replace: true });
      return;
    }
    if (result.hasPendingApplications) {
      navigate("/onboarding/status", { replace: true });
      return;
    }
    navigate("/onboarding", { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-panel auth-panel--brand">
        <div className="auth-brand">
          <IconMark />
          <div>
            <h1>政企园区 AI 产服平台</h1>
            <p>{parkName} · 客户端</p>
          </div>
        </div>
        <ul className="auth-features">
          <li>手机号验证码一键注册 / 登录</li>
          <li>支持密码登录 · 忘记密码重置</li>
          <li>登录后选择省市园区，完成企业入驻</li>
          <li>加入已有企业由该企业管理员审批</li>
        </ul>
      </div>

      <div className="auth-panel auth-panel--form">
        <div className="auth-form-stack">
          <LoginForm onSuccess={afterLogin} />
          <DemoStatePanel compact />
        </div>
      </div>
    </div>
  );
}
