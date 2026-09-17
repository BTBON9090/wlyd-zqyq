import { lazy, Suspense, useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUp,
  Buildings,
  CaretDown,
  CheckCircle,
  Headset,
  List,
  SignOut,
  WifiSlash,
  X,
} from "@phosphor-icons/react";
import { useApp } from "../app/AppProvider";
import { site } from "../lib/config";
import { navigation } from "../data/navigation";
import { Brand, Modal } from "./ui";
import { authCopy } from "../features/auth/authCopy";
import { GlobalTools } from "./GlobalTools";
import { useHeaderHeight } from "./useHeaderHeight";
import { useDesignVersion } from "../app/DesignVersion";

const AuthPanel = lazy(() =>
  import("../features/auth/AuthPage").then((m) => ({ default: m.AuthPanel })),
);

export function Shell() {
  const { session, logout, toast, authRequest, openAuth, closeAuth } = useApp();
  const { commerceVersion: homeVersion } = useDesignVersion();
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const authOnboarding = (authRequest?.returnTo ?? "").startsWith(
    "/onboarding",
  );
  const authText = authCopy(authRequest?.mode ?? "login", authOnboarding);
  // 二层吸顶导航与详情页目录按真实导航高度让位，避免被主导航压住。
  useHeaderHeight();


  useEffect(() => {
    setMenu(false);
    setAccountMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menu]);
  useEffect(() => {
    if (!accountMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenu(false);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".user-menu")) setAccountMenu(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [accountMenu]);
  async function handleLogout() {
    setAccountMenu(false);
    try {
      await logout();
      toast("已安全退出");
      navigate("/");
    } catch (e) {
      toast(e instanceof Error ? e.message : "退出失败，请重试");
    }
  }
  useEffect(() => {
    const on = () => setOffline(false),
      off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return (
    <div className={`app-shell${homeVersion === "v3" ? " shell-v3" : ""}${location.pathname !== "/" ? " desktop-page" : ""}`} data-design-version={homeVersion}>
      <a href="#main-content" className="skip-link">
        跳转到主要内容
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav
            className={menu ? "primary-nav is-open" : "primary-nav"}
            id="main-navigation"
            aria-label="主导航"
          >
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMenu(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            {session ? (
              <div className="user-menu">
                <button
                  type="button"
                  className="user-link"
                  aria-haspopup="menu"
                  aria-expanded={accountMenu}
                  onClick={() => setAccountMenu((open) => !open)}
                >
                  <span className="user-avatar" aria-hidden="true">
                    {session.name.slice(0, 1)}
                  </span>
                  <span className="user-name">{session.name}</span>
                  <CaretDown size={13} weight="bold" />
                </button>
                {accountMenu && (
                  <div className="user-popup" role="menu">
                    <Link
                      to="/account"
                      role="menuitem"
                      onClick={() => setAccountMenu(false)}
                    >
                      个人中心
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                    >
                      <SignOut size={15} />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="text-button login-link"
                onClick={() =>
                  openAuth({ returnTo: location.pathname + location.search })
                }
              >
                登录 / 注册
              </button>
            )}
            <Link
              className={
                session?.enterpriseStatus === "approved"
                  ? "button secondary header-enterprise"
                  : "button primary header-enterprise"
              }
              to={session ? "/onboarding" : "/"}
              onClick={(event) => {
                if (session) return;
                event.preventDefault();
                openAuth({ returnTo: "/onboarding" });
              }}
            >
              <Buildings size={18} aria-hidden="true" />
              {session?.enterpriseStatus === "approved"
                ? "我的企业"
                : "企业入驻"}
            </Link>
            <button
              className="icon-button menu-toggle"
              aria-label={menu ? "关闭导航" : "打开导航"}
              aria-expanded={menu}
              aria-controls="main-navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </div>
      </header>
      {menu && (
        <button
          className="nav-dismiss"
          aria-label="关闭导航菜单"
          onClick={() => setMenu(false)}
        />
      )}
      {offline && (
        <div className="network-banner" role="alert">
          <WifiSlash />
          网络已断开，已填写的内容会保留，请联网后重试。
        </div>
      )}
      <main id="main-content" className={location.pathname !== "/" ? "inner-page-content" : undefined}>
        <Outlet />
      </main>
      <footer className="site-footer">
        {location.pathname === "/" && (
          <div className="container footer-main">
            <div>
              <Brand />
              <p>连接专业资源，陪伴企业每一步成长。</p>
            </div>
            <div className="footer-links">
              <Link to="/services">企业服务</Link>
              <Link to="/onboarding">企业入驻</Link>
              <button onClick={() => setHelp(true)}>帮助中心</button>
            </div>
            <div className="footer-support">
              <Headset size={27} />
              <div>
                <strong>服务支持</strong>
                <span>{site.contact || "服务申请提交后，由服务商与您联系"}</span>
              </div>
            </div>
          </div>
        )}
        <div className="container footer-bottom">
          <span className="footer-build">
            建设单位：xx市经济技术开发区管理委员会 | 运营支持：万联易达（河北）科技有限公司
          </span>
          <span className="footer-copyright">
            © {new Date().getFullYear()} 万联易达集团 版权所有.
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
              冀ICP备XXXXXX号
            </a>
          </span>
        </div>
      </footer>
      <Modal
        open={help}
        onOpenChange={setHelp}
        title="办事指南"
        description="从找到服务到提交需求，三步即可完成。"
      >
        <div className="guide-list">
          {[
            ["浏览与比较", "无需登录即可查看服务范围、参考价格和交付周期。"],
            ["登录并提交需求", "选择服务，填写需求和联系人。提交前无需付款。"],
            [
              "等待服务商联系",
              "在「我的服务申请」查看记录，具体方案和费用由双方确认。",
            ],
          ].map(([title, desc], i) => (
            <div key={title}>
              <span>{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="notice">
          <CheckCircle size={20} />
          <span>企业入驻用于认证企业身份，可在注册后随时办理。</span>
        </div>
        <button
          className="button primary full-width"
          onClick={() => {
            setHelp(false);
            navigate("/services");
          }}
        >
          去找服务 <ArrowRight />
        </button>
      </Modal>
      {/* 登录 / 注册 / 重置密码改为弹窗，不再有独立页面 */}
      <Modal
        open={!!authRequest}
        onOpenChange={(open) => {
          if (!open) closeAuth();
        }}
        title={
          homeVersion === "v3" && authOnboarding
            ? "继续企业入驻"
            : authText.title
        }
        description={
          homeVersion === "v3" && authOnboarding
            ? undefined
            : authText.description
        }
      >
        <Suspense fallback={<p className="muted">正在加载…</p>}>
          {authRequest && (
            <AuthPanel
              mode={authRequest.mode}
              returnTo={authRequest.returnTo}
              onDone={(target) => {
                closeAuth();
                navigate(target);
              }}
            />
          )}
        </Suspense>
      </Modal>
      <GlobalTools />
      <BackToTop />
    </div>
  );
}
/** 全站右下角的一键回到顶部按钮，滚动一定距离后才出现。 */
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      className={`back-to-top${visible ? " is-visible" : ""}`}
      aria-label="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp size={20} weight="bold" />
    </button>
  );
}
export function Breadcrumb({
  items,
  detail = false,
}: {
  items: { label: string; to?: string }[];
  detail?: boolean;
}) {
  // 导航入口及列表页不展示，仅详情与后续办理页面显式启用。
  if (!detail) return null;
  return (
    <nav className="breadcrumb" aria-label="面包屑">
      <Link to="/">首页</Link>
      {items.map((item, i) => (
        <span key={i}>
          <CaretDown size={12} />
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
