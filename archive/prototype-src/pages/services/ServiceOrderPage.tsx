import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoginModal } from "../../context/LoginModalContext";
import {
  FULFILLMENT_LABEL,
  formatMoney,
  getPublishedService,
  isInstallmentFulfillment,
  payableNow,
  type PublishedVersion,
} from "../../data/publishedServices";
import { publicUrl } from "../../utils/publicUrl";

function deliveryCycleLabel(v: PublishedVersion): string {
  const days =
    v.fulfillmentType === "installment_pay_installment_accept" && v.phases.length
      ? v.phases.reduce((sum, p) => sum + p.deliveryCycleDays, 0)
      : v.deliveryCycleDays;
  const unit = v.startDayType === "工作日" ? "个工作日" : "天";
  return `${days}${unit}`;
}

export function ServiceOrderPage() {
  const { serviceId = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { openLogin } = useLoginModal();
  const { user, isAuthenticated } = useAuth();

  const service = getPublishedService(serviceId);
  const versionId = params.get("v") ?? "";
  const qty = Math.min(999, Math.max(1, Number(params.get("qty") ?? "1") || 1));

  const selected = useMemo(() => {
    if (!service) return null;
    return service.versions.find((v) => v.id === versionId) ?? service.versions[0] ?? null;
  }, [service, versionId]);

  const [desc, setDesc] = useState("");
  const [fileName, setFileName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState<{ desc?: string; name?: string; phone?: string }>({});

  const orderQuery = useMemo(() => {
    const q = new URLSearchParams();
    if (versionId) q.set("v", versionId);
    q.set("qty", String(qty));
    return q.toString();
  }, [versionId, qty]);

  useEffect(() => {
    if (!isAuthenticated) {
      openLogin(`/services/${serviceId}/order?${orderQuery}`);
    }
  }, [isAuthenticated, openLogin, serviceId, orderQuery]);

  useEffect(() => {
    if (!user) return;
    setContactName((prev) => prev || user.name?.trim() || "演示用户");
    setContactPhone((prev) => prev || user.phone || "");
  }, [user]);

  if (!service || !selected) {
    return <Navigate to="/services" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/services/${serviceId}`} replace />;
  }

  const total = selected.price * qty;
  const pay = payableNow(total, selected);
  const deliverDays = deliveryCycleLabel(selected);
  const installment = isInstallmentFulfillment(selected);
  const cover = service.coverUrl || service.media[0]?.url;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : "");
  };

  const clearFile = () => {
    setFileName("");
    const input = document.getElementById("svo-file") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!desc.trim()) next.desc = "请填写需求描述";
    if (!contactName.trim()) next.name = "请填写联系人姓名";
    const phone = contactPhone.replace(/\s/g, "");
    if (!/^1\d{10}$/.test(phone)) next.phone = "请填写正确的 11 位手机号";
    setErrors(next);
    if (Object.keys(next).length) return;

    showToast("订单已提交，收银台即将上线（演示）");
  };

  return (
    <div className="svo-page">
      <div className="container svo-wrap">
        <nav className="svo-crumb">
          <Link to="/">首页</Link>
          <span>/</span>
          <Link to="/services">企业服务</Link>
          <span>/</span>
          <Link to={`/services/${service.id}`}>{service.name}</Link>
          <span>/</span>
          <em>确认订单</em>
        </nav>

        <header className="svo-hero">
          <div>
            <h1>确认订单</h1>
            <p>填写需求与联系人信息后，再进入支付</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost-dark btn-sm"
            onClick={() => navigate(`/services/${service.id}`)}
          >
            返回详情
          </button>
        </header>

        <div className="svo-layout">
          <form className="svo-main" onSubmit={submit}>
            <section className="svo-card">
              <h2>需求信息</h2>
              <label className="svo-field">
                <span>
                  需求描述 <i>*</i>
                </span>
                <textarea
                  rows={5}
                  value={desc}
                  onChange={(e) => {
                    setDesc(e.target.value);
                    if (errors.desc) setErrors((x) => ({ ...x, desc: undefined }));
                  }}
                  placeholder="请描述服务场景、交付要求、时间节点等"
                />
                {errors.desc && <em className="svo-error">{errors.desc}</em>}
              </label>

              <div className="svo-field">
                <span>上传附件（非必填）</span>
                <div className="svo-upload">
                  <label className="svo-upload-btn" htmlFor="svo-file">
                    选择文件
                  </label>
                  <input id="svo-file" type="file" onChange={onFile} />
                  {fileName ? (
                    <div className="svo-file-chip">
                      <span>{fileName}</span>
                      <button type="button" onClick={clearFile} aria-label="移除附件">
                        ×
                      </button>
                    </div>
                  ) : (
                    <span className="svo-upload-tip">支持常见办公文件，单文件演示</span>
                  )}
                </div>
              </div>
            </section>

            <section className="svo-card">
              <h2>联系人信息</h2>
              <div className="svo-grid-2">
                <label className="svo-field">
                  <span>
                    联系人姓名 <i>*</i>
                  </span>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value);
                      if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
                    }}
                    placeholder="请输入联系人姓名"
                  />
                  {errors.name && <em className="svo-error">{errors.name}</em>}
                </label>
                <label className="svo-field">
                  <span>
                    联系方式 <i>*</i>
                  </span>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      if (errors.phone) setErrors((x) => ({ ...x, phone: undefined }));
                    }}
                    placeholder="默认注册手机号，可修改"
                    inputMode="tel"
                    maxLength={11}
                  />
                  {errors.phone && <em className="svo-error">{errors.phone}</em>}
                </label>
              </div>
            </section>

            <div className="svo-actions">
              <button
                type="button"
                className="btn btn-ghost-dark"
                onClick={() => navigate(`/services/${service.id}`)}
              >
                返回
              </button>
              <button type="submit" className="btn btn-primary svo-pay-btn">
                去支付
              </button>
            </div>
          </form>

          <aside className="svo-side">
            <div className="svo-summary">
              <div className="svo-summary-cover">
                {cover ? (
                  <img src={publicUrl(cover)} alt="" />
                ) : (
                  <span>{service.categoryL1.slice(0, 2)}</span>
                )}
              </div>
              <h3>{service.name}</h3>
              <p className="svo-summary-shop">{service.shop.name}</p>

              <dl className="svo-summary-dl">
                <div>
                  <dt>服务规格</dt>
                  <dd>{selected.name}</dd>
                </div>
                <div>
                  <dt>数量</dt>
                  <dd>
                    {qty} {selected.unit}
                  </dd>
                </div>
                <div>
                  <dt>履约类型</dt>
                  <dd>{FULFILLMENT_LABEL[selected.fulfillmentType]}</dd>
                </div>
                <div>
                  <dt>交付周期</dt>
                  <dd>{deliverDays}</dd>
                </div>
                <div>
                  <dt>单价</dt>
                  <dd>
                    {formatMoney(selected.price)}/{selected.unit}
                  </dd>
                </div>
                <div>
                  <dt>订单总额</dt>
                  <dd>{formatMoney(total)}</dd>
                </div>
                {installment && pay.mode === "first" && (
                  <div>
                    <dt>首期应付</dt>
                    <dd>
                      {pay.firstPhaseName} · {pay.firstRatio}%
                    </dd>
                  </div>
                )}
              </dl>

              {installment && (
                <div className="svo-pay-hint">分期履约需先支付首笔款，后续按阶段验收后支付。</div>
              )}

              <div className="svo-summary-price">
                <span>{installment ? "待支付（首笔）" : "待支付金额"}</span>
                <strong>{formatMoney(pay.amount)}</strong>
              </div>

              {installment && selected.phases.length > 0 && (
                <ul className="svo-phase-list">
                  {selected.phases.map((p, idx) => (
                    <li key={p.id} className={idx === 0 ? "on" : undefined}>
                      <span>
                        {p.name}
                        {idx === 0 ? "（本次）" : ""}
                      </span>
                      <em>
                        {p.settleRatio}% · {formatMoney(Math.round(((total * p.settleRatio) / 100) * 100) / 100)}
                      </em>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>

      {toast && <div className="svo-toast">{toast}</div>}
    </div>
  );
}
