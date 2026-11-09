import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  UAT,
  configureUatSession,
  resetUatSession,
  uatRequest,
  type StateKey,
  type UatSession,
  type UatUser,
} from "./api";

import { CloudStateStore, emptyEntries, type Entries } from "./cloudState";

type Context = {
  user: UatUser | null;
  loading: boolean;
  error: string;
  entries: Entries;
  refreshSession: () => Promise<void>;
  authenticate: (mode: "login" | "register", input: object) => Promise<void>;
  logout: () => Promise<void>;
  loadStates: () => Promise<void>;
  update: (key: StateKey, value: unknown) => Promise<boolean>;
  resolve: (key: StateKey, keep: boolean) => Promise<boolean>;
};
export const Context = createContext<Context | null>(null);
export function UatSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UatUser | null>(null);
  const userRef = useRef<UatUser | null>(null);
  const [loading, setLoading] = useState(UAT),
    [error, setError] = useState("");
  const [entries, setEntries] = useState<Entries>(emptyEntries);
  const storeRef = useRef<CloudStateStore | null>(null);
  if (!storeRef.current)
    storeRef.current = new CloudStateStore(uatRequest, setEntries);
  const store = storeRef.current;
  const sessionFlight = useRef<Promise<void> | null>(null);
  function clear() {
    resetUatSession();
    store.reset();
    queryClient.clear();
    userRef.current = null;
    setUser(null);
  }
  async function refreshSession() {
    if (sessionFlight.current) return sessionFlight.current;
    const work = (async () => {
      setError("");
      const result = await uatRequest<UatSession>("/auth/session");
      if (result.user?.id !== userRef.current?.id) clear();
      configureUatSession(result);
      userRef.current = result.user;
      setUser(result.user);
    })();
    sessionFlight.current = work;
    try {
      await work;
    } finally {
      sessionFlight.current = null;
    }
  }
  async function loadStates() {
    if (userRef.current) await store.loadAll();
  }
  useEffect(() => {
    if (!UAT) return;
    let alive = true;
    void refreshSession()
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    const expired = () => {
      clear();
      setError("登录已过期，请重新登录。");
    };
    const focus = () => {
      void refreshSession().catch((e) => setError(e.message));
    };
    window.addEventListener("uat:session-expired", expired);
    window.addEventListener("focus", focus);
    return () => {
      alive = false;
      window.removeEventListener("uat:session-expired", expired);
      window.removeEventListener("focus", focus);
    };
  }, []);
  useEffect(() => {
    if (UAT && user?.id) void loadStates();
  }, [user?.id]);
  useEffect(() => {
    if (!UAT) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (
        Object.values(store.entries).some(
          (entry) => entry.saving || entry.revision,
        )
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const update = (key: StateKey, value: unknown) =>
    userRef.current ? store.update(key, value) : Promise.resolve(false);
  const resolve = async (key: StateKey, keep: boolean) => {
    const resolved = await store.resolve(key, keep, (message) =>
      window.confirm(message),
    );
    if (resolved && (key === "preferences" || key === "profile")) {
      try {
        await refreshSession();
      } catch {
        /* Persisted document remains available; focus retries the session read. */
      }
    }
    return resolved;
  };
  return (
    <Context.Provider
      value={{
        user,
        loading,
        error,
        entries,
        refreshSession,
        loadStates,
        update,
        resolve,
        authenticate: async (mode, input) => {
          clear();
          const session = await uatRequest<UatSession>(`/auth/${mode}`, {
            method: "POST",
            body: JSON.stringify(input),
          });
          configureUatSession(session);
          userRef.current = session.user;
          setUser(session.user);
          setError("");
        },
        logout: async () => {
          await uatRequest("/auth/logout", { method: "POST", body: "{}" });
          clear();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useUat() {
  const value = useContext(Context);
  if (!value) throw new Error("UatSessionProvider missing");
  return value;
}
