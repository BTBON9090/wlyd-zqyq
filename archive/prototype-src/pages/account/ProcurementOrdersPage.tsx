import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { orderTabs, procurementOrders, type ProcurementOrder } from "../../data/procurement";

export function ProcurementOrdersPage() {
  const [tab, setTab] = useState<"mall" | "contract" | "rfq">("mall");
  const [active, setActive] = useState<ProcurementOrder | null>(null);

  const list = useMemo(() => procurementOrders.filter((o) => o.tab === tab), [tab]);

  return (
    <div className="account-panel">
      <div className="account-panel-head account-panel-head--row">
        <div>
          <h1>集采订单</h1>
          <p>电商 / 协议 / 询价单据汇总</p>
        </div>
        <Link className="link-more" to="/procurement">
          进入集采商城 →
        </Link>
      </div>

      <div className="account-tabs">
        {orderTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "on" : ""}
            onClick={() => setTab(t.id as typeof tab)}
          >
            {t.label}
            <em>{procurementOrders.filter((o) => o.tab === t.id).length}</em>
          </button>
        ))}
      </div>

      <div className="account-table-wrap">
        <table className="account-table">
          <thead>
            <tr>
              <th>单号</th>
              <th>内容</th>
              <th>供应商</th>
              <th>金额</th>
              <th>状态</th>
              <th>时间</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.title}</td>
                <td>{o.supplier}</td>
                <td>{o.amount}</td>
                <td>
                  <span className="account-chip">{o.status}</span>
                </td>
                <td>{o.time}</td>
                <td>
                  <button type="button" className="btn btn-ghost-dark btn-sm" onClick={() => setActive(o)}>
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active && (
        <div className="account-modal" role="dialog">
          <div className="account-modal-card">
            <h3>订单详情 · {active.id}</h3>
            <dl className="account-detail-dl">
              <div><dt>内容</dt><dd>{active.title}</dd></div>
              <div><dt>供应商</dt><dd>{active.supplier}</dd></div>
              <div><dt>金额</dt><dd>{active.amount}</dd></div>
              <div><dt>状态</dt><dd>{active.status}</dd></div>
              <div><dt>时间</dt><dd>{active.time}</dd></div>
            </dl>
            <div className="account-modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setActive(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
