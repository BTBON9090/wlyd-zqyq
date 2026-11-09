import { UAT } from "../../../uat/api";
import { useState } from "react";
import { Buildings } from "@phosphor-icons/react";
import { Modal } from "../../../components/ui";
import { SHARED_PROCUREMENT } from "../sharedApi";
import { currency } from "../../../lib/money";
import { orderTotal, type ProcurementOrder } from "./types";
import { OrderStateIcon } from "./OrderStateIcon";

export function Cashier({
  order,
  busy,
  expired,
  error,
  close,
  confirm,
}: {
  order: ProcurementOrder;
  busy: boolean;
  expired: boolean;
  error: string;
  close: () => void;
  confirm: () => void;
}) {
  const [help, setHelp] = useState(false);
  return (
    <Modal
      open
      title="平台收银台"
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <div className="purchase-cashier">
        <p className="cashier-order">订单 {order.id}</p>
        <div className="cashier-amount">
          <small>应付金额</small>
          <strong>{currency(orderTotal(order))}</strong>
        </div>
        <fieldset>
          <legend>支付方式</legend>
          <label>
            <Buildings size={19} />
            {UAT ? "UAT 模拟支付" : SHARED_PROCUREMENT ? "模拟企业支付" : "企业在线支付"}
            <input type="radio" name="payment-method" defaultChecked />
          </label>
        </fieldset>
        <small>{UAT ? "UAT 模拟支付，不会实际扣款。" : "演示支付，不会实际扣款。"}</small>
        {help && (
          <p role="status" className="cashier-help">
            可先选择“稍后支付”，再从待支付订单重新打开收银台。支付超时后请重新下单。
          </p>
        )}
        {(error || expired) && (
          <div className="po-error order-action-error" role="alert">
            <OrderStateIcon state={error ? "error" : "pending"} compact />
            <p>{error || "支付时间已到，请重新下单。"}</p>
          </div>
        )}
        <footer>
          <button
            className="po-text-button"
            aria-expanded={help}
            onClick={() => setHelp(!help)}
          >
            支付遇到问题
          </button>
          <button className="button secondary" disabled={busy} onClick={close}>
            稍后支付
          </button>
          <button
            className="button primary"
            disabled={busy || expired}
            onClick={confirm}
          >
            {busy ? "支付中…" : "确认支付"}
          </button>
        </footer>
      </div>
    </Modal>
  );
}

export function PaymentReceipt({
  order,
  detail,
  list,
}: {
  order: ProcurementOrder;
  detail: () => void;
  list: () => void;
}) {
  return (
    <section className="detail-block purchase-receipt">
      <OrderStateIcon state="success" />
      <h2>{UAT ? "UAT 模拟支付成功" : SHARED_PROCUREMENT ? "模拟支付成功" : "支付成功"}</h2>
      <p className="purchase-receipt-amount">
        已支付 <strong>{currency(orderTotal(order))}</strong>
      </p>
      <dl>
        {[
          ["订单号", order.id],
          ["支付方式", UAT ? "UAT 模拟支付" : SHARED_PROCUREMENT ? "模拟企业支付" : "企业在线支付"],
          ["支付时间", order.paidAt],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <footer>
        <button className="button secondary" onClick={list}>
          返回订单列表
        </button>
        <button className="button primary" onClick={detail}>
          查看订单详情
        </button>
      </footer>
    </section>
  );
}
