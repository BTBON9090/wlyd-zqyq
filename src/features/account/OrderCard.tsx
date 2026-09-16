import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Buildings, Clock, Copy, ImageSquare } from "@phosphor-icons/react";
import { ContentImage } from "../../components/ContentImage";
import { currency, orderStatus, type Order } from "./accountData";
import { acceptanceTime, orderAmounts } from "./orderPresentation";

function AcceptanceDeadline({ order }: { order: Order }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (!order.acceptanceDeadline) return null;
  const remaining = acceptanceTime(order.acceptanceDeadline, now);
  return (
    <div className="v3-order-deadline">
      <Clock size={15} />
      {remaining ? (
        <>
          <span>剩余</span>
          <strong>{remaining}</strong>
          {order.autoAccept && <span>自动验收</span>}
        </>
      ) : (
        <span>验收期限已到，正在确认处理结果</span>
      )}
    </div>
  );
}

export function OrderPayment({ order }: { order: Order }) {
  const amounts = orderAmounts(order);
  return (
    <div className="v3-order-payment" style={{ paddingRight: 20 }}>
      <dl>
        <div>
          <dt>订单总价</dt>
          <dd>{currency(order.total)}</dd>
        </div>
        {!!order.discount && (
          <div>
            <dt>优惠减免</dt>
            <dd>−{currency(order.discount)}</dd>
          </div>
        )}
        <div>
          <dt>优惠后金额</dt>
          <dd>{currency(amounts.payable)}</dd>
        </div>
        <div className="v3-paid-row">
          <dt>实付款</dt>
          <dd>{currency(order.paid)}</dd>
        </div>
      </dl>
      <div className="v3-payment-state">
        <span>{amounts.paymentLabel}</span>
        {amounts.remaining > 0 && order.status !== "closed" && (
          <span>待付 {currency(amounts.remaining)}</span>
        )}
      </div>
      {!!order.payments?.length && (
        <p className="v3-payment-stages">
          {order.payments
            .map((p) => `${p.label} ${currency(p.amount)}`)
            .join(" · ")}
        </p>
      )}
      {order.refunded > 0 && (
        <div className="v3-payment-refund">
          <span>已退 {currency(order.refunded)}</span>
          <span>净支付 {currency(amounts.netPaid)}</span>
        </div>
      )}
    </div>
  );
}

export function OrderCard({
  order,
  canRefund,
  canInvoice,
  onCopy,
  onDetails,
  onAccept,
  onInvoice,
  onRefund,
}: {
  order: Order;
  canRefund: boolean;
  canInvoice: boolean;
  onCopy: () => void;
  onDetails: () => void;
  onAccept: () => void;
  onInvoice: () => void;
  onRefund: () => void;
}) {
  const hasPrimary =
    order.status === "accepting" ||
    (order.status === "completed" && canInvoice) ||
    order.status === "serving" ||
    order.status === "signing";
  return (
    <article className="v3-order-card">
      <header>
        <div className="v3-order-header-meta">
          <time>{order.createdAt}</time>
          <span className="v3-order-number">订单号：{order.id}<button aria-label={`复制订单编号 ${order.id}`} onClick={onCopy}><Copy size={14} /></button></span>
          <span className="v3-order-provider" title={order.provider}><Buildings size={16} /><span>{order.provider}</span></span>
        </div>
        <div className="v3-order-state">
          {order.status === "accepting" && order.acceptanceDeadline && <AcceptanceDeadline order={order} />}
          <span className={`v3-status v3-status-${order.status}`}>
            {orderStatus[order.status]}
          </span>
          {order.refunded > 0 && (
            <span className="v3-order-refund-label">
              {order.refunded >= order.paid ? "全额退款" : "部分退款"}
            </span>
          )}
        </div>
      </header>
      <div className="v3-order-body">
        <Link to={`/services/${order.serviceId}`} className="v3-order-product" style={{ paddingRight: 20 }}>
          <ContentImage
            src={order.image}
            alt={order.name}
            placeholder=""
            placeholderIcon={<ImageSquare size={30} aria-label="暂无服务图片" role="img" />}
          />
          <div className="v3-order-description">
            <h2>{order.name}</h2>
            <span className="v3-order-fulfillment">
              {order.paymentMode === "installments"
                ? "分期支付"
                : order.paymentMode === "once"
                  ? "一次支付"
                  : "按约定支付"}{" "}
              · {order.phases > 1 ? "阶段验收" : "一次验收"}
            </span>
            <dl>
              <div>
                <dt>服务规格</dt>
                <dd>{order.spec}</dd>
              </div>
              <div>
                <dt>交付周期</dt>
                <dd>
                  {order.deliveryDays
                    ? `${order.deliveryDays} 个自然日`
                    : "沟通确认"}
                  <span>共 {order.phases} 个阶段</span>
                </dd>
              </div>
            </dl>
          </div>
        </Link>
        <div className="v3-order-unit" style={{ paddingRight: 20 }}><strong>{currency(order.total / order.quantity)}</strong><span>× {order.quantity}</span></div>
        <OrderPayment order={order} />
        <div className="v3-order-actions">
          {hasPrimary && (
            <button
              className="button primary"
              onClick={
                order.status === "accepting"
                  ? onAccept
                  : order.status === "completed"
                    ? onInvoice
                    : onDetails
              }
            >
              {order.status === "accepting"
                ? "确认验收"
                : order.status === "completed"
                  ? "申请开票"
                  : order.status === "serving"
                    ? "查看进度"
                    : "签约信息"}
            </button>
          )}
          <button
            className={`v3-order-text-action${!hasPrimary ? " is-leading" : ""}`}
            onClick={onDetails}
          >
            订单详情
          </button>
          {canRefund && (
            <button
              className="v3-order-text-action is-muted"
              onClick={onRefund}
            >
              申请退款
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
