import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type NavItem = {
  to: string;
  label: string;
  desc: string;
  always?: boolean;
  needEnterprise?: boolean;
};

const accountNav: NavItem[] = [
  { to: "/account/enterprise", label: "企业档案", desc: "入驻信息与变更", always: true },
  { to: "/account/profile", label: "个人信息", desc: "手机号 · 密码 · 安全", always: true },
  { to: "/account/orders/procurement", label: "集采订单", desc: "电商 / 协议 / 询价", needEnterprise: true },
  { to: "/account/orders/finance", label: "金融服务记录", desc: "申请 · 融资 · 对账", needEnterprise: true },
  { to: "/account/orders/services", label: "企业服务订单", desc: "严选服务履约", needEnterprise: true },
  { to: "/account/orders/demand", label: "接单记录", desc: "报价与中标", needEnterprise: true },
];

const settingsNav: NavItem[] = [
  {
    to: "/account/settings/members",
    label: "成员管理",
    desc: "成员列表 · 加入审核",
    needEnterprise: true,
  },
  {
    to: "/account/settings/roles",
    label: "角色管理",
    desc: "角色说明 · 权限矩阵",
    needEnterprise: true,
  },
];

const titleByPath: Record<string, string> = Object.fromEntries(
  [...accountNav, ...settingsNav].map((n) => [n.to, n.label]),
);
titleByPath["/account/settings"] = "系统设置";

export function AccountLayout() {
  const {
    activeEnterprise,
    hasActiveEnterprise,
    pendingApplications,
    archiveChangeStatus,
    incomingJoinRequests,
    approvedContexts,
  } = useAuth();
  const { pathname } = useLocation();
  const subTitle = titleByPath[pathname] ?? "个人中心";
  const visibleMain = hasActiveEnterprise
    ? accountNav
    : accountNav.filter((item) => item.always);
  const visibleSettings = hasActiveEnterprise ? settingsNav : [];
  const joinPending = incomingJoinRequests.filter(
    (r) => r.enterpriseId === activeEnterprise?.id,
  ).length;

  const statusText = hasActiveEnterprise
    ? archiveChangeStatus === "reviewing"
      ? "档案变更审核中"
      : "入驻已认证"
    : pendingApplications.length > 0
      ? "入驻审核中"
      : "个人用户";

  const switchHref =
    hasActiveEnterprise && approvedContexts.length > 1 ? "/account/enterprise" : "/onboarding";
  const switchLabel =
    hasActiveEnterprise && approvedContexts.length > 1 ? "管理关联企业 →" : "关联 / 切换企业 →";

  return (
    <div className="account-page">
      <div className="account-topbar">
        <div className="container account-topbar-inner">
          <div className="account-crumb">
            {hasActiveEnterprise ? <Link to="/">首页</Link> : <Link to="/account">个人中心</Link>}
            {hasActiveEnterprise && (
              <>
                <span>/</span>
                <Link to="/account">个人中心</Link>
              </>
            )}
            {pathname.startsWith("/account/settings") && (
              <>
                <span>/</span>
                <span>系统设置</span>
              </>
            )}
            <span>/</span>
            <strong>{subTitle}</strong>
          </div>
          <div className="account-identity">
            <div>
              <b>{activeEnterprise?.name ?? "未关联企业"}</b>
              <span className={`account-status-pill ${hasActiveEnterprise ? "" : "is-warn"}`}>
                {statusText}
              </span>
            </div>
            <Link to={switchHref} className="account-identity-link">
              {switchLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="container account-body">
        <aside className="account-side">
          <div className="account-side-title">个人中心</div>
          <nav className="account-side-nav">
            {visibleMain.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "on" : undefined)}
              >
                <b>{item.label}</b>
                <em>{item.desc}</em>
              </NavLink>
            ))}
          </nav>

          {visibleSettings.length > 0 && (
            <>
              <div className="account-side-title account-side-title--sub">系统设置</div>
              <nav className="account-side-nav">
                {visibleSettings.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => (isActive ? "on" : undefined)}
                  >
                    <b>
                      {item.label}
                      {item.to.includes("members") && joinPending > 0 && (
                        <i className="account-nav-badge">{joinPending}</i>
                      )}
                    </b>
                    <em>{item.desc}</em>
                  </NavLink>
                ))}
              </nav>
            </>
          )}
        </aside>
        <div className="account-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
