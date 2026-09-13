import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  serviceCategories,
  serviceOrders,
  type ServiceCategoryId,
} from "../data/enterpriseServices";

/** 企服共用左侧：热门 / 需求 / 服务大厅+分类一体模块 */
export function EmployerSideShell({
  activeCategory = "all",
  footer,
}: {
  activeCategory?: ServiceCategoryId | "all";
  footer?: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const onHall = location.pathname.startsWith("/services/hall");

  const goCategory = (id: ServiceCategoryId | "all") => {
    if (id === "all") navigate("/services/hall");
    else navigate(`/services/hall?cat=${id}`);
  };

  return (
    <aside className="svc-sidebar">
      <nav className="svc-side-nav">
        <NavLink to="/services" end className={({ isActive }) => (isActive ? "on" : undefined)}>
          热门推荐
          <em>精选</em>
        </NavLink>
        <NavLink to="/demand" end className={({ isActive }) => (isActive ? "on" : undefined)}>
          需求大厅
          <em>找需求</em>
        </NavLink>

        <div className={`svc-hall-module${onHall ? " is-active" : ""}`}>
          <NavLink
            to="/services/hall"
            className={({ isActive }) =>
              `svc-hall-module-head${isActive ? " on" : ""}`
            }
          >
            服务大厅
            <em>找服务</em>
          </NavLink>
          <ul className="svc-cats">
            {serviceCategories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={onHall && activeCategory === c.id ? "on" : ""}
                  onClick={() => goCategory(c.id)}
                >
                  <span className="svc-cat-icon">{c.icon}</span>
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {footer}
    </aside>
  );
}

export function ServicesSidePanel({
  activeCategory = "all",
}: {
  activeCategory?: ServiceCategoryId | "all";
}) {
  return (
    <EmployerSideShell
      activeCategory={activeCategory}
      footer={
        <div className="svc-orders-panel">
          <strong>
            我的服务订单
            <Link to="/account/orders/services" className="svc-order-more">
              全部
            </Link>
          </strong>
          <ul>
            {serviceOrders.map((o) => (
              <li key={o.id}>
                <b>{o.name}</b>
                <div className="svc-order-meta">
                  <span>{o.node}</span>
                  <em className={`svc-status svc-status--${o.status === "已完成" ? "ok" : "pending"}`}>
                    {o.status}
                  </em>
                </div>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}

/** @deprecated 保留兼容；请用 EmployerSideShell */
export function EmployerSideNav({ variant: _variant }: { variant: "hot" | "hall" | "demand" }) {
  return <EmployerSideShell />;
}
