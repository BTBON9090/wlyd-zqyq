import { Buildings, Phone } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ContentImage } from "../../components/ContentImage";
import { EllipsisTip } from "../../components/EllipsisTip";
import type { Service } from "../../lib/models";
import { ConsultDialog } from "./ConsultDialog";

/** 缺省封面图标：只保留图片框与山峦，与「暂无宣传图」文字上下组合。 */
function CoverPlaceholderIcon() {
  return (
    <svg
      className="service-cover-placeholder-icon"
      viewBox="0 0 48 48"
      width="38"
      height="38"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="7"
        y="12"
        width="34"
        height="26"
        rx="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <circle cx="17.5" cy="21" r="3.4" fill="currentColor" />
      <path
        d="M10.5 34.5 L20 25.5 L26 31 L31 26.5 L37.5 33"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 金额拆成数字与后缀单位：去掉千分位，斜杠后不留空格。 */
function splitPrice(price: string) {
  const cleaned = price.replace(/,/g, "").replace(/\/\s+/g, "/");
  const matched = cleaned.match(/^([\d.]+)\s*(.*)$/);
  return matched
    ? { amount: matched[1], unit: matched[2] }
    : { amount: cleaned, unit: "" };
}

/** 成交量超过 9999 用「1万+」这类概数，避免卡片里堆长数字。 */
function formatSales(count: number) {
  return count > 9999 ? `${Math.floor(count / 10000)}万+` : String(count);
}

export function ServiceCard({ service }: { service: Service }) {
  const [consulting, setConsulting] = useState(false);
  const [scoreTip, setScoreTip] = useState(false);
  const tipTimer = useRef<number | undefined>(undefined);
  const shop = service.published?.shop;
  const phone = shop?.phone?.trim() || "";
  const { amount, unit } = splitPrice(service.price);
  useEffect(() => () => window.clearTimeout(tipTimer.current), []);
  /** 评分 tips：悬停满 3 秒后出现，键盘聚焦时立即出现。 */
  const openScoreTip = () => {
    window.clearTimeout(tipTimer.current);
    tipTimer.current = window.setTimeout(() => setScoreTip(true), 3000);
  };
  const closeScoreTip = () => {
    window.clearTimeout(tipTimer.current);
    setScoreTip(false);
  };
  return (
    <article className="service-card">
      {/*
        链接包住可点内容，而不是盖一层透明覆盖层：
        覆盖层会让 F12 只能选到空链接，也挡住鼠标选字。
      */}
      <Link
        className="service-card-link"
        to={`/services/${service.id}`}
        aria-label={`查看${service.name}`}
        draggable={false}
      >
        <ContentImage
          className="service-cover"
          src={service.image}
          alt={`${service.name}宣传图`}
          placeholder="暂无宣传图"
          placeholderIcon={<CoverPlaceholderIcon />}
        />
        <div className="service-card-body">
          <div className="card-eyebrow">
            {service.category}
            <span>{service.delivery}</span>
          </div>
          <EllipsisTip as="h3" text={service.name} />
          <EllipsisTip as="p" text={service.desc} />
          <div className="card-tags">
            {service.features.slice(0, 2).map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <div className="card-bottom">
            <span className="price">
              {service.price === "按项报价" ? (
                "按需报价"
              ) : (
                <>
                  <small>¥</small> {amount}
                  {unit && <span className="price-unit">{unit}</span>}
                </>
              )}
            </span>
            {service.published && (
              <>
                <span
                  className="service-sales"
                  aria-label={`成交 ${service.published.salesCount}`}
                >
                  <span className="service-sales-long">成交</span>
                  <span className="service-sales-short">售</span>
                  {formatSales(service.published.salesCount)}
                </span>
                <span
                  className="service-score"
                  onMouseEnter={openScoreTip}
                  onMouseLeave={closeScoreTip}
                >
                  <span
                    className="service-score-text"
                    tabIndex={0}
                    aria-label={`客户评分 ${service.published.rating.toFixed(1)} 分`}
                    onFocus={() => setScoreTip(true)}
                    onBlur={closeScoreTip}
                  >
                    {service.published.rating.toFixed(1)}分
                  </span>
                  {scoreTip && (
                    <span className="service-score-tip" role="tooltip">
                      客户评分
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
      {/* 商家行含按钮，必须放在链接之外，避免按钮嵌在链接里 */}
      <div className="service-card-foot">
        <div className="provider">
          <span className="provider-avatar" aria-hidden="true">
            <Buildings size={14} />
          </span>
          <EllipsisTip className="provider-name" text={service.provider} />
          {phone && (
            <button
              type="button"
              className="service-consult"
              aria-haspopup="dialog"
              onClick={() => setConsulting(true)}
            >
              <Phone size={12} weight="fill" />
              电话
            </button>
          )}
        </div>
      </div>
      {phone && (
        <ConsultDialog
          service={service}
          open={consulting}
          onOpenChange={setConsulting}
        />
      )}
    </article>
  );
}
