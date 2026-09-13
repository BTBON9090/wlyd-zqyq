import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { financeRecords } from "../../data/financeProducts";

type Tab = "all" | "loan" | "bill" | "token" | "statement";

const tabs: { id: Tab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "loan", label: "我的申请" },
  { id: "bill", label: "融资记录" },
  { id: "statement", label: "对账单" },
];

export function FinanceRecordsPage() {
  const [tab, setTab] = useState<Tab>("all");

  const list = useMemo(() => {
    if (tab === "all") return financeRecords;
    if (tab === "loan") return financeRecords.filter((r) => r.category === "loan" || r.category === "token");
    if (tab === "bill") return financeRecords.filter((r) => r.category === "bill" || r.category === "token");
    return financeRecords.filter((r) => r.category === "statement");
  }, [tab]);

  return (
    <div className="account-panel">
      <div className="account-panel-head account-panel-head--row">
        <div>
          <h1>金融服务记录</h1>
          <p>申请进度 · 融资记录 · 对账单确认</p>
        </div>
        <Link className="link-more" to="/finance">
          进入金融服务 →
        </Link>
      </div>

      <div className="account-tabs">
        {tabs.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <ul className="account-record-list">
        {list.map((r) => (
          <li key={r.id}>
            <div>
              <span className="account-chip">{r.type}</span>
              <b>{r.title}</b>
              <em>{r.time}</em>
            </div>
            <div className="account-record-foot">
              <strong>{r.amount}</strong>
              <span>{r.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
