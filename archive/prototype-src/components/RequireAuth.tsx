import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoginModal } from "../context/LoginModalContext";
import { pathForDemoPersona } from "../types/auth";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { openLogin } = useLoginModal();

  useEffect(() => {
    if (!isAuthenticated) {
      openLogin(location.pathname);
    }
  }, [isAuthenticated, location.pathname, openLogin]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasActiveEnterprise, demoPersona } = useAuth();
  if (isAuthenticated) {
    const to = pathForDemoPersona(demoPersona) ?? (hasActiveEnterprise ? "/" : "/onboarding");
    return <Navigate to={to} replace />;
  }
  return <>{children}</>;
}

/** 无已入驻企业时禁止进入平台功能页 */
export function RequireEnterprise({ children }: { children: ReactNode }) {
  const { hasActiveEnterprise } = useAuth();
  if (!hasActiveEnterprise) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}
