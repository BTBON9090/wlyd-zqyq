import { Fragment, useEffect, useState } from "react";
import { type UseQueryResult, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Storefront,
  MapPin,
  MagnifyingGlass,
  Package,
} from "@phosphor-icons/react";
import { AdaptiveTabs } from "../../../components/AdaptiveTabs";
import { EmptyState, Modal } from "../../../components/ui";
import { ContentImage } from "../../../components/ContentImage";
import { currency } from "../../../lib/money";
import { ordersGateway } from "./gateway";
import {
  orderStatus,
  orderTotal,
  statusLabels,
  type OrderAction,
  type ProcurementOrder,
} from "./types";
import { ShipmentRecords } from "./ShipmentRecords";
import { Cashier, PaymentReceipt } from "./OrderPayment";
import "./orders.css";
import "./order-detail.css";

const filters = [
  ["all", "全部"],
  ["pending_pay", "待支付"],
  ["pending_ship", "待发货"],
  ["partial", "部分发货"],
  ["shipped", "已发货"],
  ["received", "已签收"],
  ["completed", "已完成"],
  ["cancelled", "已取消"],
] as const;
export default function ProcurementOrders({
  userId,
  query,
}: {
  userId: string;
  query: UseQueryResult<ProcurementOrder[]>;
}) {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [action, setAction] = useState<OrderAction | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const orders = query.data || [];
  const order = orders.find((o) => o.id === params.get("order"));
  const filtered = orders.filter(
    (o) =>
      (filter === "all" || orderStatus(o) === filter) &&
      [o.id, o.supplier, ...o.items.map((i) => `${i.name} ${i.sku}`)]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const open = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("order", id);
    next.delete("payment");
    setParams(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const back = () => {
    const next = new URLSearchParams(params);
    next.delete("order");
    next.delete("payment");
    setParams(next);
  };
  async function runAction() {
    if (!action || busy) return;
    setBusy(true);
    setError("");
    try {
      await ordersGateway.act(userId, action);
      await client.invalidateQueries({
        queryKey: ["procurement-orders", userId],
      });
      setAction(null);
      if (action.type === "simulatePayment") {
        setParams({ order: action.orderId, payment: "success" });
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败，请重试");
    } finally {
      setBusy(false);
    }
  }
  const paymentOrder =
    action?.type === "simulatePayment"
      ? orders.find((o) => o.id === action.orderId)
      : undefined;
  const actionLabel =
    action?.type === "cancel"
      ? "取消订单"
      : action?.type === "receiveBatch"
        ? "批量签收"
        : "确认签收";
  if (query.isPending)
    return (
      <div className="v3-account-loading" role="status">
        正在加载集采订单…
      </div>
    );
  if (query.isError)
    return (
      <EmptyState
        error
        title="订单暂时无法加载"
        description={query.error.message}
        action="重新加载"
        onAction={() => void query.refetch()}
      />
    );
  return (
    <div className="po-workspace">
      {params.get("payment") === "success" && order?.paidAt ? (
        <PaymentReceipt
          order={order}
          detail={() => open(order.id)}
          list={back}
        />
      ) : params.has("order") ? (
        order ? (
          <OrderDetails
            now={now}
            order={order}
            back={back}
            onAction={setAction}
          />
        ) : (
          <div className="po-empty">
            <h2>未找到订单</h2>
            <p>订单不存在或当前账号无权查看。</p>
            <button className="button secondary" onClick={back}>
              返回订单
            </button>
          </div>
        )
      ) : (
        <>
          <div className="v3-account-toolbar" data-list-sticky>
            <AdaptiveTabs
              label="订单状态"
              value={filter}
              onChange={setFilter}
              items={filters.map(([value, label]) => ({
                value,
                label,
                count:
                  value === "all"
                    ? orders.length
                    : orders.filter((o) => orderStatus(o) === value).length,
              }))}
            />
            <form
              className="v3-account-search"
              role="search"
              onSubmit={(e) => e.preventDefault()}
            >
              <label>
                <MagnifyingGlass size={17} />
                <input
                  aria-label="搜索集采订单"
                  placeholder="搜索订单号、商品名称或编码"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  maxLength={100}
                />
              </label>
            </form>
          </div>
          {!filtered.length ? (
            <div className="po-empty">
              <Package size={38} />
              <h2>{orders.length ? "暂无匹配的订单" : "暂无集采订单"}</h2>
              <p>
                {orders.length
                  ? "试试其他状态或关键词。"
                  : "在集采商城选购物资后，可在这里跟进订单。"}
              </p>
              <Link className="button secondary" to="/procurement">
                前往集采商城
              </Link>
            </div>
          ) : (
            <div className="po-list">
              {filtered.map((o) => {
                const remaining = o.paymentDeadline
                  ? Math.max(
                      0,
                      Math.floor((Date.parse(o.paymentDeadline) - now) / 1000),
                    )
                  : null;
                return (
                  <article className="po-card" key={o.id}>
                    <header>
                      <time>{o.created}</time>
                      <span>
                        订单号：<strong>{o.id}</strong>
                      </span>
                      <span className="po-provider">{o.supplier}</span>
                      <span className={`v3-status po-status-${orderStatus(o)}`}>
                        {statusLabels[orderStatus(o)]}
                      </span>
                    </header>
                    <div className="po-card-body">
                      <div className="po-card-product">
                        <Link
                          className="po-product-icon"
                          to={"?order=" + encodeURIComponent(o.id)}
                          aria-label={"查看订单 " + o.id}
                        >
                          <Package size={28} />
                        </Link>
                        <div className="po-card-items">
                          <Link
                            className="po-product-names"
                            to={"?order=" + encodeURIComponent(o.id)}
                            title={o.items.map((item) => item.name).join("、")}
                          >
                            {o.items.map((item) => item.name).join("、")}
                          </Link>
                          {o.items.length === 1 ? (
                            <small className="po-quantity">
                              {o.items[0].quantity} {o.items[0].unit}
                            </small>
                          ) : (
                            <div className="po-items-summary">
                              <button
                                type="button"
                                className="po-count"
                                aria-describedby={`items-${o.id}`}
                              >
                                共 {o.items.length} 种商品
                              </button>
                              <div
                                className="po-items-popover"
                                id={`items-${o.id}`}
                                role="tooltip"
                              >
                                <strong>商品明细</strong>
                                <ul>
                                  {o.items.map((item) => (
                                    <li key={item.id}>
                                      <span>{item.name}</span>
                                      <span>
                                        × {item.quantity} {item.unit}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="po-card-total">
                        <small>商品金额（含税）</small>
                        <strong>{currency(orderTotal(o))}</strong>
                        {o.status === "pending_pay" && (
                          <p className="po-deadline">
                            {remaining === null || !Number.isFinite(remaining)
                              ? "支付截止时间待确认"
                              : remaining === 0
                                ? "支付时间已到"
                                : `剩余支付时间 ${Math.floor(remaining / 3600)}小时${Math.floor((remaining % 3600) / 60)}分${remaining % 60}秒`}
                          </p>
                        )}
                      </div>
                      <div className="po-card-actions">
                        {o.status === "pending_pay" && (
                          <>
                            <PayButton
                              order={o}
                              now={now}
                              onAction={setAction}
                            />
                            <button
                              className="v3-order-text-action"
                              disabled={!__DEMO__}
                              onClick={() =>
                                setAction({ type: "cancel", orderId: o.id })
                              }
                            >
                              取消订单
                            </button>
                          </>
                        )}
                        <button
                          className="v3-order-text-action"
                          onClick={() => open(o.id)}
                        >
                          订单详情
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
      {paymentOrder && (
        <Cashier
          order={paymentOrder}
          busy={busy}
          expired={
            !!paymentOrder.paymentDeadline &&
            Date.parse(paymentOrder.paymentDeadline) <= now
          }
          error={error}
          close={() => {
            setAction(null);
            setError("");
          }}
          confirm={() => void runAction()}
        />
      )}
      <Modal
        open={!!action && action.type !== "simulatePayment"}
        onOpenChange={(v) => {
          if (!v && !busy) {
            setAction(null);
            setError("");
          }
        }}
        title={actionLabel}
      >
        <div className="po-confirm">
          <p>
            {action?.type === "cancel"
              ? "确定取消该订单？取消后将无法支付。"
              : action?.type === "receiveBatch"
                ? "确认已收到所选 " + action.shipmentIds.length + " 批商品？"
                : "确认收到该批次商品？"}
          </p>
          {error && (
            <p role="alert" className="po-error">
              {error}
            </p>
          )}
          <div>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              返回
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => void runAction()}
            >
              {busy
                ? "处理中…"
                : action?.type === "receiveShipment" ||
                    action?.type === "receiveBatch"
                  ? "确认签收"
                  : `确认${actionLabel}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
function PayButton({
  order,
  now,
  onAction,
}: {
  order: ProcurementOrder;
  now: number;
  onAction: (a: OrderAction) => void;
}) {
  const expired =
    !!order.paymentDeadline && Date.parse(order.paymentDeadline) <= now;
  return (
    <button
      className="button primary"
      disabled={expired || !__DEMO__}
      title={
        expired ? "支付时间已到" : !__DEMO__ ? "支付服务尚未接入" : undefined
      }
      onClick={() => onAction({ type: "simulatePayment", orderId: order.id })}
    >
      去支付
    </button>
  );
}
function OrderDetails({
  order,
  back,
  onAction,
  now,
}: {
  order: ProcurementOrder;
  back: () => void;
  onAction: (a: OrderAction) => void;
  now: number;
}) {
  const status = orderStatus(order);
  const seconds = Math.max(0, Math.ceil(
    (Date.parse(order.paymentDeadline || "") - now) / 1000,
  ));
  const [expandedRemarks, setExpandedRemarks] = useState<string[]>([]);
  const pendingPayment = order.status === "pending_pay";
  const phone = order.phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
  return (
    <div className="purchase-detail">
      <header className="order-detail-heading">
        <button className="v3-order-text-action" onClick={back}><ArrowLeft size={18} />返回订单列表</button>
        <h1>订单详情</h1>
      </header>
      <section className="detail-block purchase-summary">
        <header>
          <h2>订单 {order.id}</h2>
          <div className="purchase-meta">
            <time>下单时间 {order.created}</time>
            <span className={`v3-status po-status-${status}`}>
              {statusLabels[status]}
            </span>
          </div>
        </header>
        <div className="purchase-summary-body">
          <div className="purchase-facts">
            <div>
              <Storefront />
              <div>
                <small>供应商</small>
                <strong>{order.supplier || "—"}</strong>
              </div>
            </div>
            <div>
              <MapPin />
              <div>
                <small>收货信息</small>
                <strong>
                  {order.receiver} <span>{phone}</span>
                </strong>
                <p>{order.address}</p>
              </div>
            </div>
            <div className="purchase-order-note">
              <small>订单备注</small>
              <p>{order.note || "无"}</p>
            </div>
          </div>
          <aside className="purchase-settlement">
            <small>含税订单金额</small>
            <strong>{currency(orderTotal(order))}</strong>
            {pendingPayment && (
              <>
                <small className="purchase-countdown">
                  {!Number.isFinite(seconds) ? "支付截止时间待确认" : seconds <= 0 ? "支付时间已到" : <>
                    <span>剩余支付时间</span>
                    <strong>{String(Math.floor(seconds / 3600)).padStart(2, "0")}<i>:</i>{String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}<i>:</i>{String(seconds % 60).padStart(2, "0")}</strong>
                  </>}
                </small>
                <div className="purchase-actions">
                  <button
                    className="button secondary"
                    disabled={!__DEMO__}
                    onClick={() =>
                      onAction({ type: "cancel", orderId: order.id })
                    }
                  >
                    取消订单
                  </button>
                  <PayButton order={order} now={now} onAction={onAction} />
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
      <section className="detail-block purchase-lines">
        <header>
          <h2>商品明细</h2>
          <span>共 {order.items.length} 种商品</span>
        </header>
        <div className="purchase-table-wrap">
          <table>
            <thead>
              <tr>
                <th>商品信息</th>
                <th>订购数量</th>
                <th>已发 / 待发</th>
                <th>含税单价</th>
                <th>含税小计</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <Fragment key={item.id}>
                <tr>
                  <td>
                    <div className="purchase-product">
                      <ContentImage
                        src={item.image}
                        alt={item.name}
                        placeholder=""
                        placeholderIcon={<Package size={22} />}
                      />
                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          {[item.brand, item.model, item.spec]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                        <small>SKU 编码 · {item.sku}</small>
                        {item.remark && (
                          <button className="purchase-remark-toggle" aria-expanded={expandedRemarks.includes(item.id)} onClick={() => setExpandedRemarks(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])}>
                            {expandedRemarks.includes(item.id) ? "▾" : "▸"} 商品备注
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.quantity} {item.unit}
                  </td>
                  <td>
                    {item.shipped} / {Math.max(0, item.quantity - item.shipped)}
                  </td>
                  <td>{currency(item.price)}</td>
                  <td>
                    <b>{currency(item.price * item.quantity)}</b>
                  </td>
                </tr>
                {item.remark && expandedRemarks.includes(item.id) && <tr className="purchase-remark-row"><td colSpan={5}><p>{item.remark}</p></td></tr>}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <ShipmentRecords key={order.id} order={order} onAction={onAction} />
    </div>
  );
}
