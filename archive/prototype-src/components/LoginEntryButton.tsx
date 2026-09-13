import { useAuth } from "../context/AuthContext";
import { useLoginModal } from "../context/LoginModalContext";

/** 未登录时右上角「登录 / 注册」入口 */
export function LoginEntryButton() {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useLoginModal();

  if (isAuthenticated) return null;

  return (
    <button type="button" className="portal-login-link" onClick={() => openLogin()}>
      登录 / 注册
    </button>
  );
}
