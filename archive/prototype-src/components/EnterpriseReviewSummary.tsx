import { useState, type ReactNode } from "react";
import { ENTRY_AGREEMENTS, type EntryAgreement } from "../data/entryAgreements";
import {
  customerTypeLabel,
  customerTypes,
  ID_TYPES,
  type CreateDraft,
} from "../data/onboarding";
import { enterpriseNatureLabel, enterpriseScaleLabel } from "../data/industryChain";
import { getParkById } from "../data/parks";

type Props = {
  draft: CreateDraft;
  industryLabel: string;
  chainLabel: string;
  isOrgType?: boolean;
};

type PreviewState =
  | { kind: "agreement"; doc: EntryAgreement }
  | { kind: "upload"; label: string; fileName: string; preview: string };

export function EnterpriseReviewSummary({
  draft,
  industryLabel,
  chainLabel,
  isOrgType,
}: Props) {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const park = getParkById(draft.parkId);
  const ctype = customerTypes.find((t) => t.id === draft.customerType);
  const idTypeLabel = ID_TYPES.find((t) => t.id === draft.idType)?.label;
  const signed = draft.agree && draft.faceVerified && draft.signed;
  const certUntil = draft.longTerm ? "长期" : draft.certValidUntil || "—";
  const signer = draft.contactName || draft.displayName || "经办人";
  const subject = draft.subjectName || "入驻主体";
  const docs = ctype?.documents ?? [];

  return (
    <div className="er-summary">
      <ReviewSection title="入驻与身份">
        <Info label="入驻园区" value={park?.name ?? "—"} />
        <Info label="客户类型" value={customerTypeLabel(draft.customerType)} />
        {ctype?.usesIdType && <Info label="证件类型" value={idTypeLabel ?? "—"} />}
        <Info label="显示名称" value={draft.displayName} />
        <Info label="经办人" value={draft.contactName} />
        <Info label="手机号" value={draft.contactPhone} />
        <Info label="邮箱" value={draft.contactEmail} />
      </ReviewSection>

      <ReviewSection title="主体与证件">
        <Info label={ctype?.subjectLabel ?? "主体名称"} value={draft.subjectName} />
        <Info label={ctype?.certLabel ?? "证件号码"} value={draft.certNo} />
        <Info label="证件有效期" value={certUntil} />
        {isOrgType && draft.establishedAt && (
          <Info label="成立时间" value={draft.establishedAt} />
        )}
        {isOrgType && draft.registeredCapital && (
          <Info label="注册资本" value={draft.registeredCapital} />
        )}
        {isOrgType && draft.registeredAddress && (
          <Info label="注册地址" value={draft.registeredAddress} />
        )}
      </ReviewSection>

      <div className="er-block">
        <h3 className="er-block-title">资质文件</h3>
        <div className="er-file-list">
          {docs.length === 0 && (
            <div className="er-file-empty">暂无需上传材料</div>
          )}
          {docs.map((slot) => {
            const fileName = draft.uploads[slot.id];
            const previewUrl = draft.uploadPreviews[slot.id] ?? "";
            const missing = !fileName;
            const canPreview = !missing && !!previewUrl;
            const rowClass = `er-file-row ${missing ? "is-missing" : ""} ${
              canPreview ? "er-file-row--btn" : ""
            }`;
            const content = (
              <>
                <span className="er-file-icon" aria-hidden>
                  📄
                </span>
                <span className="er-file-main">
                  <strong>{slot.label}</strong>
                  <em>{fileName || (slot.required ? "必传材料缺失" : "选填未传")}</em>
                </span>
                <span
                  className={`er-pill ${
                    missing
                      ? slot.required
                        ? "er-pill--danger"
                        : "er-pill--muted"
                      : "er-pill--ok"
                  }`}
                >
                  {missing ? (slot.required ? "未上传" : "选填未传") : "已上传"}
                </span>
                {canPreview && <span className="er-preview-link">预览</span>}
              </>
            );
            if (canPreview) {
              return (
                <button
                  key={slot.id}
                  type="button"
                  className={rowClass}
                  onClick={() =>
                    setPreview({
                      kind: "upload",
                      label: slot.label,
                      fileName,
                      preview: previewUrl,
                    })
                  }
                >
                  {content}
                </button>
              );
            }
            return (
              <div key={slot.id} className={rowClass}>
                {content}
              </div>
            );
          })}
        </div>
      </div>

      <ReviewSection title="经营信息">
        <Info label="国标行业" value={industryLabel || "—"} />
        <Info label="企业性质" value={enterpriseNatureLabel(draft.enterpriseNature) || "—"} />
        <Info label="企业规模" value={enterpriseScaleLabel(draft.enterpriseScale) || "—"} />
        <Info label="所属产业" value={chainLabel || "—"} />
        {draft.chainSegments.length > 0 && (
          <Info label="产业链环节" value={draft.chainSegments.join("、")} />
        )}
        {draft.enterpriseTags.length > 0 && (
          <Info label="企业标签" value={draft.enterpriseTags.join("、")} />
        )}
        <div className="er-info er-info--wide">
          <span>主营业务</span>
          <b>{draft.businessDescription || "—"}</b>
        </div>
        <div className="er-info er-info--wide">
          <span>主体简介</span>
          <b>{draft.intro || "—"}</b>
        </div>
        <div className="er-info er-info--wide">
          <span>办公地址</span>
          <b>{draft.address || "—"}</b>
        </div>
        {(draft.upstreamCategories || draft.downstreamCategories) && (
          <div className="er-info er-info--wide">
            <span>品类清单</span>
            <b>
              {draft.upstreamCategories && `上游：${draft.upstreamCategories}`}
              {draft.upstreamCategories && draft.downstreamCategories && " · "}
              {draft.downstreamCategories && `下游：${draft.downstreamCategories}`}
            </b>
          </div>
        )}
      </ReviewSection>

      <div className="er-block">
        <div className="er-block-head">
          <h3 className="er-block-title">签署附件</h3>
          <span className="er-block-meta">
            一次性签署 · 人脸识别 {draft.faceVerified ? "已通过" : "未完成"} · 电子签章{" "}
            {draft.signed ? "已签署" : "未签署"}
          </span>
        </div>
        <div className="er-file-list">
          {ENTRY_AGREEMENTS.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className="er-file-row er-file-row--btn"
              onClick={() => setPreview({ kind: "agreement", doc })}
            >
              <span className="er-file-icon er-file-icon--amber" aria-hidden>
                📃
              </span>
              <span className="er-file-main">
                <strong>《{doc.title}》</strong>
                <em>{doc.summary}</em>
              </span>
              <span className={`er-pill ${signed ? "er-pill--ok" : "er-pill--warn"}`}>
                {signed ? "已签署" : "待签署"}
              </span>
              <span className="er-preview-link">预览</span>
            </button>
          ))}
        </div>
      </div>

      {preview && (
        <div className="er-modal-backdrop" onClick={() => setPreview(null)}>
          <div
            className="er-modal"
            role="dialog"
            aria-labelledby="er-doc-title"
            onClick={(e) => e.stopPropagation()}
          >
            {preview.kind === "agreement" ? (
              <>
                <header className="er-modal-head">
                  <div>
                    <h4 id="er-doc-title">《{preview.doc.title}》</h4>
                    <p>
                      {subject} · {signer}
                    </p>
                  </div>
                  <div className="er-modal-head-actions">
                    <span className={`er-pill ${signed ? "er-pill--ok" : "er-pill--warn"}`}>
                      {signed ? "已签署" : "待签署"}
                    </span>
                    <button type="button" className="er-modal-close" onClick={() => setPreview(null)}>
                      ×
                    </button>
                  </div>
                </header>
                <div className="er-modal-body">
                  <pre>{preview.doc.body}</pre>
                  {signed && (
                    <div className="er-seal" aria-hidden>
                      <span>{subject.slice(0, 6)}</span>
                      <em>电子签章</em>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <header className="er-modal-head">
                  <div>
                    <h4 id="er-doc-title">{preview.label}</h4>
                    <p>{preview.fileName}</p>
                  </div>
                  <div className="er-modal-head-actions">
                    <span className="er-pill er-pill--ok">已上传</span>
                    <button type="button" className="er-modal-close" onClick={() => setPreview(null)}>
                      ×
                    </button>
                  </div>
                </header>
                <div className="er-modal-body er-modal-body--media">
                  <UploadPreviewBody preview={preview.preview} fileName={preview.fileName} />
                </div>
              </>
            )}
            <footer className="er-modal-foot">
              <button type="button" className="btn btn-primary" onClick={() => setPreview(null)}>
                关闭预览
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadPreviewBody({ preview, fileName }: { preview: string; fileName: string }) {
  if (preview.startsWith("data:image")) {
    return <img className="er-modal-preview-img" src={preview} alt={fileName} />;
  }
  const fileMeta = preview.startsWith("file:") ? preview.slice(5).split(":") : null;
  const mime = fileMeta?.[0] ?? "";
  const name = fileMeta?.slice(1).join(":") || fileName;
  const isPdf = mime.includes("pdf") || /\.pdf$/i.test(name);
  return (
    <div className="er-modal-file-card">
      <div className="er-modal-file-icon" aria-hidden>
        {isPdf ? "📕" : "📎"}
      </div>
      <strong>{name}</strong>
      <p>{isPdf ? "PDF 文档（演示环境展示文件名，正式环境可在线打开）" : "附件已上传，演示环境暂不渲染二进制内容"}</p>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="er-block">
      <h3 className="er-block-title">{title}</h3>
      <div className="er-info-grid">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="er-info">
      <span>{label}</span>
      <b>{value || "—"}</b>
    </div>
  );
}
