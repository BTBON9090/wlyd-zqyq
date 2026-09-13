import { useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Buildings,
  CheckCircle,
  Clock,
  EnvelopeOpen,
  FileArrowUp,
  MagnifyingGlass,
  ShieldCheck,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { gateway } from "../../lib/api";
import { DEMO, site } from "../../lib/config";
import { applicationSchema, type Enterprise } from "../../lib/models";
import { fileError, useValidation } from "../../lib/forms";
import { Breadcrumb } from "../../components/Shell";
import { ErrorNotice, Field, Input, Modal } from "../../components/ui";
type Method = "create" | "join" | "invite";
const methods = [
  {
    id: "create" as const,
    title: "创建企业",
    description: "企业首次入驻，由经办人提交企业资料。",
    icon: Buildings,
    label: "我是企业负责人",
  },
  {
    id: "join" as const,
    title: "加入已有企业",
    description: "企业已入驻，申请加入并由企业管理员审核。",
    icon: UsersThree,
    label: "我是企业成员",
  },
  {
    id: "invite" as const,
    title: "邀请码入驻",
    description: "已有园区邀请码，填写资料后申请入驻。",
    icon: EnvelopeOpen,
    label: "我有邀请码",
  },
];
export default function OnboardingPage() {
  const { session, loading } = useApp();
  if (loading) return <div className="loading-page">正在读取账号信息…</div>;
  if (!session) return <Navigate to="/login?returnTo=%2Fonboarding" replace />;
  return <OnboardingForm key={`${session.id}:${session.enterpriseStatus}`} />;
}
function OnboardingForm() {
  const { session, setSession, skipped } = useApp();
  const [params] = useSearchParams();
  const [method, setMethod] = useState<Method | null>(null);
  const [step, setStep] = useState(1);
  const [enterprise, setEnterprise] = useState("");
  const [creditCode, setCreditCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [enterpriseId, setEnterpriseId] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Enterprise[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [file, setFile] = useState<File>();
  const [fileMsg, setFileMsg] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [legal, setLegal] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const key = useRef(crypto.randomUUID());
  const { errors, validate, clear } = useValidation();
  const fileInput = useRef<HTMLInputElement>(null);
  async function searchEnterprise(e: FormEvent) {
    e.preventDefault();
    if (search.trim().length < 2) {
      setError(new Error("请输入至少 2 个字的企业名称"));
      return;
    }
    setSearching(true);
    setError(null);
    try {
      setResults(await gateway.enterprises(search.trim()));
    } catch (e) {
      setError(e);
    } finally {
      setSearching(false);
    }
  }
  function next(e: FormEvent) {
    e.preventDefault();
    const schema =
      method === "join"
        ? z.object({
            enterpriseId: z.string().min(1, "请选择要加入的企业"),
            contactName: z.string().trim().min(2, "请填写您的姓名"),
          })
        : applicationSchema
            .omit({ agreed: true })
            .extend(
              method === "invite"
                ? { inviteCode: z.string().min(1, "请输入邀请码") }
                : {},
            );
    if (
      !validate(schema, {
        enterpriseId,
        enterprise,
        creditCode,
        contactName,
        inviteCode,
      })
    )
      return;
    if (method !== "join" && !file && !skipped.includes("file")) {
      setFileMsg("请上传营业执照");
      return;
    }
    if (fileError(file)) {
      setFileMsg(fileError(file));
      return;
    }
    setError(null);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function submit() {
    if (lock.current) return;
    if (
      !validate(
        z.object({
          agreed: z.literal(true, {
            error: "请确认资料真实，并阅读同意平台使用条款",
          }),
        }),
        { agreed },
      )
    )
      return;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const user = await gateway.apply(
        {
          type: method!,
          enterprise,
          enterpriseId,
          creditCode,
          contactName,
          inviteCode,
          agreed,
          file,
        },
        key.current,
      );
      setSession(user);
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  if (
    session?.enterpriseStatus === "approved" ||
    session?.enterpriseStatus === "pending"
  ) {
    const approved = session.enterpriseStatus === "approved";
    return (
      <div className="container result-page">
        <div className="result-card">
          <span className={`result-icon ${approved ? "" : "pending"}`}>
            {approved ? (
              <ShieldCheck size={54} weight="duotone" />
            ) : (
              <Clock size={54} weight="duotone" />
            )}
          </span>
          <span className="eyebrow">企业入驻</span>
          <h1>{approved ? "您的企业已认证" : "申请已提交，等待审核"}</h1>
          <p>
            {approved
              ? "以企业身份，连接更多专业服务。"
              : DEMO
                ? "此为演示申请，未提交至真实审核机构。"
                : "审核结果将在本页更新，请留意办理状态。"}
          </p>
          <dl className="receipt-summary">
            <div>
              <dt>企业名称</dt>
              <dd>{session.enterprise}</dd>
            </div>
            <div>
              <dt>所在园区</dt>
              <dd>{site.park}</dd>
            </div>
            {session.applicationId && (
              <div>
                <dt>申请编号</dt>
                <dd>{session.applicationId}</dd>
              </div>
            )}
            <div>
              <dt>当前状态</dt>
              <dd>
                <span className="status-tag">
                  {approved ? "已认证" : "待审核"}
                </span>
              </dd>
            </div>
          </dl>
          <div className="button-row">
            <Link className="button secondary" to="/">
              返回首页
            </Link>
            <Link className="button primary" to="/services">
              浏览企业服务 <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="container onboarding-page onboarding-v2">
      <Breadcrumb items={[{ label: "企业入驻" }]} />
      <div className="page-heading">
        <div className="eyebrow">
          {params.has("welcome") ? "账号已注册 · 接下来" : "企业入驻"}
        </div>
        <h1>
          {step === 1
            ? "关联企业，开启专属服务"
            : step === 2
              ? "完善企业资料"
              : "确认申请信息"}
        </h1>
        <p>
          {step === 1
            ? "选择适合您的入驻方式，也可以先浏览服务，稍后再办理。"
            : step === 2
              ? "只需填写本次审核所需的信息。"
              : "请核对以下信息，提交后将进入审核。"}
        </p>
      </div>
      {session?.enterpriseStatus === "rejected" && (
        <div className="notice error">
          上次申请未通过：{session.reviewNote || "请核对企业资料后重新提交。"}
        </div>
      )}
      <div className="onboarding-account-note">
        <span>账号验证已完成</span>
        <strong>
          {session?.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
        </strong>
        <p>接下来提交企业资料，用于建立您的企业身份。</p>
      </div>
      <ol className="onboarding-steps">
        {["选择入驻方式", "填写企业资料", "确认并提交"].map((s, i) => (
          <li
            key={s}
            className={
              step === i + 1 ? "current" : step > i + 1 ? "complete" : ""
            }
            aria-current={step === i + 1 ? "step" : undefined}
          >
            <span>{step > i + 1 ? <CheckCircle size={18} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      {step === 1 ? (
        <>
          <div className="method-grid">
            {methods.map((m) => (
              <button
                className="method-card"
                key={m.id}
                onClick={() => {
                  setMethod(m.id);
                  setStep(2);
                }}
              >
                <span className="method-icon">
                  <m.icon size={36} weight="duotone" />
                </span>
                <span className="method-label">{m.label}</span>
                <h2>{m.title}</h2>
                <p>{m.description}</p>
                <span className="text-link">
                  开始办理 <ArrowRight size={18} />
                </span>
              </button>
            ))}
          </div>
          <div className="onboarding-later">
            <ShieldCheck size={19} />
            <span>入驻审核期间，您仍可浏览并咨询企业服务。</span>
            <Link to="/services">
              先逛逛 <ArrowRight size={16} />
            </Link>
          </div>
        </>
      ) : step === 2 ? (
        <div className="onboarding-form-layout">
          <div className="form-card">
            {method === "join" && (
              <form className="enterprise-search" onSubmit={searchEnterprise}>
                <Field label="查找您的企业" id="enterprise-search">
                  <div className="input-action">
                    <input
                      id="enterprise-search"
                      value={search}
                      maxLength={80}
                      placeholder="输入已入驻企业的名称"
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <button disabled={searching}>
                      {searching ? (
                        "查询中…"
                      ) : (
                        <>
                          <MagnifyingGlass />
                          查询
                        </>
                      )}
                    </button>
                  </div>
                </Field>
                {results !== null && (
                  <div
                    className="enterprise-results"
                    role="radiogroup"
                    aria-label="选择企业"
                  >
                    {results.length ? (
                      results.map((r) => (
                        <label
                          key={r.id}
                          className={enterpriseId === r.id ? "selected" : ""}
                        >
                          <input
                            name="enterprise"
                            type="radio"
                            checked={enterpriseId === r.id}
                            onChange={() => {
                              setEnterpriseId(r.id);
                              setEnterprise(r.name);
                              clear("enterpriseId");
                            }}
                          />
                          <span>
                            <strong>{r.name}</strong>
                            <small>{r.park}</small>
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="muted">
                        未找到相关企业，请核对名称，或选择「创建企业」。
                      </p>
                    )}
                  </div>
                )}
                {errors.enterpriseId && (
                  <p className="field-error" role="alert">
                    {errors.enterpriseId}
                  </p>
                )}
              </form>
            )}
            <form noValidate onSubmit={next}>
              <h2>{methods.find((m) => m.id === method)?.title}</h2>
              {method === "invite" && (
                <Input
                  id="inviteCode"
                  label="园区邀请码"
                  value={inviteCode}
                  maxLength={32}
                  placeholder="请输入园区提供的邀请码"
                  error={errors.inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.trim().toUpperCase());
                    clear("inviteCode");
                  }}
                />
              )}
              {method !== "join" && (
                <>
                  <Input
                    id="enterprise"
                    label="企业名称"
                    name="organization"
                    autoComplete="organization"
                    value={enterprise}
                    maxLength={100}
                    placeholder="与营业执照上的名称保持一致"
                    error={errors.enterprise}
                    onChange={(e) => {
                      setEnterprise(e.target.value);
                      clear("enterprise");
                    }}
                  />
                  <Input
                    id="creditCode"
                    label="统一社会信用代码"
                    value={creditCode}
                    maxLength={18}
                    placeholder="18 位统一社会信用代码"
                    error={errors.creditCode}
                    onChange={(e) => {
                      setCreditCode(
                        e.target.value.toUpperCase().replace(/\s/g, ""),
                      );
                      clear("creditCode");
                    }}
                  />
                  <div className="field">
                    <label htmlFor="license-file">营业执照</label>
                    <div className="upload-box">
                      <FileArrowUp size={28} />
                      <div>
                        <strong>
                          {file ? file.name : "上传清晰的营业执照"}
                        </strong>
                        <p>PDF、JPG 或 PNG，单个不超过 10 MB</p>
                      </div>
                      <label
                        htmlFor="license-file"
                        className="button secondary file-button"
                      >
                        {file ? "重新选择" : "选择文件"}
                      </label>
                      {file && (
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="移除营业执照"
                          onClick={() => {
                            setFile(undefined);
                            if (fileInput.current) fileInput.current.value = "";
                          }}
                        >
                          <X />
                        </button>
                      )}
                      <input
                        ref={fileInput}
                        id="license-file"
                        type="file"
                        className="file-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          const msg =
                            fileError(f) ||
                            (f && !/\.(pdf|jpe?g|png)$/i.test(f.name)
                              ? "营业执照仅支持 PDF、JPG、PNG"
                              : "");
                          setFileMsg(msg);
                          if (msg) {
                            e.target.value = "";
                            setFile(undefined);
                          } else setFile(f);
                        }}
                      />
                    </div>
                    {fileMsg && (
                      <p className="field-error" role="alert">
                        {fileMsg}
                      </p>
                    )}
                  </div>
                </>
              )}
              <Input
                id="contactName"
                label={method === "join" ? "您的姓名" : "经办人姓名"}
                autoComplete="name"
                value={contactName}
                maxLength={30}
                placeholder="请输入真实姓名"
                error={errors.contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  clear("contactName");
                }}
              />
              <div className="readonly-field">
                <span>联系手机号</span>
                <strong>
                  {session!.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
                </strong>
              </div>
              <ErrorNotice error={error} />
              <div className="form-footer">
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                >
                  <ArrowLeft />
                  返回选择
                </button>
                <button className="button primary">
                  下一步，确认信息 <ArrowRight />
                </button>
              </div>
            </form>
          </div>
          <aside className="onboarding-note">
            <ShieldCheck size={32} />
            <h2>提交前请了解</h2>
            <p>请确保您已获得企业授权，并使用真实有效的企业资料。</p>
            <ul>
              <li>企业资料用于园区入驻审核。</li>
              <li>成员申请由企业管理员审核，不能自行授予管理权限。</li>
              <li>邀请码不代表审核通过。</li>
            </ul>
            <p>所在园区：{site.park}</p>
          </aside>
        </div>
      ) : (
        <div className="review-card">
          <h2>申请资料</h2>
          <dl className="receipt-summary">
            <div>
              <dt>入驻方式</dt>
              <dd>{methods.find((m) => m.id === method)?.title}</dd>
            </div>
            <div>
              <dt>企业名称</dt>
              <dd>{enterprise || "验收示例企业"}</dd>
            </div>
            {method !== "join" && (
              <>
                <div>
                  <dt>信用代码</dt>
                  <dd>{creditCode || "验收时已跳过"}</dd>
                </div>
                <div>
                  <dt>营业执照</dt>
                  <dd>{file?.name || "验收时已跳过"}</dd>
                </div>
              </>
            )}
            <div>
              <dt>经办人</dt>
              <dd>{contactName || "验收用户"}</dd>
            </div>
            <div>
              <dt>审核方</dt>
              <dd>{method === "join" ? "企业管理员" : "园区运营人员"}</dd>
            </div>
          </dl>
          <div className="consent">
            <input
              id="application-agreed"
              type="checkbox"
              checked={agreed}
              aria-invalid={!!errors.agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                clear("agreed");
              }}
            />
            <div>
              <label htmlFor="application-agreed">
                我确认已获企业授权，所填信息真实有效，并同意
              </label>
              <button onClick={() => setLegal(true)}>《平台使用条款》</button>
            </div>
          </div>
          {errors.agreed && (
            <p className="field-error" role="alert">
              {errors.agreed}
            </p>
          )}
          <ErrorNotice error={error} />
          <div className="form-footer">
            <button
              className="text-button"
              disabled={pending}
              onClick={() => setStep(2)}
            >
              <ArrowLeft />
              返回修改
            </button>
            <button
              className="button primary"
              disabled={pending}
              onClick={submit}
            >
              {pending ? "正在提交…" : "提交申请"}
              <ArrowRight />
            </button>
          </div>
        </div>
      )}
      <Modal open={legal} onOpenChange={setLegal} title="平台使用条款">
        <div className="legal-content">
          {DEMO && <p className="notice">原型条款，仅供流程验收。</p>}
          <h3>一、账号安全</h3>
          <p>主体应妥善保管账号与密码，对账号下发生的操作承担责任。</p>
          <h3>二、数据使用</h3>
          <p>
            平台仅在提供服务所必需范围内使用主体数据，并依法采取安全保护措施。
          </p>
          <h3>三、双模交付</h3>
          <p>
            平台支持线上与线下等多种交付方式，具体以业务场景及订单约定为准。
          </p>
          <h3>四、账号停用</h3>
          <p>主体存在严重违规或资质失效等情形时，平台可暂停或终止账号使用。</p>
        </div>
        <button
          className="button primary full-width"
          onClick={() => setLegal(false)}
        >
          关闭并继续
        </button>
      </Modal>
    </div>
  );
}
