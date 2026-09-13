import { useNavigate } from "react-router-dom";
import { useLoginModal } from "../../context/LoginModalContext";
import { LoginForm } from "./LoginForm";
import { SupplierDemoLogin } from "./SupplierDemoLogin";

export function LoginModal() {
  const { open, redirectAfter, closeLogin } = useLoginModal();
  const navigate = useNavigate();

  if (!open) return null;

  const handleSuccess = (_result: {
    hasActiveEnterprise?: boolean;
    hasPendingApplications?: boolean;
  }) => {
    closeLogin();
    if (redirectAfter && redirectAfter.startsWith("/") && !redirectAfter.startsWith("/login")) {
      navigate(redirectAfter, { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="auth-modal-backdrop" onClick={closeLogin}>
      <div
        className="login-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="login-modal-close" aria-label="关闭" onClick={closeLogin}>
          ×
        </button>
        <LoginForm compact onSuccess={handleSuccess} />
        <SupplierDemoLogin />
      </div>
    </div>
  );
}
