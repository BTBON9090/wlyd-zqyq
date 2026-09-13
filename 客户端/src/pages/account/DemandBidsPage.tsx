import { Link } from "react-router-dom";
import { myDemandBids } from "../../data/demands";

export function DemandBidsPage() {
  return (
    <div className="account-panel">
      <div className="account-panel-head account-panel-head--row">
        <div>
          <h1>接单记录</h1>
          <p>我的报价与中标进度</p>
        </div>
        <Link className="link-more" to="/demand">
          进入需求大厅 →
        </Link>
      </div>

      <ul className="account-record-list">
        {myDemandBids.map((b) => (
          <li key={b.id}>
            <div>
              <b>{b.demandTitle}</b>
              <em>{b.time}</em>
            </div>
            <div className="account-record-foot">
              <strong>{b.amount}</strong>
              <span className="account-chip">{b.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
