import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
export type DesignVersion = "v1" | "v2" | "v3";
const valid = (v: string | null): v is DesignVersion => v === "v1" || v === "v2" || v === "v3";
const key = "park-home-version";
function saved(): DesignVersion {
  try { const v = localStorage.getItem(key); if (valid(v)) return v; } catch { /* Optional storage. */ }
  return "v3";
}
const Context = createContext<{ version: DesignVersion; switchVersion: (v: DesignVersion) => void }>({ version: "v2", switchVersion: () => {} });
export function DesignVersionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [preference, setPreference] = useState(saved);
  const url = new URLSearchParams(location.search).get("home");
  const configured = import.meta.env.VITE_HOME_VERSION || "v2";
  const version: DesignVersion = __DEMO__ ? (valid(url) ? url : preference) : (valid(configured) ? configured : "v2");
  useEffect(() => {
    if (__DEMO__ && valid(url)) {
      setPreference(url);
      try { localStorage.setItem(key, url); } catch { /* Keep the in-memory preference. */ }
    }
  }, [url]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== key || !valid(event.newValue)) return;
      setPreference(event.newValue);
      const params = new URLSearchParams(location.search);
      if (params.has("home")) {
        params.set("home", event.newValue);
        navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash }, { replace: true });
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [location, navigate]);
  useEffect(() => {
    document.documentElement.dataset.designVersion = version;
    return () => { delete document.documentElement.dataset.designVersion; };
  }, [version]);
  useEffect(() => {
    if (version !== "v3") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reduced.matches) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(".button.primary") : null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--button-x", `${event.clientX - rect.left}px`);
      target.style.setProperty("--button-y", `${event.clientY - rect.top}px`);
      target.style.setProperty("--v3-light-x", `${event.clientX - rect.left}px`);
      target.style.setProperty("--v3-light-y", `${event.clientY - rect.top}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, [version]);
  const switchVersion = (v: DesignVersion) => {
    setPreference(v);
    try { localStorage.setItem(key, v); } catch { /* Keep the in-memory preference. */ }
    const params = new URLSearchParams(location.search);
    params.set("home", v);
    navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash }, { replace: true });
  };
  return <Context.Provider value={{ version, switchVersion }}>{children}</Context.Provider>;
}
export const useDesignVersion = () => useContext(Context);
