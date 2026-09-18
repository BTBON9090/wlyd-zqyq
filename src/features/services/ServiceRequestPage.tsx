import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Link,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Paperclip,
  X,
} from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { gateway } from "../../lib/api";
import { DEMO } from "../../lib/config";
import { currency } from "../../lib/money";
import { ContentImage } from "../../components/ContentImage";
import { requestSchema, type Receipt } from "../../lib/models";
import { fileError, useValidation } from "../../lib/forms";
import { readStored, removeStored, writeStored } from "../../lib/storage";
import { Breadcrumb } from "../../components/Shell";
import { EmptyState, ErrorNotice, Field, Input } from "../../components/ui";
/** 履约类型与规格数据一一对应，侧边订单预览直接展示。 */
const fulfillment = {
  once_pay_once_accept: "一次性支付 · 一次性验收",
  installment_pay_installment_accept: "分期支付 · 分期验收",
};
export default function ServiceRequestPage() {
  const { serviceId = "" } = useParams();
  const { session, loading, openAuth } = useApp();
  const location = useLocation();
  const returnTo = location.pathname + location.search;
  useEffect(() => {
    if (!loading && !session) openAuth({ returnTo });
  }, [loading, session, openAuth, returnTo]);
  if (loading) return <div className="loading-page">正在验证登录状态…</div>;
  if (!session)
    return <div className="loading-page">请先登录后继续提交需求…</div>;
  return (
    <RequestForm key={`${session.id}:${serviceId}`} serviceId={serviceId} />
  );
}
function RequestForm({ serviceId }: { serviceId: string }) {
  const { session, toast } = useApp();
  const [params] = useSearchParams();
  const versionId = params.get("version") || undefined;
  const quantity = Math.max(
    1,
    Math.min(99, Math.floor(Number(params.get("quantity"))) || 1),
  );
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["service", serviceId],
    queryFn: ({ signal }) => gateway.service(serviceId, signal),
    retry: false,
  });
  const draftKey = `request-draft:${session!.id}:${serviceId}`;
  const [requirement, setRequirement] = useState(() =>
    readStored(draftKey, z.string(), ""),
  );
  const [name, setName] = useState(
    session?.name === "园区用户" ? "" : session?.name || "",
  );
  const [phone, setPhone] = useState(session?.phone || "");
  const [agreed, setAgreed] = useState(false);
  const [file, setFile] = useState<File>();
  const [fileMsg, setFileMsg] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<Receipt>();
  const { errors, validate, clear } = useValidation();
  const key = useRef(crypto.randomUUID());
  const lock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!receipt) {
      const t = setTimeout(() => writeStored(draftKey, requirement), 500);
      return () => clearTimeout(t);
    }
  }, [draftKey, requirement, receipt]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    if (
      !validate(requestSchema, {
        contactName: name,
        phone,
        requirement,
        agreed,
      })
    )
      return;
    if (fileError(file)) {
      setFileMsg(fileError(file));
      return;
    }
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await gateway.request(
        {
          serviceId,
          versionId,
          quantity,
          contactName: name,
          phone,
          requirement,
          agreed,
          file,
        },
        key.current,
      );
      setReceipt(result);
      removeStored(draftKey);
      void client.invalidateQueries({ queryKey: ["receipts"] });
      toast(DEMO ? "演示申请已保存" : "服务申请已提交");
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  if (receipt)
    return (
      <div className="container result-page">
        <div className="result-card">
          <span className="result-icon">
            <CheckCircle size={56} weight="duotone" />
          </span>
          <span className="eyebrow">{DEMO ? "演示提交完成" : "提交完成"}</span>
          <h1>您的需求已提交</h1>
          <p>
            {DEMO
              ? "申请已保存于本浏览器，未通知真实服务商。"
              : "服务商将根据需求与您联系，请保持电话畅通。"}
          </p>
          <dl className="receipt-summary">
            <div>
              <dt>申请编号</dt>
              <dd>{receipt.id}</dd>
            </div>
            <div>
              <dt>申请服务</dt>
              <dd>{receipt.serviceName}</dd>
            </div>
            {receipt.versionName && (
              <div>
                <dt>服务规格</dt>
                <dd>
                  {receipt.versionName} × {receipt.quantity || 1}
                </dd>
              </div>
            )}
            <div>
              <dt>联系电话</dt>
              <dd>
                {receipt.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
              </dd>
            </div>
            <div>
              <dt>当前状态</dt>
              <dd>
                <span className="status-tag">待服务商联系</span>
              </dd>
            </div>
          </dl>
          <div className="button-row">
            <Link className="button secondary" to="/services">
              继续浏览服务
            </Link>
            <Link className="button primary" to="/account/orders/services">
              查看我的申请 <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    );
  if (query.isPending)
    return <div className="loading-page">正在加载服务信息…</div>;
  if (query.isError)
    return (
      <div className="container">
        <EmptyState
          error
          title="服务信息无法加载"
          description={query.error.message}
          action="重新加载"
          onAction={() => void query.refetch()}
        />
      </div>
    );
  const service = query.data;
  const version = service.published?.versions.find((v) => v.id === versionId);
  if (versionId && !version)
    return (
      <div className="container">
        <EmptyState
          title="这项服务规格已不可用"
          description="请返回详情重新选择规格。"
        />
        <Link className="button primary" to={`/services/${serviceId}`}>
          重新选择规格
        </Link>
      </div>
    );
  return (
    <div className="container request-page">
      <Breadcrumb
        detail
        items={[
          { label: "企业服务", to: "/services" },
          { label: service.name, to: `/services/${serviceId}` },
          { label: "提交需求" },
        ]}
      />
      <div className="page-heading">
        <h1>告诉我们您的需求</h1>
        <p>信息越清楚，服务商越能为您提供合适的方案。</p>
      </div>
      <div className="request-layout">
        <form noValidate onSubmit={submit} className="form-card">
          <section>
            <h2>
              <span>01</span>服务需求
            </h2>
            <Field
              label="需求描述"
              id="requirement"
              error={errors.requirement}
              hint="只填写与服务相关的信息，请勿提供密码、银行卡等敏感信息。"
            >
              <textarea
                id="requirement"
                name="requirement"
                value={requirement}
                onChange={(e) => {
                  setRequirement(e.target.value);
                  clear("requirement");
                }}
                maxLength={1000}
                rows={6}
                placeholder="例如：我们是一家新成立的科技企业，希望注册 2 个商标，计划在下个月完成申请提交。"
                aria-invalid={!!errors.requirement}
                aria-describedby={
                  errors.requirement ? "requirement-error" : "requirement-hint"
                }
              />
              <div className="character-count">{requirement.length} / 1000</div>
            </Field>
            <div className="field">
              <label htmlFor="request-file">
                补充附件 <span className="muted">（选填）</span>
              </label>
              <div className="upload-box">
                <Paperclip size={24} />
                <div>
                  <strong>
                    {file ? file.name : "添加有助于理解需求的文件"}
                  </strong>
                  <p>PDF、DOCX、XLSX、JPG、PNG，单个不超过 10 MB</p>
                </div>
                {file ? (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="移除附件"
                    onClick={() => {
                      setFile(undefined);
                      setFileMsg("");
                      if (fileInput.current) fileInput.current.value = "";
                    }}
                  >
                    <X />
                  </button>
                ) : (
                  <label
                    className="button secondary file-button"
                    htmlFor="request-file"
                  >
                    选择文件
                  </label>
                )}
                <input
                  ref={fileInput}
                  className="file-input"
                  id="request-file"
                  type="file"
                  accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    const msg = fileError(f);
                    setFileMsg(msg);
                    if (msg) {
                      setFile(undefined);
                      e.target.value = "";
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
          </section>
          <section>
            <h2>
              <span>02</span>联系方式
            </h2>
            <div className="form-grid">
              <Input
                id="contactName"
                name="contactName"
                label="联系人"
                placeholder="请输入姓名"
                autoComplete="name"
                value={name}
                maxLength={30}
                error={errors.contactName}
                onChange={(e) => {
                  setName(e.target.value);
                  clear("contactName");
                }}
              />
              <Input
                id="phone"
                name="phone"
                label="联系电话"
                placeholder="请输入手机号"
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                value={phone}
                maxLength={11}
                error={errors.phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  clear("phone");
                }}
              />
            </div>
            <div className="consent">
              <input
                type="checkbox"
                id="request-agreed"
                checked={agreed}
                aria-invalid={!!errors.agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  clear("agreed");
                }}
              />
              <label htmlFor="request-agreed">
                同意将本次需求与联系方式提供给「{service.provider}
                」，用于对接本次服务。
              </label>
            </div>
            {errors.agreed && (
              <p className="field-error" role="alert">
                {errors.agreed}
              </p>
            )}
          </section>
          <ErrorNotice error={error} />
          <div className="form-footer">
            <Link className="text-link" to={`/services/${serviceId}`}>
              <ArrowLeft />
              返回服务详情
            </Link>
            <button className="button primary" disabled={pending}>
              {pending ? "正在提交…" : "去支付"}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
        <aside className="request-summary">
          <div className="summary-cover">
            <ContentImage
              src={service.image}
              alt={service.name}
              placeholder="暂无服务图片"
            />
            <span className="summary-cover-tag">{service.category}</span>
          </div>
          <h2>{service.name}</h2>
          <p className="summary-provider">{service.provider}</p>
          {version ? (
            <dl>
              <div>
                <dt>服务规格</dt>
                <dd>{version.name}</dd>
              </div>
              <div>
                <dt>数量</dt>
                <dd>
                  {quantity} {version.unit}
                </dd>
              </div>
              <div>
                <dt>履约类型</dt>
                <dd>{fulfillment[version.fulfillmentType]}</dd>
              </div>
              <div>
                <dt>交付周期</dt>
                <dd>{version.deliveryCycleDays}个工作日</dd>
              </div>
              <div>
                <dt>单价</dt>
                <dd>
                  {currency(version.price)}/{version.unit}
                </dd>
              </div>
              <div>
                <dt>订单总额</dt>
                <dd className="amount-emphasis">
                  {currency(version.price * quantity)}
                </dd>
              </div>
            </dl>
          ) : (
            <dl>
              <div>
                <dt>交付周期</dt>
                <dd>{service.delivery}</dd>
              </div>
              <div>
                <dt>单价</dt>
                <dd>{service.price}</dd>
              </div>
            </dl>
          )}
          <div className="summary-pay">
            <span>待支付金额</span>
            <strong className="amount-emphasis">
              {version ? currency(version.price * quantity) : service.price}
            </strong>
          </div>
        </aside>
        <p className="field-hint request-draft-hint">
          需求文字在当前浏览器会话中暂存，提交成功后清除。附件刷新后需重新选择。
        </p>
      </div>
    </div>
  );
}
export function ServiceRequestsPage() {
  const { session, loading } = useApp();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["receipts", session?.id],
    queryFn: gateway.receipts,
    enabled: !!session,
    retry: false,
  });
  if (loading) return <div className="loading-page">正在加载…</div>;
  if (!session)
    return <div className="loading-page">请先登录后查看服务申请…</div>;
  return (
    <div className="container requests-page">
      <Breadcrumb
        items={[
          { label: "企业服务", to: "/services" },
          { label: "我的服务申请" },
        ]}
      />
      <div className="page-heading">
        <h1>我的服务申请</h1>
        <p>查看已提交的需求与当前办理状态。</p>
      </div>
      {query.isPending ? (
        <div className="loading-page">正在加载申请记录…</div>
      ) : query.isError ? (
        <EmptyState
          error
          title="申请记录加载失败"
          description={query.error.message}
          action="重试"
          onAction={() => void query.refetch()}
        />
      ) : !query.data.length ? (
        <EmptyState
          title="还没有服务申请"
          description="找到适合的服务后，提交您的第一份需求。"
          action="去找服务"
          onAction={() => navigate("/services")}
        />
      ) : (
        <div className="request-records">
          {query.data.map((r) => (
            <article className="request-record" key={r.id}>
              <div className="record-top">
                <span>
                  {r.id} · {new Date(r.createdAt).toLocaleString("zh-CN")}
                </span>
                <span className="status-tag">
                  {
                    {
                      submitted: "待服务商联系",
                      contacting: "沟通中",
                      closed: "已结束",
                    }[r.status]
                  }
                </span>
              </div>
              <h2>
                <Link to={`/services/${r.serviceId}`}>{r.serviceName}</Link>
              </h2>
              <p>{r.requirement}</p>
              <div className="record-bottom">
                <span>
                  联系人：{r.contactName} ·{" "}
                  {r.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
                </span>
                <Link className="text-link" to={`/services/${r.serviceId}`}>
                  查看服务 <ArrowRight />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
