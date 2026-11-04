import { useState } from "react";
import { Truck } from "@phosphor-icons/react";
import type { ProcurementOrder, OrderAction } from "./types";

export function ShipmentRecords({
  order,
  onAction,
}: {
  order: ProcurementOrder;
  onAction: (action: OrderAction) => void;
}) {
  const [checked, setChecked] = useState<string[]>([]);
  const canReceive =
    __DEMO__ && ["shipped", "pending_ship"].includes(order.status);
  const available = canReceive
    ? order.shipments.filter((s) => !s.received).map((s) => s.id)
    : [];
  const selected = available.filter((id) => checked.includes(id));
  const allSelected =
    available.length > 0 && selected.length === available.length;
  function toggle(id: string) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }
  return (
    <section className="detail-block purchase-dispatch">
      <header>
        <h2>
          <Truck size={19} />
          发货记录 <small>（{order.shipments.length} 批）</small>
        </h2>
        {available.length > 0 && (
          <div className="dispatch-actions">
            <button
              className="po-text-button"
              onClick={() => setChecked(allSelected ? [] : available)}
            >
              {allSelected ? "取消全选" : "全选未签收批次"}
            </button>
            <button
              className="button primary"
              disabled={!selected.length}
              onClick={() =>
                onAction({
                  type: "receiveBatch",
                  orderId: order.id,
                  shipmentIds: selected,
                })
              }
            >
              批量签收（{selected.length}）
            </button>
          </div>
        )}
      </header>
      {!order.shipments.length && (
        <p className="purchase-no-shipment">
          <Truck size={20} />
          暂无发货记录
        </p>
      )}
      {order.shipments.map((shipment, index) => (
        <article className="purchase-batch" key={shipment.id}>
          <header>
            {available.includes(shipment.id) && (
              <input
                type="checkbox"
                aria-label={`选择第 ${index + 1} 批发货`}
                checked={selected.includes(shipment.id)}
                onChange={() => toggle(shipment.id)}
              />
            )}
            <h3>
              第 {index + 1} 次发货 · {shipment.company || "承运物流"}
            </h3>
            <span
              className={`v3-status ${shipment.received ? "v3-status-completed" : "po-status-shipped"}`}
            >
              {shipment.received ? "已签收" : "已发货"}
            </span>
            {available.includes(shipment.id) && (
              <button
                className="button secondary"
                onClick={() =>
                  onAction({
                    type: "receiveShipment",
                    orderId: order.id,
                    shipmentId: shipment.id,
                  })
                }
              >
                确认签收
              </button>
            )}
          </header>
          <dl>
            <div>
              <dt>运单号</dt>
              <dd>{shipment.tracking || "—"}</dd>
            </div>
            <div>
              <dt>发货时间</dt>
              <dd>{shipment.time}</dd>
            </div>
            {!shipment.received && shipment.autoReceiveAt && (
              <div>
                <dt>自动签收时间</dt>
                <dd>{shipment.autoReceiveAt}</dd>
              </div>
            )}
          </dl>
          <div className="dispatch-lines">
            <small>本次发货商品</small>
            <ul>
              {shipment.lines.map((line, i) => {
                const item = order.items.find((x) => x.id === line.itemId);
                return (
                  <li key={i}>
                    <div>
                      <strong>{item?.name || "商品"}</strong>
                      {item?.sku && <small>SKU · {item.sku}</small>}
                    </div>
                    <b>
                      {line.quantity} {item?.unit}
                    </b>
                  </li>
                );
              })}
            </ul>
          </div>
        </article>
      ))}
    </section>
  );
}
