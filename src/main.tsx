import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IconContext } from "@phosphor-icons/react";
import { AppProvider } from "./app/AppProvider";
import { ErrorBoundary } from "./components/ui";
import App from "./app/App";
import { DesignVersionProvider } from "./app/DesignVersion";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/pages.css";
import "./styles/home.css";
import "./styles/home-v3.css";
import "./styles/showcase.css";
import "./styles/controls.css";
import "./styles/commerce-v2.css";
// 金额字体层，最后导入以覆盖各页面既有的 font-weight
import "./styles/fonts.css";
import "./styles/v3-commerce.css";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 120_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <IconContext.Provider value={{ size: 20, weight: "regular" }}>
          <BrowserRouter
            basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}
          >
            <AppProvider>
              <DesignVersionProvider><App /></DesignVersionProvider>
            </AppProvider>
          </BrowserRouter>
        </IconContext.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
