import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LoginModalContextValue = {
  open: boolean;
  redirectAfter?: string;
  openLogin: (redirectAfter?: string) => void;
  closeLogin: () => void;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [redirectAfter, setRedirectAfter] = useState<string | undefined>();

  const openLogin = useCallback((after?: string) => {
    setRedirectAfter(after);
    setOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setOpen(false);
    setRedirectAfter(undefined);
  }, []);

  const value = useMemo(
    () => ({ open, redirectAfter, openLogin, closeLogin }),
    [open, redirectAfter, openLogin, closeLogin],
  );

  return <LoginModalContext.Provider value={value}>{children}</LoginModalContext.Provider>;
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error("useLoginModal must be used within LoginModalProvider");
  }
  return ctx;
}
