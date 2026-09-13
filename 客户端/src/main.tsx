import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./data/publishedServices";
import "./styles/global.css";
import "./styles/portal-shell.css";
import "./styles/news-page.css";
import "./styles/home-ui.css";
import "./styles/account-page.css";
import "./styles/service-detail.css";
import "./styles/service-order.css";

/** 子路径部署（如 /client/）用 HashRouter，避免 /client/login 直链 404 */
const base = import.meta.env.BASE_URL;
const useHash = base !== "/";
const Router = useHash ? HashRouter : BrowserRouter;
const routerProps = useHash ? {} : { basename: base.replace(/\/$/, "") || undefined };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router {...routerProps}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </StrictMode>,
);
