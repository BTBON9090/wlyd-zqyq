import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EnterpriseReviewSummary } from "../../components/EnterpriseReviewSummary";
import { useAuth } from "../../context/AuthContext";
import { formatIndustryChain } from "../../data/industryChain";
import {
  createDraftFromApplication,
  customerTypes,
  demoEnterpriseUploads,
  emptyCreateDraft,
  formatIndustrySelection,
} from "../../data/onboarding";
import { roleHasPermission } from "../../data/rolePermissions";
import { ROLE_LABELS } from "../../types/auth";

type ConfirmKind = "leave" | "deregister" | null;

export function EnterpriseArchivePage() {
  const {
    user,
    hasActiveEnterprise,
    activeEnterprise,
    activeMembership,
    pendingApplications,
    applications,
    archiveChangeStatus,
    leaveEnterprise,
    deregisterEnterprise,
  } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const approvedApp = useMemo(
    () =>
      applications.find(
        (a) =>
          a.status === "approved" &&
          (a.type === "create" || a.type === "invite") &&
          (a.enterpriseId === activeEnterprise?.id || a.enterpriseName === activeEnterprise?.name),
      ) ??
      applications.find((a) => a.status === "approved" && (a.type === "create" || a.type === "invite")),
    [applications, activeEnterprise],
  );

  const pendingArchiveApp = useMemo(
    () =>
      applications.find(
        (a) =>
          a.type === "archive" &&
          a.status === "pending" &&
          (a.enterpriseId === activeEnterprise?.id || !activeEnterprise),
      ),
    [applications, activeEnterprise],
  );

  const rejectedArchiveApp = useMemo(
    () =>
      applications.find(
        (a) =>
          a.type === "archive" &&
          a.status === "rejected" &&
          a.enterpriseId === activeEnterprise?.id,
      ),
    [applications, activeEnterprise],
  );

  const archiveDraft = useMemo(() => {
    const isDemoEnterprise =
      activeEnterprise?.id === "ent-001" ||
      activeEnterprise?.name === "临港精密制造有限公司" ||
      approvedApp?.enterpriseId === "ent-001" ||
      approvedApp?.enterpriseName === "临港精密制造有限公司";

    if (approvedApp) {
      const draft = createDraftFromApplication(approvedApp, user?.phone);
      if (!Object.keys(draft.uploads).length && isDemoEnterprise) {
        const demo = demoEnterpriseUploads();
        return { ...draft, uploads: demo.uploads, uploadPreviews: demo.uploadPreviews };
      }
      return draft;
    }
    if (!activeEnterprise) return emptyCreateDraft();
    const demo = isDemoEnterprise ? demoEnterpriseUploads() : { uploads: {}, uploadPreviews: {} };
    return {
      ...emptyCreateDraft(),
      parkId: activeEnterprise.parkId,
      customerType: "enterprise" as const,
      subjectName: activeEnterprise.name,
      certNo: activeEnterprise.uscc,
      contactName: activeEnterprise.contactName,
      contactPhone: activeEnterprise.contactPhone || user?.phone || "",
      displayName: activeMembership?.displayName || "",
      businessDescription: activeEnterprise.industry || "",
      agree: true,
      faceVerified: true,
      signed: true,
      ...demo,
    };
  }, [approvedApp, activeEnterprise, activeMembership, user?.phone]);

  const industryLabel = useMemo(() => {
    if (approvedApp?.industry) {
      const fromDraft = formatIndustrySelection({
        section: archiveDraft.industrySection,
        division: archiveDraft.industryDivision,
        group: archiveDraft.industryGroup,
        class: archiveDraft.industryClass,
      });
      return fromDraft || approvedApp.industry;
    }
    return (
      formatIndustrySelection({
        section: archiveDraft.industrySection,
        division: archiveDraft.industryDivision,
        group: archiveDraft.industryGroup,
        class: archiveDraft.industryClass,
      }) ||
      activeEnterprise?.industry ||
      ""
    );
  }, [archiveDraft, approvedApp, activeEnterprise]);

  const chainLabel = formatIndustryChain({
    l1: archiveDraft.industryChainL1,
    l2: archiveDraft.industryChainL2,
    l3: archiveDraft.industryChainL3,
  });

  const isOrgType = !customerTypes.find((t) => t.id === archiveDraft.customerType)?.usesIdType;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  // 审核中（入驻）
  if (!hasActiveEnterprise && pendingApplications.length > 0) {
    return (
      <div className="account-panel">
        <div className="account-panel-head">
          <h1>企业档案</h1>
          <p>入驻申请审核中，可查看进度</p>
        </div>
        <div className="account-empty account-empty--pending">
          <strong>有 {pendingApplications.length} 条入驻申请正在审核</strong>
          <p>审核通过后将在此展示完整企业档案。</p>
          <Link className="btn btn-primary" to="/onboarding/status">
            查看审核进度
          </Link>
        </div>
      </div>
    );
  }

  // 无企业
  if (!hasActiveEnterprise) {
    return (
      <div className="account-panel">
        <div className="account-panel-head">
          <h1>企业档案</h1>
          <p>完成企业入驻后可在此管理档案</p>
        </div>
        <div className="account-empty">
          <strong>尚未关联企业</strong>
          <p>创建企业、邀请码入驻或申请加入已有企业。</p>
          <div className="account-empty-actions">
            <Link className="btn btn-primary" to="/onboarding">
              去入驻
            </Link>
            <Link className="btn btn-ghost-dark" to="/onboarding/status">
              申请进度
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onLeave = () => {
    const res = leaveEnterprise();
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirm(null);
    showToast("已退出企业");
    navigate("/account/profile");
  };

  const onDeregister = () => {
    const res = deregisterEnterprise();
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirm(null);
    showToast("企业已注销");
    navigate("/account/profile");
  };

  const reviewing = archiveChangeStatus === "reviewing" || !!pendingArchiveApp;
  const canEditArchive =
    !!activeMembership && roleHasPermission(activeMembership.role, "archive_edit");
  const editHref = rejectedArchiveApp
    ? `/onboarding/create?mode=archive&applicationId=${rejectedArchiveApp.id}`
    : "/onboarding/create?mode=archive";

  return (
    <div className="account-panel">
      <div className="account-panel-head account-panel-head--row">
        <div>
          <h1>企业档案</h1>
          <p>与企业入驻提交信息一致 · 附件可点击预览</p>
        </div>
        <div className="account-archive-actions">
          {reviewing ? (
            <Link className="btn btn-primary btn-sm" to="/onboarding/status">
              查看变更进度
            </Link>
          ) : canEditArchive ? (
            <Link className="btn btn-primary btn-sm" to={editHref}>
              编辑
            </Link>
          ) : null}
          <button type="button" className="btn btn-ghost-dark btn-sm" onClick={() => setConfirm("leave")}>
            退出企业
          </button>
          {activeMembership?.role === "admin" && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm("deregister")}>
              企业注销
            </button>
          )}
        </div>
      </div>

      {reviewing && (
        <div className="account-banner">
          <div>
            <strong>档案变更已提交审核</strong>
            <p>审核期间可正常使用平台功能。请在入驻进度中跟踪并完成审批。</p>
          </div>
          <Link className="btn btn-outline btn-sm" to="/onboarding/status">
            查看审核进度
          </Link>
        </div>
      )}

      {!reviewing && rejectedArchiveApp && canEditArchive && (
        <div className="account-banner account-banner--warn">
          <div>
            <strong>上次档案变更未通过</strong>
            <p>{rejectedArchiveApp.reviewNote || "请修改后重新提交审核。"}</p>
          </div>
          <Link className="btn btn-outline btn-sm" to={editHref}>
            继续修改
          </Link>
        </div>
      )}

      <div className="account-archive-meta">
        <span>
          当前企业 <b>{activeEnterprise?.name}</b>
        </span>
        <span>
          我的角色 <b>{activeMembership ? ROLE_LABELS[activeMembership.role] : "—"}</b>
        </span>
        <span>
          显示名称 <b>{activeMembership?.displayName || "—"}</b>
        </span>
        {activeMembership?.role === "admin" && (
          <Link className="account-archive-meta-link" to="/account/settings/members">
            成员与加入审核 →
          </Link>
        )}
      </div>

      <EnterpriseReviewSummary
        draft={archiveDraft}
        industryLabel={industryLabel}
        chainLabel={chainLabel}
        isOrgType={isOrgType}
      />

      {confirm && (
        <div className="account-modal" role="dialog">
          <div className="account-modal-card">
            <h3>{confirm === "leave" ? "确认退出企业？" : "确认注销企业？"}</h3>
            <p>
              {confirm === "leave"
                ? `退出后将解除与「${activeEnterprise?.name}」的关联，不影响企业本身继续经营。`
                : `注销「${activeEnterprise?.name}」将解除全部成员关联（演示环境本地删除）。仅管理员可操作。`}
            </p>
            {error && <p className="account-form-error">{error}</p>}
            <div className="account-modal-actions">
              <button
                type="button"
                className="btn btn-ghost-dark"
                onClick={() => {
                  setConfirm(null);
                  setError("");
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirm === "leave" ? onLeave : onDeregister}
              >
                {confirm === "leave" ? "确认退出" : "确认注销"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="account-toast">{toast}</div>}
    </div>
  );
}
