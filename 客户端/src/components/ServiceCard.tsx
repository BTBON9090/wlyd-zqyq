import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { EnterpriseService } from "../data/enterpriseServices";
import { getPublishedService, minVersionPrice } from "../data/publishedServices";
import { publicUrl } from "../utils/publicUrl";
import { ServiceCover } from "./ServiceCover";

function formatSales(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  return String(n);
}

type Props = {
  service: EnterpriseService;
  /** 大厅展示三级类目路径 */
  showPath?: boolean;
};

export function ServiceCard({ service, showPath }: Props) {
  const navigate = useNavigate();
  const [phoneOpen, setPhoneOpen] = useState(false);
  const published = getPublishedService(service.id);
  const shopName = published?.shop.name ?? service.provider;
  const phone = published?.shop.phone ?? "400-000-0000";
  const logoUrl = published?.shop.logoUrl;
  const telHref = `tel:${phone.replace(/-/g, "")}`;
  const rating = published?.rating ?? service.rating;
  const sales = published?.salesCount ?? service.salesCount;
  const path = published
    ? `${published.categoryL1} / ${published.categoryL2} / ${published.categoryL3}`
    : `${service.category} / ${service.categoryL2} / ${service.categoryL3}`;
  const lead = published ? minVersionPrice(published) : null;
  const priceText = lead
    ? published!.versions.some((v) => v.price !== lead.price)
      ? `${lead.price.toLocaleString("zh-CN")} 起`
      : `${lead.price.toLocaleString("zh-CN")} / ${lead.unit}`
    : service.price;

  const goDetail = () => navigate(`/services/${service.id}`);

  const onCardKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goDetail();
    }
  };

  const openPhone = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhoneOpen(true);
  };

  return (
    <>
      <article
        className="svc-card"
        role="link"
        tabIndex={0}
        onClick={goDetail}
        onKeyDown={onCardKey}
      >
        <ServiceCover service={service} />
        <div className="svc-card-body">
          {showPath && <div className="svc-card-path">{path}</div>}
          <h3>{service.name}</h3>
          <div className="svc-card-meta-row">
            <span className="svc-card-provider">{shopName}</span>
            <span className="svc-card-score" title="客户评分">
              <i aria-hidden>★</i>
              {rating.toFixed(1)}
            </span>
          </div>
          <div className="svc-card-stats">
            <span>销量 {formatSales(sales)}</span>
          </div>
          <div className="svc-card-foot">
            <span className="svc-card-price">
              <em>¥</em> {priceText}
            </span>
            <button type="button" className="svc-card-phone" onClick={openPhone}>
              电话咨询
            </button>
          </div>
        </div>
      </article>

      {phoneOpen && (
        <div
          className="svd-modal-backdrop"
          onClick={() => setPhoneOpen(false)}
          role="presentation"
        >
          <div
            className="svd-modal svd-modal--phone"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby={`svc-phone-${service.id}`}
          >
            <button
              type="button"
              className="svd-modal-close svd-modal-close--float"
              onClick={() => setPhoneOpen(false)}
              aria-label="关闭"
            >
              ×
            </button>
            <div className="svd-phone-card">
              <div className="svd-phone-logo">
                {logoUrl ? <img src={publicUrl(logoUrl)} alt="" /> : <span>{shopName.slice(0, 1)}</span>}
              </div>
              <div id={`svc-phone-${service.id}`} className="svd-phone-shop">
                {shopName}
              </div>
              <p className="svd-phone-label">电话咨询</p>
              <a className="svd-phone-num" href={telHref}>
                {phone}
              </a>
              <a className="svd-phone-call" href={telHref}>
                立即拨打
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
