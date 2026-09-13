import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Clock,
  FileText,
  Handshake,
  ShieldCheck,
} from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumb } from "../../components/Shell";
import { EmptyState, MediaSlot } from "../../components/ui";
import { gateway } from "../../lib/api";
export default function ServiceDetailPage() {
  const { serviceId = "" } = useParams();
  const query = useQuery({
    queryKey: ["service", serviceId],
    queryFn: ({ signal }) => gateway.service(serviceId, signal),
    retry: false,
  });
  if (query.isPending)
    return (
      <div className="container loading-page" aria-busy="true">
        正在加载服务详情…
      </div>
    );
  if (query.isError)
    return (
      <div className="container">
        <EmptyState
          error
          title="暂时无法查看这项服务"
          description={query.error.message}
          action="重试"
          onAction={() => void query.refetch()}
        />
        <Link className="button secondary" to="/services">
          返回服务大厅
        </Link>
      </div>
    );
  const service = query.data;
  return (
    <div className="container detail-page">
      <Breadcrumb
        items={[
          { label: "企业服务", to: "/services" },
          { label: service.name },
        ]}
      />
      <section className="detail-hero">
        <MediaSlot label={`${service.category}服务展示`} src={service.image} />
        <div className="detail-summary">
          <span className="tag primary-tag">{service.category}</span>
          <h1>{service.name}</h1>
          <p>{service.overview}</p>
          <div className="detail-price">
            <span>参考价格</span>
            <strong>
              {service.price === "按项报价" ? "按需报价" : `¥ ${service.price}`}
            </strong>
            <small>具体费用以沟通确认的方案为准</small>
          </div>
          <div className="detail-facts">
            <span>
              <Clock size={18} />
              参考周期：{service.delivery}
            </span>
            <span>
              <FileText size={18} />
              按确认的范围交付
            </span>
          </div>
          <Link
            className="button primary detail-cta"
            to={`/services/${service.id}/order`}
          >
            申请服务 <ArrowRight size={18} />
          </Link>
          <small className="muted">
            提交需求后由服务商联系，当前无需付款。
          </small>
        </div>
      </section>
      <div className="detail-layout">
        <div>
          <nav className="detail-tabs" aria-label="服务详情目录">
            <a href="#service-content">服务内容</a>
            <a href="#delivery-process">办理流程</a>
            <a href="#service-faq">常见问题</a>
          </nav>
          <section className="detail-section" id="service-content">
            <h2>这项服务能为您做什么</h2>
            <p>{service.overview}</p>
            <div className="deliverables">
              {service.features.map((f, i) => (
                <div key={f}>
                  <span>0{i + 1}</span>
                  <div>
                    <Check size={19} />
                    <h3>{f}</h3>
                  </div>
                </div>
              ))}
            </div>
            <div className="notice">
              <ShieldCheck size={21} />
              <span>
                服务开始前，请与服务商确认工作范围、所需材料、交付标准和费用，避免理解偏差。
              </span>
            </div>
          </section>
          <section className="detail-section" id="delivery-process">
            <h2>办理流程</h2>
            <ol className="detail-process">
              {[
                ["提交需求", "说明具体场景，留下联系方式。"],
                ["沟通与确认", "双方确认方案、费用和交付安排。"],
                ["服务与交付", "按双方约定实施，核对交付成果。"],
              ].map(([title, desc], i) => (
                <li key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="detail-section" id="service-faq">
            <h2>常见问题</h2>
            {[
              [
                "现在需要付款吗？",
                "提交申请不产生付款。服务商与您确认方案后，再按双方正式约定办理后续事项。",
              ],
              [
                "尚未入驻企业，可以申请吗？",
                "您可以先登录个人账号提交咨询需求。涉及企业资质、合同签署等后续事项时，需要完成相应身份核验。",
              ],
              [
                "提交后在哪里查看？",
                "可在企业服务页面的「我的服务申请」查看记录。请保持联系电话畅通，方便服务商联系。",
              ],
            ].map(([q, a]) => (
              <details className="faq" key={q}>
                <summary>
                  {q}
                  <span>+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        </div>
        <aside className="provider-panel">
          <div className="provider-logo">{service.provider.slice(0, 1)}</div>
          <h2>{service.provider}</h2>
          <p>{service.category}服务商</p>
          <div className="provider-separator" />
          <h3>
            <Handshake size={20} />
            与服务商沟通
          </h3>
          <p>描述清楚您的需求，有助于获得更合适的服务方案。</p>
          <Link
            className="button secondary full-width"
            to={`/services/${service.id}/order`}
          >
            提交需求 <ArrowRight size={17} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
