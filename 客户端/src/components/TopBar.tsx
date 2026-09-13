import { FormEvent, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { navItems, platformName, platformSupport } from "../data";
import { useAuth } from "../context/AuthContext";
import { roleHasPermission, type PermissionKey } from "../data/rolePermissions";
import { LoginEntryButton } from "./LoginEntryButton";
import { EnterpriseSwitcher } from "./EnterpriseSwitcher";
import { useLoginModal } from "../context/LoginModalContext";
import { IconBell, IconSearch } from "./Icons";

const navPermission: Partial<Record<string, PermissionKey>> = {
  "/procurement": "procurement",
  "/finance": "finance",
  "/services": "services",
  "/news": "news",
  // 占位模块：登录后均可浏览，不额外按角色裁剪
};

export function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, hasActiveEnterprise, activeMembership, pendingApplications, incomingJoinRequests } =
    useAuth();
  const { openLogin } = useLoginModal();
  const isHome = pathname === "/";
  const [search, setSearch] = useState("");
  const [searchHint, setSearchHint] = useState("");

  const visibleNav = navItems.filter((item) => {
    if (item.to === "/") return true;
    const key = navPermission[item.to];
    if (!key || !activeMembership) return true;
    return roleHasPermission(activeMembership.role, key);
  });

  const noticeCount = pendingApplications.length + incomingJoinRequests.length;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) {
      setSearchHint("请输入关键词");
      return;
    }
    setSearchHint("");
    if (/金融|融资|贷款|贴息/.test(q)) navigate("/finance");
    else if (/服务|企服|法务|财税/.test(q)) navigate("/services");
    else if (/物流|货运|发货|运单/.test(q)) navigate("/logistics");
    else if (/AI|智能|模型/.test(q)) navigate("/ai");
    else if (/资讯|政策|新闻/.test(q)) navigate("/news");
    else if (/地图|企业|园区/.test(q)) navigate("/map");
    else navigate("/procurement");
  };

  return (
    <header className="portal-header">
      <div className="portal-header-inner">
        <NavLink to="/" className="portal-brand">
          <span className="portal-brand-mark">万</span>
          <span className="portal-brand-text">
            <strong>{platformName}</strong>
            <em>{platformSupport}</em>
          </span>
        </NavLink>

        <nav className="portal-nav">
          {visibleNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="portal-header-end">
          {isAuthenticated && hasActiveEnterprise && !isHome && (
            <form className="portal-search" onSubmit={onSearch} title={searchHint || undefined}>
              <IconSearch width={16} height={16} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (searchHint) setSearchHint("");
                }}
                placeholder="搜索商品 / 服务 / 金融 / 企业"
                aria-label="全局搜索"
              />
            </form>
          )}

          <div className="portal-actions">
            <LoginEntryButton />
            {isAuthenticated && hasActiveEnterprise && (
              <button
                type="button"
                className="portal-icon-btn"
                aria-label="消息与待办"
                title="查看待审申请"
                onClick={() =>
                  navigate(noticeCount > 0 ? "/account/settings/members" : "/onboarding/status")
                }
              >
                <IconBell />
                {noticeCount > 0 && <span className="badge">{noticeCount > 9 ? "9+" : noticeCount}</span>}
              </button>
            )}
            {isAuthenticated && <EnterpriseSwitcher />}
            {isAuthenticated ? (
              <Link to="/account" className="portal-console-btn">
                企业控制台
              </Link>
            ) : (
              <button type="button" className="portal-console-btn" onClick={() => openLogin()}>
                企业控制台
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
