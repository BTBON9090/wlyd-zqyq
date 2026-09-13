import { Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { demands, finance, news, products, services } from "../data";

const ParkMap = lazy(() =>
  import("../components/ParkMap").then((m) => ({ default: m.ParkMap })),
);

type Props = {
  title: string;
  desc: string;
  kind: "procurement" | "finance" | "services" | "demand" | "map" | "news";
};

export function ModulePage({ title, desc, kind }: Props) {
  return (
    <div className="module-page">
      <div className="container">
        <div className="module-hero">
          <div className="crumb">
            <Link to="/">首页</Link> / {title}
          </div>
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>
        {kind === "procurement" && <Procurement />}
        {kind === "finance" && <Finance />}
        {kind === "services" && <Services />}
        {kind === "demand" && <Demand />}
        {kind === "map" && (
          <Suspense fallback={<div className="map-frame">地图加载中…</div>}>
            <ParkMap />
          </Suspense>
        )}
        {kind === "news" && <News />}
      </div>
    </div>
  );
}

function Procurement() {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>商品</th>
          <th>规格</th>
          <th>协议价</th>
          <th>供应商</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td><b>{p.name}</b> <span className="chip">{p.tag}</span></td>
            <td>{p.spec}</td>
            <td>¥{p.price} / {p.unit}</td>
            <td>{p.supplier}</td>
            <td><Link className="link-more" to="/">加入询价</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Finance() {
  return (
    <div className="fin-grid">
      {finance.map((f) => (
        <div key={f.id} className="fin-card">
          <div className="type">{f.type}</div>
          <h3>{f.name}</h3>
          <p>{f.highlight}</p>
          <div className="mode">{f.mode} · {f.meta}</div>
        </div>
      ))}
    </div>
  );
}

function Services() {
  return (
    <div className="panel">
      {services.map((s) => (
        <div key={s.id} className="svc-item">
          <div style={{ flex: 1 }}>
            <div className="cat">{s.category}</div>
            <h4>{s.name}</h4>
            <div className="muted">{s.desc} · {s.provider}</div>
          </div>
          <b style={{ fontFamily: "var(--serif)", color: "#9a3412" }}>{s.price}</b>
        </div>
      ))}
    </div>
  );
}

function Demand() {
  return (
    <div className="panel">
      {demands.map((d) => (
        <div key={d.id} className="demand-item">
          <div style={{ flex: 1 }}>
            <div className="cat">{d.category}</div>
            <h4>{d.title}</h4>
            <div className="muted">{d.company} · 预算 {d.budget}</div>
          </div>
          <span className="chip">{d.quotes} 家报价</span>
        </div>
      ))}
    </div>
  );
}

function News() {
  return (
    <div className="panel">
      {news.map((n) => (
        <div key={n.id} className="news-item">
          <span className="chip">{n.type}</span>
          <h4 style={{ flex: 1 }}>{n.title}</h4>
          <span className="muted">{n.time}</span>
        </div>
      ))}
    </div>
  );
}
