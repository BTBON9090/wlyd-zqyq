import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AddressPicker } from "../../components/AddressPicker";
import { EntryAgreementSign } from "../../components/EntryAgreementSign";
import { EnterpriseReviewSummary } from "../../components/EnterpriseReviewSummary";
import { IndustryChainPicker } from "../../components/IndustryChainPicker";
import { IndustryPicker } from "../../components/IndustryPicker";
import { MultiSelectChips } from "../../components/MultiSelectChips";
import { ParkPicker } from "../../components/ParkPicker";
import { useAuth } from "../../context/AuthContext";
import { findEnterpriseByUscc, validateInviteCode } from "../../data/enterprises";
import {
  CHAIN_SEGMENTS,
  ENTERPRISE_NATURES,
  ENTERPRISE_SCALES,
  ENTERPRISE_TAGS,
  formatIndustryChain,
} from "../../data/industryChain";
import {
  createDraftFromApplication,
  customerTypeLabel,
  customerTypes,
  emptyCreateDraft,
  formatIndustrySelection,
  geocodeAddress,
  ID_TYPES,
  mockOcr,
  type CreateDraft,
  type CustomerTypeId,
  demoEnterpriseUploads,
} from "../../data/onboarding";
import { getParkById } from "../../data/parks";
import { roleHasPermission } from "../../data/rolePermissions";

const STEPS = ["基本信息", "经营信息", "协议签署", "提交审核"];

export function CreateEnterprisePage() {
  const {
    submitCreateEnterprise,
    submitInviteEnterprise,
    resubmitApplication,
    submitArchiveChange,
    applications,
    customEnterprises,
    selectPark,
    user,
    hasActiveEnterprise,
    activeEnterprise,
    activeMembership,
    archiveChangeStatus,
  } = useAuth();
  const canArchiveEdit =
    !!activeMembership && roleHasPermission(activeMembership.role, "archive_edit");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const applicationId = params.get("applicationId");
  const isArchiveMode = params.get("mode") === "archive";
  const inviteCode = (params.get("inviteCode") ?? "").trim().toUpperCase();
  const inviteInfo = inviteCode ? validateInviteCode(inviteCode) : undefined;
  const editingApp = useMemo(
    () =>
      applicationId
        ? applications.find(
            (a) =>
              a.id === applicationId &&
              a.status === "rejected" &&
              (a.type === "create" || a.type === "invite" || a.type === "archive"),
          )
        : undefined,
    [applicationId, applications],
  );
  const archiveSourceApp = useMemo(() => {
    if (!isArchiveMode || editingApp) return undefined;
    return (
      applications.find(
        (a) =>
          a.status === "approved" &&
          (a.type === "create" || a.type === "invite") &&
          (a.enterpriseId === activeEnterprise?.id || a.enterpriseName === activeEnterprise?.name),
      ) ?? applications.find((a) => a.status === "approved" && (a.type === "create" || a.type === "invite"))
    );
  }, [isArchiveMode, editingApp, applications, activeEnterprise]);
  const isInvite = editingApp?.type === "invite" || (!!inviteInfo && inviteInfo.ok);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CreateDraft>(() => ({
    ...emptyCreateDraft(),
    contactPhone: user?.phone ?? "",
  }));
  const [error, setError] = useState("");
  const [ocring, setOcring] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [duplicate, setDuplicate] = useState<ReturnType<typeof findEnterpriseByUscc>>(undefined);
  const hydratedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const hydrateKey = editingApp
      ? `edit:${editingApp.id}`
      : isArchiveMode
        ? `archive:${archiveSourceApp?.id ?? activeEnterprise?.id ?? "none"}`
        : inviteCode
          ? `invite:${inviteCode}`
          : null;
    if (!hydrateKey) return;
    if (hydratedKeyRef.current === hydrateKey) return;
    hydratedKeyRef.current = hydrateKey;

    if (editingApp) {
      const next = createDraftFromApplication(editingApp, user?.phone);
      setDraft(next);
      if (next.parkId) selectPark(next.parkId);
      return;
    }
    if (isArchiveMode && archiveSourceApp) {
      const next = createDraftFromApplication(archiveSourceApp, user?.phone);
      if (!Object.keys(next.uploads).length && activeEnterprise?.id === "ent-001") {
        const demo = demoEnterpriseUploads();
        setDraft({ ...next, uploads: demo.uploads, uploadPreviews: demo.uploadPreviews });
      } else {
        setDraft(next);
      }
      if (next.parkId) selectPark(next.parkId);
      return;
    }
    if (isArchiveMode && activeEnterprise) {
      setDraft({
        ...emptyCreateDraft(),
        parkId: activeEnterprise.parkId,
        customerType: "enterprise",
        subjectName: activeEnterprise.name,
        certNo: activeEnterprise.uscc,
        contactName: activeEnterprise.contactName,
        contactPhone: activeEnterprise.contactPhone || user?.phone || "",
        displayName: activeMembership?.displayName || "",
        businessDescription: activeEnterprise.industry || "",
        agree: true,
        faceVerified: true,
        signed: true,
        ...(activeEnterprise.id === "ent-001" ? demoEnterpriseUploads() : {}),
      });
      selectPark(activeEnterprise.parkId);
      return;
    }
    if (!inviteCode) return;
    const result = validateInviteCode(inviteCode);
    if (!result.ok) return;
    const parkId = result.record.parkId;
    setDraft((d) => (d.parkId === parkId ? d : { ...d, parkId }));
    selectPark(parkId);
  }, [
    editingApp,
    inviteCode,
    selectPark,
    user?.phone,
    isArchiveMode,
    archiveSourceApp,
    activeEnterprise,
    activeMembership,
  ]);

  const ctype = customerTypes.find((t) => t.id === draft.customerType);
  const park = getParkById(draft.parkId);
  const industrySel = {
    section: draft.industrySection,
    division: draft.industryDivision,
    group: draft.industryGroup,
    class: draft.industryClass,
  };
  const industryLabel = formatIndustrySelection(industrySel);
  const chainSel = {
    l1: draft.industryChainL1,
    l2: draft.industryChainL2,
    l3: draft.industryChainL3,
  };
  const chainLabel = formatIndustryChain(chainSel);
  const isOrgType = ctype && !ctype.usesIdType;

  const patch = (next: Partial<CreateDraft>) => setDraft((d) => ({ ...d, ...next }));

  const handleUpload = (slotId: string, file: File) => {
    const nextUploads = { ...draft.uploads, [slotId]: file.name };
    patch({ uploads: nextUploads });
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        patch({
          uploads: nextUploads,
          uploadPreviews: { ...draft.uploadPreviews, [slotId]: String(reader.result) },
        });
      };
      reader.readAsDataURL(file);
    } else {
      patch({
        uploads: nextUploads,
        uploadPreviews: {
          ...draft.uploadPreviews,
          [slotId]: `file:${file.type || "application/octet-stream"}:${file.name}`,
        },
      });
    }
  };

  const runCertRecognize = () => {
    if (!draft.customerType || !ctype) return;
    const missing = ctype.documents.filter((d) => d.required && !draft.uploads[d.id]);
    if (missing.length) {
      setError(`请先上传：${missing.map((d) => d.label).join("、")}`);
      return;
    }
    setError("");
    setOcring("recognize");
    window.setTimeout(() => {
      const ocr = mockOcr(draft.customerType as CustomerTypeId, draft.idType);
      setDraft((d) => ({
        ...d,
        subjectName: ocr.subjectName,
        certNo: ocr.certNo,
        certValidUntil: ocr.certValidUntil === "长期" ? "" : ocr.certValidUntil,
        longTerm: ocr.certValidUntil === "长期",
        displayName: d.displayName || ocr.subjectName,
        establishedAt: ocr.establishedAt ?? d.establishedAt,
        registeredCapital: ocr.registeredCapital ?? d.registeredCapital,
        registeredAddress: ocr.registeredAddress ?? d.registeredAddress,
      }));
      setOcring("");
    }, 900);
  };

  const validateStep = (index: number) => {
    if (index === 0) {
      if (!draft.parkId) return "请选择入驻园区";
      if (!draft.customerType) return "请选择客户类型";
      if (ctype?.usesIdType && !draft.idType) return "请选择证件类型";
      if (!draft.subjectName.trim()) return "请填写主体名称";
      if (!draft.certNo.trim()) return "请填写统一社会信用代码 / 证件号码";
      if (!draft.longTerm && !draft.certValidUntil) return "请填写证件有效期";
      const missing = ctype?.documents.filter((d) => d.required && !draft.uploads[d.id]);
      if (missing && missing.length) return `请上传：${missing.map((d) => d.label).join("、")}`;
      if (!draft.contactName.trim() || !draft.contactPhone.trim() || !draft.contactEmail.trim()) {
        return "请填写经办人姓名、电话与邮箱";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail.trim())) {
        return "请输入正确的经办人邮箱";
      }
      if (!draft.displayName.trim()) return "请填写显示名称";
    }
    if (index === 1) {
      if (!draft.industrySection || !draft.industryDivision || !draft.industryGroup || !draft.industryClass) {
        return "请按国标 GB/T 4754 选择行业门类、大类、中类、小类";
      }
      if (!draft.enterpriseNature) return "请选择企业性质";
      if (!draft.enterpriseScale) return "请选择企业规模";
      if (!draft.businessDescription.trim()) return "请填写主营业务与产品服务描述";
      if (!draft.intro.trim()) return "请填写主体简介";
      if (!draft.address.trim() || draft.lat == null || draft.lng == null) {
        return "请查询或在地图上选择办公地址";
      }
      if (!draft.industryChainL1 || !draft.industryChainL2 || !draft.industryChainL3) {
        return "请选择所属产业（一至三级）";
      }
    }
    if (index === 2) {
      if (!draft.agree) return "请阅读并同意入驻协议";
      if (!draft.faceVerified) return "请完成手机扫码人脸识别";
      if (!draft.signed) return "请完成电子签署";
    }
    return "";
  };

  const goNext = () => {
    const msg = validateStep(step);
    setError(msg);
    if (msg) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleSubmit = () => {
    const msg = validateStep(2) || validateStep(3);
    setError(msg);
    if (msg) return;
    const payload = {
      parkId: draft.parkId,
      enterpriseName: draft.subjectName,
      uscc: draft.certNo,
      industry: industryLabel,
      contactName: draft.contactName,
      contactPhone: draft.contactPhone,
      contactEmail: draft.contactEmail.trim(),
      displayName: draft.displayName,
      materialsNote: [
        `客户类型 ${customerTypeLabel(draft.customerType)}`,
        draft.longTerm ? "证件长期有效" : `有效期 ${draft.certValidUntil}`,
        draft.establishedAt && `成立 ${draft.establishedAt}`,
        draft.registeredCapital && `注册资本 ${draft.registeredCapital}`,
        chainLabel && `所属产业 ${chainLabel}`,
        draft.chainSegments.length && `产业链环节 ${draft.chainSegments.join("、")}`,
        draft.enterpriseTags.length && `标签 ${draft.enterpriseTags.join("、")}`,
      ]
        .filter(Boolean)
        .join(" · "),
      customerType: draft.customerType,
      idType: draft.idType,
      certValidUntil: draft.longTerm ? "长期" : draft.certValidUntil,
      establishedAt: draft.establishedAt,
      registeredCapital: draft.registeredCapital,
      registeredAddress: draft.registeredAddress,
      enterpriseNature: draft.enterpriseNature,
      enterpriseScale: draft.enterpriseScale,
      businessDescription: draft.businessDescription,
      address: draft.address,
      lat: draft.lat ?? undefined,
      lng: draft.lng ?? undefined,
      upstreamCategories: draft.upstreamCategories,
      downstreamCategories: draft.downstreamCategories,
      industryChainL1: draft.industryChainL1,
      industryChainL2: draft.industryChainL2,
      industryChainL3: draft.industryChainL3,
      chainSegments: draft.chainSegments,
      enterpriseTags: draft.enterpriseTags,
      faceVerified: draft.faceVerified,
      eSigned: draft.signed,
      parkName: park?.name,
      intro: draft.intro,
      uploads: draft.uploads,
      uploadPreviews: draft.uploadPreviews,
      inviteCode: editingApp?.inviteCode || inviteCode || undefined,
    };
    const result =
      isArchiveMode && editingApp?.type === "archive"
        ? resubmitApplication(editingApp.id, payload)
        : isArchiveMode
          ? submitArchiveChange(payload)
          : editingApp
            ? resubmitApplication(editingApp.id, payload)
            : isInvite
              ? submitInviteEnterprise(payload)
              : submitCreateEnterprise(payload);
    if (!result.ok) {
      setError(
        "error" in result && typeof result.error === "string"
          ? result.error
          : "提交失败，请检查园区与资料",
      );
      return;
    }
    setSubmitted(true);
    if ("duplicate" in result && result.duplicate) {
      setDuplicate(findEnterpriseByUscc(draft.certNo, customEnterprises));
    } else {
      navigate("/onboarding/status");
    }
  };

  const canReuseSign =
    !!(editingApp?.faceVerified && editingApp?.eSigned) ||
    !!(isArchiveMode && draft.faceVerified && draft.signed);

  if (isArchiveMode && !hasActiveEnterprise) {
    return (
      <div className="onboard-page">
        <div className="container onboard-form-wrap">
          <div className="auth-notice auth-notice--warn">
            <h3>无法编辑企业档案</h3>
            <p>请先完成企业入驻并开通后再修改档案。</p>
            <Link to="/onboarding" className="btn btn-primary">
              去入驻
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isArchiveMode && !canArchiveEdit) {
    return (
      <div className="onboard-page">
        <div className="container onboard-form-wrap">
          <div className="auth-notice auth-notice--warn">
            <h3>无档案变更权限</h3>
            <p>当前角色不能发起企业档案变更，请联系企业管理员。</p>
            <Link to="/account/enterprise" className="btn btn-primary">
              返回企业档案
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isArchiveMode && archiveChangeStatus === "reviewing" && !editingApp) {
    return (
      <div className="onboard-page">
        <div className="container onboard-form-wrap">
          <div className="auth-notice auth-notice--warn">
            <h3>档案变更审核中</h3>
            <p>当前已有档案变更正在审核，请等待审核完成后再编辑。</p>
            <div className="form-actions">
              <Link to="/onboarding/status" className="btn btn-primary">
                查看审核进度
              </Link>
              <Link to="/account/enterprise" className="btn btn-ghost-dark">
                返回企业档案
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted && duplicate) {
    return (
      <div className="onboard-page">
        <div className="container onboard-form-wrap">
          <div className="auth-notice auth-notice--warn">
            <h3>该主体已在平台注册</h3>
            <p>
              证件号码 <code>{duplicate.uscc}</code> 对应「{duplicate.name}」已存在。
            </p>
            <div className="form-actions">
              <Link className="btn btn-primary" to={`/onboarding/join?enterpriseId=${duplicate.id}`}>
                申请加入该企业
              </Link>
              <Link className="btn btn-ghost-dark" to="/onboarding/status">查看我的申请</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (inviteCode && !inviteInfo?.ok) {
    return (
      <div className="onboard-page">
        <div className="container onboard-form-wrap">
          <div className="auth-notice auth-notice--warn">
            <h3>邀请码无效</h3>
            <p>{inviteInfo && "error" in inviteInfo ? inviteInfo.error : "请返回重新验证邀请码。"}</p>
            <Link to="/onboarding/invite" className="btn btn-primary">
              返回验证邀请码
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (applicationId && !editingApp && !isArchiveMode) {
    return (
      <div className="onboard-page">
        <div className="container onboard-form-wrap">
          <div className="auth-notice auth-notice--warn">
            <h3>无法编辑该申请</h3>
            <p>申请不存在、已撤回或当前状态不可修改。</p>
            <div className="form-actions">
              <Link to="/onboarding/status" className="btn btn-primary">返回申请进度</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const backTo = isArchiveMode
    ? "/account/enterprise"
    : editingApp
      ? "/onboarding/status"
      : "/onboarding";
  const pageTitle = isArchiveMode
    ? editingApp
      ? "修改档案并重新提交"
      : "编辑企业档案"
    : editingApp
      ? "修改并重新提交"
      : isInvite
        ? "邀请码入驻"
        : "创建企业";
  const pageDesc = isArchiveMode
    ? "修改后重新提交，将进入园区运营审核；审核期间可继续使用平台功能。"
    : editingApp
      ? "请根据驳回原因修改资料后重新提交审核。"
      : isInvite
        ? "邀请码已定位园区。请按步骤完成基本信息、经营信息、协议签署后提交审核。"
        : "按步骤完成基本信息、经营信息、协议签署后提交审核。";

  return (
    <div className="onboard-page">
      <div className="container onboard-form-wrap onboard-form-wrap--wide">
        <div className="form-head">
          <Link to={backTo} className="form-back">
            ← {isArchiveMode ? "返回企业档案" : editingApp ? "返回申请进度" : "返回入驻引导"}
          </Link>
          <h1>{pageTitle}</h1>
          <p>{pageDesc}</p>
        </div>

        {editingApp?.reviewNote && (
          <div className="auth-notice auth-notice--warn" style={{ marginBottom: 16 }}>
            <strong>驳回原因</strong>
            <p style={{ marginTop: 6 }}>{editingApp.reviewNote}</p>
          </div>
        )}

        <ol className="wizard-steps">
          {STEPS.map((label, i) => (
            <li key={label} className={i === step ? "on" : i < step ? "done" : ""}>
              <b>{i + 1}</b>
              {label}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="enterprise-form">
            <ParkPicker
              value={draft.parkId}
              onChange={(id) => {
                patch({ parkId: id });
                if (id) selectPark(id);
              }}
              locked={isInvite}
              title="入驻园区"
            />

            <section>
              <h3>客户类型</h3>
              <label>
                <span>客户类型 *</span>
                <select
                  value={draft.customerType}
                  onChange={(e) =>
                    patch({
                      customerType: e.target.value as CustomerTypeId | "",
                      uploads: {},
                      subjectName: "",
                      certNo: "",
                      certValidUntil: "",
                      longTerm: false,
                      establishedAt: "",
                      registeredCapital: "",
                      registeredAddress: "",
                    })
                  }
                >
                  <option value="">请选择</option>
                  {customerTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              {ctype && <p className="form-hint">{ctype.hint}</p>}
            </section>

            {ctype && (
              <>
                <section>
                  <h3>主体证明文件</h3>
                  <p className="form-hint">身份证件需上传正反面；上传完成后点击「证件识别」自动填充下方信息。</p>
                  <div className="upload-slots">
                    {ctype.documents.map((doc) => (
                      <label
                        key={doc.id}
                        className={`doc-slot ${draft.uploads[doc.id] ? "is-uploaded" : ""}`}
                      >
                        <b>{doc.label}{doc.required ? " *" : ""}</b>
                        <span>{doc.hint}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(doc.id, file);
                          }}
                        />
                        <em>
                          {draft.uploads[doc.id] ? `已上传：${draft.uploads[doc.id]}` : "点击上传"}
                        </em>
                      </label>
                    ))}
                  </div>
                </section>

                <div className="ocr-action-bar">
                  {ctype.usesIdType && (
                    <label className="ocr-id-type">
                      <span>证件类型 *</span>
                      <select
                        value={draft.idType}
                        onChange={(e) => patch({ idType: e.target.value })}
                      >
                        {ID_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={runCertRecognize}
                    disabled={ocring === "recognize"}
                  >
                    {ocring === "recognize" ? "识别中…" : "证件识别"}
                  </button>
                  <p className="form-hint">
                    上传完成后点击识别，自动填充主体名称、证件信息{isOrgType ? "、成立时间、注册资本与注册地址" : ""}。
                  </p>
                </div>

                <section>
                  <h3>识别结果核对</h3>
                  <div className="form-grid">
                    <label className="span-2">
                      <span>{ctype.subjectLabel} *</span>
                      <input
                        value={draft.subjectName}
                        onChange={(e) => patch({ subjectName: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>{ctype.certLabel} *</span>
                      <input
                        value={draft.certNo}
                        onChange={(e) => patch({ certNo: e.target.value.toUpperCase() })}
                      />
                    </label>
                    <label>
                      <span>证件有效期 *</span>
                      <div className="auth-otp-row">
                        <input
                          type="date"
                          disabled={draft.longTerm}
                          value={draft.longTerm ? "" : draft.certValidUntil}
                          onChange={(e) => patch({ certValidUntil: e.target.value })}
                        />
                        <label className="check-inline">
                          <input
                            type="checkbox"
                            checked={draft.longTerm}
                            onChange={(e) => patch({ longTerm: e.target.checked, certValidUntil: "" })}
                          />
                          长期
                        </label>
                      </div>
                    </label>
                    {isOrgType && (
                      <>
                        <label>
                          <span>成立时间</span>
                          <input
                            type="date"
                            value={draft.establishedAt}
                            onChange={(e) => patch({ establishedAt: e.target.value })}
                          />
                        </label>
                        <label>
                          <span>注册资本</span>
                          <input
                            value={draft.registeredCapital}
                            onChange={(e) => patch({ registeredCapital: e.target.value })}
                            placeholder="如：5000万元人民币"
                          />
                        </label>
                        <label className="span-2">
                          <span>注册地址</span>
                          <input
                            value={draft.registeredAddress}
                            onChange={(e) => patch({ registeredAddress: e.target.value })}
                            placeholder="营业执照登记住所"
                          />
                        </label>
                      </>
                    )}
                    <label>
                      <span>经办人姓名 *</span>
                      <input
                        value={draft.contactName}
                        onChange={(e) => patch({ contactName: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>经办人电话 *</span>
                      <input
                        type="tel"
                        value={draft.contactPhone}
                        onChange={(e) => patch({ contactPhone: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>经办人邮箱 *</span>
                      <input
                        type="email"
                        value={draft.contactEmail}
                        onChange={(e) => patch({ contactEmail: e.target.value })}
                        placeholder="用于接收审核通知与入驻函"
                      />
                    </label>
                    <label className="span-2">
                      <span>平台显示名称 *</span>
                      <input
                        value={draft.displayName}
                        onChange={(e) => patch({ displayName: e.target.value })}
                      />
                    </label>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="enterprise-form">
            <section>
              <h3>行业分类（GB/T 4754）</h3>
              <IndustryPicker
                value={industrySel}
                onChange={(next) =>
                  patch({
                    industrySection: next.section,
                    industryDivision: next.division,
                    industryGroup: next.group,
                    industryClass: next.class,
                  })
                }
              />
            </section>

            <section>
              <h3>企业概况</h3>
              <div className="form-grid">
                <label>
                  <span>企业性质 *</span>
                  <select
                    value={draft.enterpriseNature}
                    onChange={(e) => patch({ enterpriseNature: e.target.value })}
                  >
                    <option value="">请选择</option>
                    {ENTERPRISE_NATURES.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>企业规模 *</span>
                  <select
                    value={draft.enterpriseScale}
                    onChange={(e) => patch({ enterpriseScale: e.target.value })}
                  >
                    <option value="">请选择</option>
                    {ENTERPRISE_SCALES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="span-2">
                  <span>主营业务与产品服务描述 *</span>
                  <textarea
                    rows={3}
                    value={draft.businessDescription}
                    onChange={(e) => patch({ businessDescription: e.target.value })}
                    placeholder="主营产品、服务范围、核心能力与客户群体等"
                  />
                </label>
                <label className="span-2">
                  <span>企业 / 主体简介 *</span>
                  <textarea
                    rows={4}
                    value={draft.intro}
                    onChange={(e) => patch({ intro: e.target.value })}
                    placeholder="经营范围、产能规模、资质荣誉等"
                  />
                </label>
              </div>
            </section>

            <section>
              <h3>办公地址</h3>
              <AddressPicker
                value={{ address: draft.address, lat: draft.lat, lng: draft.lng }}
                onChange={(v) => patch(v)}
                onSearch={geocodeAddress}
              />
            </section>

            <section>
              <h3>采购与销售品类</h3>
              <div className="form-grid">
                <label className="span-2">
                  <span>采购品类清单（上游）</span>
                  <textarea
                    rows={3}
                    value={draft.upstreamCategories}
                    onChange={(e) => patch({ upstreamCategories: e.target.value })}
                    placeholder="选填。如：钢材、伺服电机、工业润滑油、外包加工服务等"
                  />
                </label>
                <label className="span-2">
                  <span>销售品类清单（下游）</span>
                  <textarea
                    rows={3}
                    value={draft.downstreamCategories}
                    onChange={(e) => patch({ downstreamCategories: e.target.value })}
                    placeholder="选填。如：精密零部件、整机设备、运维服务等"
                  />
                </label>
              </div>
            </section>

            <section>
              <h3>产业信息</h3>
              <IndustryChainPicker
                value={chainSel}
                onChange={(next) =>
                  patch({
                    industryChainL1: next.l1,
                    industryChainL2: next.l2,
                    industryChainL3: next.l3,
                  })
                }
              />
              <MultiSelectChips
                label="所属产业链环节（可多选）"
                hint="选择企业在产业链中所处环节，可多选。"
                options={CHAIN_SEGMENTS}
                value={draft.chainSegments}
                onChange={(chainSegments) => patch({ chainSegments })}
              />
              <MultiSelectChips
                label="企业标签（可多选）"
                hint="选择与企业资质、特征相关的标签。"
                options={ENTERPRISE_TAGS}
                value={draft.enterpriseTags}
                onChange={(enterpriseTags) => patch({ enterpriseTags })}
              />
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="enterprise-form">
            <section className="sign-flow-section">
              <EntryAgreementSign
                subjectName={draft.subjectName}
                displayName={draft.displayName}
                contactName={draft.contactName}
                certNo={draft.certNo}
                agree={draft.agree}
                faceVerified={draft.faceVerified}
                signed={draft.signed}
                canReuse={canReuseSign}
                onChange={patch}
              />
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="enterprise-review-layout">
            <div className="enterprise-form">
              <section className="enterprise-review-panel">
                <div className="enterprise-review-intro">
                  <h3>核对填报信息</h3>
                  <p>
                    {isArchiveMode || editingApp
                      ? "请核对修改后的信息。主体信息变更须重新签署，其他变更可直接提交审核。"
                      : "请逐项核对填写内容与协议签署，确认无误后再提交。审核驳回后可修改再提交。"}
                  </p>
                </div>
                <EnterpriseReviewSummary
                  draft={draft}
                  industryLabel={industryLabel}
                  chainLabel={chainLabel}
                  isOrgType={!!isOrgType}
                />
              </section>
            </div>
            <aside className="enterprise-review-help">
              <div className="enterprise-review-help-card">
                <strong>本步说明</strong>
                <b>提交前确认</b>
                <p>
                  {isArchiveMode
                    ? "提交后进入园区运营审核。审核期间可继续使用平台功能，通过后企业档案将更新为最新内容。"
                    : editingApp
                      ? "请核对修改后的信息。主体信息变更须重新签署，其他变更可直接提交审核。"
                      : "请逐项核对填写内容与协议签署。提交后将进入园区运营审核，通过前暂无平台功能权限。"}
                </p>
                <div className="enterprise-review-help-foot">
                  {isArchiveMode
                    ? "可在「入驻进度查询」跟踪档案变更审核状态。"
                    : "若企业已在平台入驻，将无法重复创建，可申请加入或联系管理员。"}
                </div>
              </div>
            </aside>
          </div>
        )}

        {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

        <div className="form-actions" style={{ marginTop: 16 }}>
          {step > 0 && (
            <button type="button" className="btn btn-ghost-dark" onClick={() => { setError(""); setStep((s) => s - 1); }}>
              上一步
            </button>
          )}
          {step < 3 ? (
            <button type="button" className="btn btn-primary" onClick={goNext}>下一步</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              提交审核
            </button>
          )}
          <Link to={backTo} className="btn btn-ghost-dark">取消</Link>
        </div>
      </div>
    </div>
  );
}
