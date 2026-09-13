import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getRoleDefs,
  permissionGroups,
  resetRolePermissions,
  roleHasPermission,
  setRolePermissions,
  type PermissionKey,
  type RoleDef,
} from "../../data/rolePermissions";
import { ROLE_LABELS, type EnterpriseRole } from "../../types/auth";

export function RoleManagePage() {
  const { hasActiveEnterprise, activeEnterprise, activeMembership } = useAuth();
  const [roles, setRoles] = useState<RoleDef[]>(() => getRoleDefs());
  const [toast, setToast] = useState("");
  const [selectedRole, setSelectedRole] = useState<EnterpriseRole>("purchaser");

  const canEdit = !!activeMembership && roleHasPermission(activeMembership.role, "role_manage");
  const groups = useMemo(() => permissionGroups(), []);
  const current = roles.find((r) => r.id === selectedRole) ?? roles[0];

  if (!hasActiveEnterprise || !activeEnterprise) {
    return <Navigate to="/account/enterprise" replace />;
  }

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const toggle = (key: PermissionKey) => {
    if (!canEdit || !current || current.id === "admin") return;
    const has = current.permissions.includes(key);
    const nextPerms = has
      ? current.permissions.filter((p) => p !== key)
      : [...current.permissions, key];
    const next = setRolePermissions(current.id, nextPerms);
    setRoles(next);
    showToast(`已更新「${ROLE_LABELS[current.id]}」权限`);
  };

  const onReset = () => {
    if (!canEdit) return;
    setRoles(resetRolePermissions());
    showToast("已恢复默认角色权限");
  };

  return (
    <div className="account-panel">
      <div className="account-panel-head account-panel-head--row">
        <div>
          <h1>角色管理</h1>
          <p>
            {activeEnterprise.name} · 配置企业角色能力与业务权限
          </p>
        </div>
        <div className="account-archive-actions">
          <Link className="btn btn-ghost-dark btn-sm" to="/account/settings/members">
            去成员管理
          </Link>
          {canEdit && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onReset}>
              恢复默认
            </button>
          )}
        </div>
      </div>

      <div className="role-card-grid">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            className={`role-card ${selectedRole === role.id ? "on" : ""}`}
            onClick={() => setSelectedRole(role.id)}
          >
            <b>{role.label}</b>
            <span>{role.summary}</span>
            <em>{role.permissions.length} 项权限</em>
          </button>
        ))}
      </div>

      <section className="settings-section">
        <div className="settings-section-head">
          <h3>
            权限矩阵 · {current?.label}
            {current?.id === "admin" && <em className="settings-tag">系统角色 · 全权限</em>}
          </h3>
          <p>
            {canEdit
              ? "勾选即可调整该角色可访问的功能模块（演示本地保存）。"
              : "当前账号无角色配置权限，仅可查看。"}
          </p>
        </div>

        <div className="perm-matrix">
          {groups.map((group) => (
            <div key={group.name} className="perm-group">
              <div className="perm-group-title">{group.name}</div>
              <div className="perm-list">
                {group.items.map((perm) => {
                  const checked = !!current?.permissions.includes(perm.key);
                  const locked = !canEdit || current?.id === "admin";
                  return (
                    <label
                      key={perm.key}
                      className={`perm-item ${checked ? "on" : ""} ${locked ? "is-locked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked}
                        onChange={() => toggle(perm.key)}
                      />
                      <span>
                        <b>{perm.label}</b>
                        <em>{perm.desc}</em>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {toast && <div className="account-toast">{toast}</div>}
    </div>
  );
}
