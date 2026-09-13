import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gateway } from "../lib/api";
import { DEMO } from "../lib/config";
import type { Session } from "../lib/models";
type Context = {
  session: Session | null;
  loading: boolean;
  authError: Error | null;
  setSession: (v: Session | null) => void;
  logout: () => Promise<void>;
  toast: (message: string) => void;
  skipped: string[];
  setSkipped: (v: string[]) => void;
  theme: string;
  setTheme: (v: string) => void;
  /** 登录 / 注册 / 重置密码改为弹窗：请求为 null 时弹窗关闭。 */
  authRequest: AuthRequest | null;
  openAuth: (options?: Partial<AuthRequest>) => void;
  closeAuth: () => void;
};
export type AuthMode = "login" | "register" | "reset";
export type AuthRequest = {
  mode: AuthMode;
  returnTo?: string;
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const auth = useQuery({
    queryKey: ["session"],
    queryFn: gateway.session,
    retry: false,
    staleTime: 60_000,
  });
  const [notice, setNotice] = useState("");
  const [authRequest, setAuthRequest] = useState<AuthRequest | null>(null);
  const openAuth = (options?: Partial<AuthRequest>) =>
    setAuthRequest({ mode: "login", ...options });
  const closeAuth = () => setAuthRequest(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("park-theme") || "blue";
    } catch {
      return "blue";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("park-theme", theme);
    } catch {
      /* theme remains usable */
    }
  }, [theme]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const expired = () => {
      client.setQueryData(["session"], null);
      client.removeQueries({ queryKey: ["receipts"] });
      client.removeQueries({ queryKey: ["demands"] });
    };
    window.addEventListener("park:session-expired", expired);
    return () => window.removeEventListener("park:session-expired", expired);
  }, [client]);
  const setSession = (session: Session | null) => {
    client.removeQueries({ queryKey: ["receipts"] });
    client.removeQueries({ queryKey: ["demands"] });
    client.setQueryData(["session"], session);
  };
  return (
    <AppContext.Provider
      value={{
        session: auth.data ?? null,
        loading: auth.isPending,
        authError: auth.error,
        setSession,
        logout: async () => {
          await gateway.logout();
          setSession(null);
        },
        toast: setNotice,
        skipped: DEMO ? skipped : [],
        setSkipped,
        theme,
        setTheme,
        authRequest,
        openAuth,
        closeAuth,
      }}
    >
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {notice && <div className="toast">{notice}</div>}
      </div>
    </AppContext.Provider>
  );
}
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppProvider missing");
  return ctx;
}
