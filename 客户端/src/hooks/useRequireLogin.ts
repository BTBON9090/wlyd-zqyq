import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoginModal } from "../context/LoginModalContext";

/** 未登录时弹出登录窗；已登录则执行回调。返回是否已登录。 */
export function useRequireLogin() {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useLoginModal();
  const location = useLocation();

  return useCallback(
    (action?: () => void) => {
      if (!isAuthenticated) {
        openLogin(location.pathname);
        return false;
      }
      action?.();
      return true;
    },
    [isAuthenticated, openLogin, location.pathname],
  );
}
