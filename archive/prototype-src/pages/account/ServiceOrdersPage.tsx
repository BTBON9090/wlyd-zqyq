import { useState } from "react";
import { Link } from "react-router-dom";
import { serviceOrders } from "../../data/enterpriseServices";

export function ServiceOrdersPage() {
  const [active, setActive] = useState<(typeof serviceOrders)[number] | null>(null);

  return (
    <div className="account-panel">
      <div className="account-panel-head account-panel-head--row">
        <div>
          <h1>企业服务订单</h1>
          <p>严选服务履约与里程碑节点</p>
        </div>
        <Link className="link-more" to="/services/hall">
          进入服务大厅 →
        </Link>
      </div>

      <ul className="account-record-list">
        {serviceOrders.map((o) => (
          <li key={o.id}>
            <div>
              <b>{o.name}</b>
              <em>
                {o.node} · {o.time}
              </em>
            </div>
            <div className="account-record-foot">
              <span className="account-chip">{o.status}</span>
              <button type="button" className="btn btn-ghost-dark btn-sm" onClick={() => setActive(o)}>
                详情
              </button>
            </div>
          </li>
        ))}
      </ul>

      {active && (
        <div className="account-modal" role="dialog">
          <div className="account-modal-card">
            <h3>{active.name}</h3>
            <dl className="account-detail-dl">
              <div><dt>状态</dt><dd>{active.status}</dd></div>
              <div><dt>当前节点</dt><dd>{active.node}</dd></div>
              <div><dt>更新时间</dt><dd>{active.time}</dd></div>
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
