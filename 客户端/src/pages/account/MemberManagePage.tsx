import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ensureSeedMembers,
  inviteMember,
  removeMember,
  updateMember,
  upsertMember,
  type EnterpriseMember,
} from "../../data/enterpriseMembers";
import { roleHasPermission } from "../../data/rolePermissions";
import { ROLE_LABELS, type EnterpriseRole } from "../../types/auth";

const ROLES = Object.keys(ROLE_LABELS) as EnterpriseRole[];

type Tab = "pending" | "members" | "invite";

export function MemberManagePage() {
  const {
    hasActiveEnterprise,
    activeEnterprise,
    activeMembership,
    selectedPark,
    incomingJoinRequests,
    reviewJoinApplication,
    syncMembershipFromRoster,
  } = useAuth();

  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<EnterpriseMember[]>([]);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<EnterpriseRole | "all">("all");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<EnterpriseRole>("viewer");

  const isAdmin = activeMembership?.role === "admin";
  const canManage = !!activeMembership && roleHasPermission(activeMembership.role, "member_manage");
  const canReview = !!activeMembership && roleHasPermission(activeMembership.role, "join_review");

  const joinInbox = useMemo(
    () => incomingJoinRequests.filter((r) => r.enterpriseId === activeEnterprise?.id),
    [incomingJoinRequests, activeEnterprise],
  );

  const refresh = () => {
    if (!activeEnterprise || !activeMembership) return;
    const list = ensureSeedMembers({
      enterpriseId: activeEnterprise.id,
      parkId: selectedPark?.id || activeEnterprise.parkId,
      parkName: selectedPark?.name || activeEnterprise.parkName,
      self: {
        displayName: activeMembership.displayName,
        displayPhone: activeMembership.displayPhone,
        role: activeMembership.role,
      },
    });
    setMembers(list);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEnterprise?.id, activeMembership?.id, selectedPark?.id]);

  useEffect(() => {
    if (joinInbox.length > 0 && canReview) setTab("pending");
  }, [joinInbox.length, canReview]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  if (!hasActiveEnterprise || !activeEnterprise) {
    return <Navigate to="/account/enterprise" replace />;
  }

  const filtered = members.filter((m) => {
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (!keyword.trim()) return true;
    const q = keyword.trim();
    return m.displayName.includes(q) || m.displayPhone.includes(q);
  });

  const onApprove = (id: string) => {
    const req = joinInbox.find((r) => r.id === id);
    const res = reviewJoinApplication(id, "approve");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (req && activeEnterprise) {
      upsertMember({
        id: `mem-join-${req.id}`,
        enterpriseId: activeEnterprise.id,
        parkId: req.parkId || selectedPark?.id || activeEnterprise.parkId,
        parkName: req.parkName || selectedPark?.name || activeEnterprise.parkName,
        displayName: req.displayName,
        displayPhone: req.displayPhone,
        role: req.role ?? "viewer",
        status: "active",
        joinedAt: new Date().toISOString(),
        source: "join",
      });
    }
    setError("");
    showToast("已通过加入申请");
    refresh();
  };

  const onReject = (id: string) => {
    const res = reviewJoinApplication(id, "reject", "暂不符合加入条件");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError("");
    showToast("已拒绝加入申请");
  };

  const onChangeRole = (member: EnterpriseMember, role: EnterpriseRole) => {
    if (!canManage) return;
    if (member.isSelf && member.role === "admin" && role !== "admin") {
      setError("不能取消自己的管理员角色，请先指定其他管理员");
      return;
    }
    updateMember(member.id, { role });
    syncMembershipFromRoster({
      enterpriseId: activeEnterprise.id,
      displayPhone: member.displayPhone,
      role,
      parkId: member.parkId,
    });
    setError("");
    showToast(`已将「${member.displayName}」调整为${ROLE_LABELS[role]}`);
    refresh();
  };

  const onRemove = (member: EnterpriseMember) => {
    if (!canManage) return;
    if (member.isSelf) {
      setError("不能移除自己，请使用「退出企业」");
      return;
    }
    if (member.role === "admin") {
      const admins = members.filter((m) => m.role === "admin" && m.status === "active");
      if (admins.length <= 1) {
        setError("至少保留一名企业管理员");
        return;
      }
    }
    removeMember(member.id);
    syncMembershipFromRoster({
      enterpriseId: activeEnterprise.id,
      displayPhone: member.displayPhone,
      remove: true,
      parkId: member.parkId,
    });
    setError("");
    showToast(`已移除成员「${member.displayName}」`);
    refresh();
  };

  const onInvite = () => {
    if (!canManage) return;
    const res = inviteMember({
      enterpriseId: activeEnterprise.id,
      parkId: selectedPark?.id || activeEnterprise.parkId,
      parkName: selectedPark?.name || activeEnterprise.parkName,
      displayName: inviteName,
      displayPhone: invitePhone,
      role: inviteRole,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setInviteName("");
    setInvitePhone("");
    setInviteRole("viewer");
    setError("");
    showToast("邀请已发送（演示：成员进入待激活）");
    setTab("members");
    refresh();
  };

  return (
    <div className="account-panel">
      <div className="account-panel-head account-panel-head--row">
        <div>
          <h1>成员管理</h1>
          <p>
            {activeEnterprise.name} · 管理成员、邀请与加入审核
          </p>
        </div>
        <Link className="btn btn-ghost-dark btn-sm" to="/account/settings/roles">
          去角色管理
        </Link>
      </div>

      <div className="settings-tabs">
        <button
          type="button"
          className={tab === "pending" ? "on" : undefined}
          onClick={() => setTab("pending")}
        >
          加入审核
          {joinInbox.length > 0 && <em>{joinInbox.length}</em>}
        </button>
        <button
          type="button"
          className={tab === "members" ? "on" : undefined}
          onClick={() => setTab("members")}
        >
          成员列表
        </button>
        <button
          type="button"
          className={tab === "invite" ? "on" : undefined}
          onClick={() => setTab("invite")}
          disabled={!canManage}
        >
          邀请成员
        </button>
      </div>

      {error && <p className="account-form-error">{error}</p>}

      {tab === "pending" && (
        <section className="settings-section">
          <div className="settings-section-head">
            <h3>待审批的加入申请</h3>
            <p>申请人通过「加入企业」提交后，由具备审核权限的角色处理。</p>
          </div>
          {!canReview ? (
            <div className="account-empty">
              <strong>无审核权限</strong>
              <p>当前角色无法审批加入申请，请联系企业管理员。</p>
            </div>
          ) : joinInbox.length === 0 ? (
            <div className="account-empty">
              <strong>暂无待审申请</strong>
              <p>有人申请加入本企业后，将在此显示。</p>
            </div>
          ) : (
            <div className="account-join-list">
              {joinInbox.map((req) => (
                <article key={req.id} className="account-join-item">
                  <div>
                    <b>{req.displayName}</b>
                    <span>
                      {req.displayPhone} · 申请角色 {req.role ? ROLE_LABELS[req.role] : "—"}
                      {req.parkName ? ` · ${req.parkName}` : ""}
                    </span>
                    {req.materialsNote && <span className="settings-muted">{req.materialsNote}</span>}
                  </div>
                  <div className="account-join-item__actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onApprove(req.id)}>
                      通过
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => onReject(req.id)}>
                      拒绝
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "members" && (
        <section className="settings-section">
          <div className="settings-toolbar">
            <input
              className="settings-search"
              placeholder="搜索姓名 / 手机号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as EnterpriseRole | "all")}
            >
              <option value="all">全部角色</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <span className="settings-count">共 {filtered.length} 人</span>
          </div>

          <div className="settings-table-wrap">
            <table className="settings-table">
              <thead>
                <tr>
                  <th>成员</th>
                  <th>角色</th>
                  <th>入驻园区</th>
                  <th>状态</th>
                  <th>加入时间</th>
                  {canManage && <th>操作</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <b>{m.displayName}</b>
                      {m.isSelf && <em className="settings-tag">我</em>}
                      <span className="settings-sub">{m.displayPhone}</span>
                    </td>
                    <td>
                      {canManage && !m.isSelf ? (
                        <select
                          value={m.role}
                          onChange={(e) => onChangeRole(m, e.target.value as EnterpriseRole)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        ROLE_LABELS[m.role]
                      )}
                    </td>
                    <td>{m.parkName || "—"}</td>
                    <td>
                      <span className={`settings-status settings-status--${m.status}`}>
                        {m.status === "active" ? "在职" : m.status === "pending" ? "待激活" : "已停用"}
                      </span>
                    </td>
                    <td>{m.joinedAt.slice(0, 10)}</td>
                    {canManage && (
                      <td>
                        {!m.isSelf && (
                          <button type="button" className="btn btn-ghost-dark btn-sm" onClick={() => onRemove(m)}>
                            移除
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isAdmin && (
            <p className="settings-hint">提示：调整角色与移除成员需「管理成员」权限，通常由企业管理员执行。</p>
          )}
        </section>
      )}

      {tab === "invite" && (
        <section className="settings-section">
          <div className="settings-section-head">
            <h3>邀请成员加入</h3>
            <p>填写手机号与角色后发送邀请；演示环境将成员加入「待激活」列表。</p>
          </div>
          <div className="settings-form">
            <label>
              <span>姓名</span>
              <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="成员真实姓名" />
            </label>
            <label>
              <span>手机号</span>
              <input value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="11 位手机号" />
            </label>
            <label>
              <span>角色</span>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as EnterpriseRole)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-primary" onClick={onInvite}>
              发送邀请
            </button>
          </div>
        </section>
      )}

      {toast && <div className="account-toast">{toast}</div>}
    </div>
  );
}
