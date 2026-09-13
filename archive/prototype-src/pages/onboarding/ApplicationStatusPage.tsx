import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { roleHasPermission } from "../../data/rolePermissions";
import { ROLE_LABELS, applicationResubmitPath, type EnterpriseApplication } from "../../types/auth";
import { customerTypeLabel } from "../../data/onboarding";

const TYPE_LABELS = {
  create: "创建企业",
  invite: "邀请码入驻",
  join: "加入企业",
  archive: "档案变更",
};

const OPS_PIPELINE = [
  { key: "submitted", label: "企业提交", who: "客户端" },
  { key: "ops_review", label: "资质审核", who: "园区运营端" },
  { key: "enable", label: "企业启用", who: "系统开通" },
] as const;

const JOIN_PIPELINE = [
  { key: "submitted", label: "提交申请", who: "客户端" },
  { key: "ops_review", label: "成员审批", who: "企业管理员" },
  { key: "enable", label: "加入企业", who: "系统开通" },
] as const;

export function ApplicationStatusPage() {
  const {
    applications,
    simulateApproveApplication,
    reviewJoinApplication,
    memberships,
    hasActiveEnterprise,
  } = useAuth();

  return (
    <div className="onboard-page">
      <div className="container onboard-form-wrap onboard-form-wrap--wide">
        <div className="form-head er-status-head">
          <div>
            <Link to="/onboarding" className="form-back">← 返回入驻引导</Link>
            <h1>入驻进度查询</h1>
            <p>跟踪企业创建、邀请码入驻、加入企业与档案变更的审核状态。</p>
          </div>
          <Link to="/onboarding" className="btn btn-ghost-dark btn-sm">返回入驻首页</Link>
        </div>

        {applications.length === 0 ? (
          <div className="auth-notice">
            暂无申请记录。
            <Link to="/onboarding">去办理入驻 →</Link>
          </div>
        ) : (
          <div className="er-status-list">
            {applications.map((app) => (
              <ApplicationProgressCard
                key={app.id}
                app={app}
                canAdminReview={
                  app.type === "join" &&
                  app.status === "pending" &&
                  memberships.some(
                    (m) =>
                      m.enterpriseId === app.enterpriseId &&
                      m.status === "active" &&
                      roleHasPermission(m.role, "join_review"),
                  )
                }
                onSimulateApprove={() => simulateApproveApplication(app.id)}
                onAdminReview={(decision) => reviewJoinApplication(app.id, decision)}
              />
            ))}
          </div>
        )}

        {hasActiveEnterprise && (
          <div className="form-actions">
            <Link to="/" className="btn btn-primary">进入平台首页</Link>
            <Link to="/onboarding" className="btn btn-ghost-dark">继续关联其他企业</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationProgressCard({
  app,
  canAdminReview,
  onSimulateApprove,
  onAdminReview,
}: {
  app: EnterpriseApplication;
  canAdminReview: boolean;
  onSimulateApprove: () => void;
  onAdminReview: (decision: "approve" | "reject") => void;
}) {
  const resubmitPath = applicationResubmitPath(app);
  const pipeline = app.type === "join" ? JOIN_PIPELINE : OPS_PIPELINE;
  const nodeState = (key: (typeof OPS_PIPELINE)[number]["key"]) => {
    if (app.status === "approved") return "done";
    if (app.status === "rejected") {
      if (key === "ops_review") return "warn";
      if (key === "submitted") return "done";
      return "todo";
    }
    if (key === "submitted") return "done";
    if (key === "ops_review") return "current";
    return "todo";
  };

  return (
    <article className={`er-status-card status-${app.status}`}>
      <div className="er-status-card__top">
        <div>
          <div className="er-status-card__tags">
            <span className="chip">{TYPE_LABELS[app.type]}</span>
            <span className={`status-badge status-${app.status}`}>
              {app.status === "pending" ? "审核中" : app.status === "approved" ? "已通过" : "已驳回"}
            </span>
          </div>
          <h3>{app.enterpriseName}</h3>
          <p className="er-status-card__sub">
            {[
              app.parkName && `园区 ${app.parkName}`,
              app.customerType && customerTypeLabel(app.customerType),
              app.role && ROLE_LABELS[app.role],
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      {app.status === "rejected" && (
        <div className="er-banner er-banner--danger">
          <strong>{app.type === "join" ? "加入申请已拒绝" : app.type === "archive" ? "档案变更已驳回" : "入驻申请已驳回"}</strong>
          <p>{app.reviewNote || "请根据审核意见修改或补充资料后重新提交。"}</p>
          <p className="er-banner-tip">
            {app.type === "join"
              ? "可修改姓名、角色后重新向该企业管理员提交。"
              : app.type === "archive"
                ? "可返回企业档案继续修改后重新提交，审核期间不影响平台使用。"
                : "修改后将从第一步重新确认各步信息。主体信息变更需重新签署协议。"}
          </p>
          {resubmitPath && (
            <Link to={resubmitPath} className="btn btn-primary btn-sm">
              修改并重提
            </Link>
          )}
        </div>
      )}

      {app.status === "approved" && (
        <div className="er-banner er-banner--ok">
          <strong>
            {app.type === "join"
              ? "已加入企业"
              : app.type === "archive"
                ? "档案变更已通过"
                : "入驻已通过，企业账号已启用"}
          </strong>
          <p>
            {app.type === "join"
              ? "企业管理员已通过，可进入平台使用。"
              : app.type === "archive"
                ? "园区运营已通过档案变更，企业档案已更新为最新内容。"
                : "入驻已通过。可进入平台首页使用集采、金融、企服等功能。"}
          </p>
          {app.type === "archive" && (
            <Link to="/account/enterprise" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
              查看企业档案
            </Link>
          )}
        </div>
      )}

      {app.status === "pending" && (
        <div className="er-banner er-banner--info">
          <strong>
            {app.type === "join"
              ? "申请已提交，等待企业管理员审批"
              : app.type === "archive"
                ? "档案变更已提交，等待园区运营审核"
                : "资料已提交，等待审核"}
          </strong>
          <p>
            {app.type === "join"
              ? "该企业管理员通过后即可加入；驳回后可修改资料重新申请。"
              : app.type === "archive"
                ? "审核期间可继续使用平台功能；通过后档案将更新。"
                : "园区运营正在核验资质与签署信息，审核通过前暂无法使用经营功能。"}
          </p>
        </div>
      )}

      <div className="er-pipeline">
        <div className="er-pipeline-title">
          {app.type === "join" ? "企业管理员审批链路" : "多角色审核链路"}
        </div>
        <div className="er-pipeline-nodes">
          {pipeline.map((n, i) => {
            const st = nodeState(n.key);
            return (
              <div key={n.key} className="er-pipeline-item">
                <div className={`er-pipeline-node er-pipeline-node--${st}`}>
                  <span>{n.who}</span>
                  <b>{n.label}</b>
                  <em>
                    {st === "done" && "已完成"}
                    {st === "current" && "进行中"}
                    {st === "warn" && "已驳回"}
                    {st === "todo" && "等待"}
                  </em>
                </div>
                {i < pipeline.length - 1 && <div className="er-pipeline-line" />}
              </div>
            );
          })}
        </div>
        <p className="er-pipeline-note">
          {app.type === "join"
            ? "加入申请由该企业管理员审批，通过后按申请角色加入。"
            : app.type === "archive"
              ? "档案变更由园区运营审核，通过后更新企业档案，不影响现有平台权限。"
              : "提交后由园区运营审核，通过即可启用企业账号。"}
        </p>
      </div>

      <div className="er-timeline">
        <div className="er-pipeline-title">审核意见时间轴</div>
        <ul>
          <li>
            <span className="er-timeline-dot er-timeline-dot--supplier" />
            <div>
                <b>
                  {app.type === "join"
                    ? "企业经办人 · 提交加入申请"
                    : app.type === "archive"
                      ? "企业经办人 · 提交档案变更"
                      : "企业经办人 · 提交入驻申请"}
                </b>
              <p>提交时间：{new Date(app.createdAt).toLocaleString("zh-CN")}</p>
            </div>
          </li>
          {app.status === "pending" && (
            <li>
              <span className="er-timeline-dot er-timeline-dot--ops" />
              <div>
                <b>{app.type === "join" ? "企业管理员 · 审批中" : "园区运营 · 资质审核中"}</b>
                <p>
                  {app.type === "join"
                    ? "正在等待该企业管理员通过或拒绝本加入申请。"
                    : "正在核验主体资质、材料完整性与协议签署状态。"}
                </p>
              </div>
            </li>
          )}
          {app.status === "approved" && (
            <li>
              <span className="er-timeline-dot er-timeline-dot--ok" />
              <div>
                <b>系统 · 审核通过并启用</b>
                <p>{app.reviewNote || "运营审核通过，企业账号已启用。"}</p>
              </div>
            </li>
          )}
          {app.status === "rejected" && (
            <li>
              <span className="er-timeline-dot er-timeline-dot--danger" />
              <div>
                <b>
                  {app.type === "join"
                    ? "企业管理员 · 审核驳回"
                    : app.type === "archive"
                      ? "园区运营 · 档案变更驳回"
                      : "园区运营 · 审核驳回"}
                </b>
                <p>{app.reviewNote || "请修改资料后重新提交。"}</p>
              </div>
            </li>
          )}
          {(app.faceVerified || app.eSigned) && (
            <li>
              <span className="er-timeline-dot er-timeline-dot--sign" />
              <div>
                <b>协议签署记录</b>
                <p>
                  人脸{app.faceVerified ? "已通过" : "未完成"}
                  {app.eSigned ? " · 已电子签" : ""}
                </p>
              </div>
            </li>
          )}
        </ul>
      </div>

      <div className="er-status-meta">
        {app.uscc && <span>信用代码：{app.uscc}</span>}
        {app.address && <span>经营地址：{app.address}</span>}
        {app.contactName && (
          <span>
            经办人：{app.contactName}
            {app.contactPhone ? ` · ${app.contactPhone}` : ""}
            {app.contactEmail ? ` · ${app.contactEmail}` : ""}
          </span>
        )}
        {app.inviteCode && <span>邀请码：{app.inviteCode}</span>}
      </div>

      {app.duplicateHint && app.status === "pending" && (
        <div className="auth-notice auth-notice--warn">
          该企业可能已存在，建议
          {app.enterpriseId && (
            <Link to={`/onboarding/join?enterpriseId=${app.enterpriseId}`}> 申请加入 </Link>
          )}
          或联系管理员添加权限。
        </div>
      )}

      <div className="application-card__actions">
        {app.status === "pending" && app.type !== "join" && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onSimulateApprove}>
            演示：模拟运营审核通过
          </button>
        )}
        {app.status === "pending" && app.type === "join" && canAdminReview && (
          <>
            <Link to="/account/settings/members" className="btn btn-ghost-dark btn-sm">
              前往成员管理审核
            </Link>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onAdminReview("approve")}>
              管理员通过
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onAdminReview("reject")}>
              管理员拒绝
            </button>
          </>
        )}
        {resubmitPath && app.status === "rejected" && (
          <Link to={resubmitPath} className="btn btn-primary btn-sm">
            修改并重新提交
          </Link>
        )}
      </div>
    </article>
  );
}
