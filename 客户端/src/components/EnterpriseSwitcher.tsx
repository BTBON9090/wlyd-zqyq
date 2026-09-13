import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { parkName as DEPLOYMENT_PARK_NAME } from "../data";
import { buildSupplierPortalUrl, isSupplierOnboarded } from "../utils/supplierPortal";
import { IconSwitchArrows } from "./Icons";

function resolveUserDisplayName(userName: string | undefined, phone: string | undefined) {
  const fromUser = userName?.trim();
  if (fromUser) return fromUser;
  if (phone) return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
  return "用户";
}

function maskPhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}

/** 登录后右上角个人中心：下拉切换供应商端 */
export function EnterpriseSwitcher() {
  const { user, hasActiveEnterprise, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: globalThis.MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  const displayName = resolveUserDisplayName(user?.name, user?.phone);
  const maskedPhone = maskPhone(user?.phone);
  const phone = user?.phone ?? "";
  const supplierOnboarded = phone ? isSupplierOnboarded(phone) : false;

  const toggleOpen = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setOpen((v) => !v);
  };

  const goSupplier = () => {
    if (!phone) return;
    setOpen(false);
    // 登录来源园区 = 当前客户端部署园区（与注册园区无关）
    window.location.href = buildSupplierPortalUrl(phone, {
      loginSourcePark: DEPLOYMENT_PARK_NAME,
    });
  };

  const requestLogout = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    setConfirmLogout(true);
  };

  const cancelLogout = () => setConfirmLogout(false);

  const confirmLogoutAction = () => {
    logout();
    setConfirmLogout(false);
  };

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-chip user-chip--personal" onClick={toggleOpen}>
        <span className="avatar avatar--gradient">{displayName.slice(0, 1)}</span>
        <span className="meta" title={displayName}>
          <b>{displayName}</b>
          {maskedPhone && <span className="meta-phone">{maskedPhone}</span>}
        </span>
      </button>

      {open && (
        <div className="user-dropdown user-dropdown--personal" onClick={(e) => e.stopPropagation()}>
          <div className="user-dropdown__profile">
            <span className="avatar avatar--gradient avatar--lg">{displayName.slice(0, 1)}</span>
            <div className="user-dropdown__profile-text">
              <strong>{displayName}</strong>
              {maskedPhone && <span>{maskedPhone}</span>}
            </div>
            {!hasActiveEnterprise && (
              <Link to="/onboarding" className="user-dropdown__verify" onClick={() => setOpen(false)}>
                去认证 ›
              </Link>
            )}
          </div>

          <button type="button" className="user-dropdown__switch-supplier" onClick={goSupplier}>
            <IconSwitchArrows />
            <span>切换为服务商</span>
            <em>{supplierOnboarded ? "已进入驻 · 工作台" : "未入驻 · 去申请"}</em>
          </button>

          <Link to="/account" className="user-dropdown__link" onClick={() => setOpen(false)}>
            个人中心
          </Link>

          <div className="user-dropdown__foot">
            <button type="button" className="user-dropdown__logout" onClick={requestLogout}>
              退出登录
            </button>
          </div>
        </div>
      )}

      {confirmLogout &&
        createPortal(
          <div className="account-modal" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
            <div className="account-modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 id="logout-confirm-title">确认退出登录？</h3>
              <p>退出后需重新登录，本地账号数据仍会保留，可用密码再次登录。</p>
              <div className="account-modal-actions">
                <button type="button" className="btn btn-ghost-dark" onClick={cancelLogout}>
                  取消
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmLogoutAction}>
                  确认退出
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
