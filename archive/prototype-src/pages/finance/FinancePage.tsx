import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  financeCategories,
  financeProducts,
  financeRecords,
  financeValueProps,
  mockBillQuotes,
  type FinanceProduct,
} from "../../data/financeProducts";
import { useRequireLogin } from "../../hooks/useRequireLogin";

type ModalKind = "detail" | "qr" | "bill" | "token" | "toast" | null;

export function FinancePage() {
  const requireLogin = useRequireLogin();
  const [category, setCategory] = useState<(typeof financeCategories)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [active, setActive] = useState<FinanceProduct | null>(null);
  const [toast, setToast] = useState("");
  const [billStep, setBillStep] = useState(0);
  const [billQuotes, setBillQuotes] = useState<typeof mockBillQuotes | null>(null);

  const filtered = useMemo(() => {
    let list = financeProducts;
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.highlight.toLowerCase().includes(q) ||
          p.partner.toLowerCase().includes(q),
      );
    }
    return list;
  }, [category, query]);

  const showToast = (msg: string) => {
    setToast(msg);
    setModal("toast");
    window.setTimeout(() => {
      setModal((m) => (m === "toast" ? null : m));
      setToast("");
    }, 2000);
  };

  const openProduct = (product: FinanceProduct) => {
    requireLogin(() => {
      setActive(product);
      if (product.category === "bill") {
        setBillStep(0);
        setBillQuotes(null);
        setModal("bill");
        return;
      }
      if (product.category === "token" || product.category === "scbill") {
        setModal("token");
        return;
      }
      setModal("detail");
    });
  };

  const primaryAction = (product: FinanceProduct) => {
    requireLogin(() => {
      setActive(product);
      if (product.mode === "扫码跳转") {
        setModal("qr");
        return;
      }
      if (product.category === "bill") {
        setBillStep(0);
        setBillQuotes(null);
        setModal("bill");
        return;
      }
      if (product.category === "token" || product.category === "scbill") {
        setModal("token");
        return;
      }
      setModal("detail");
    });
  };

  const runBillOcr = () => {
    setBillStep(1);
    window.setTimeout(() => {
      setBillQuotes(mockBillQuotes);
      setBillStep(2);
    }, 1200);
  };

  return (
    <div className="fin-page">
      <div className="fin-topbar">
        <div className="container fin-topbar-inner">
          <div className="fin-topbar-links">
            <Link to="/">首页</Link>
            <span className="fin-divider">|</span>
            <button type="button" className="fin-link-btn">我的申请</button>
            <button type="button" className="fin-link-btn">融资记录</button>
            <button type="button" className="fin-link-btn">对账单确认</button>
            <span className="fin-divider">|</span>
            <span className="fin-hotline">万连融客服 400-636-1696</span>
          </div>
        </div>
      </div>

      <div className="container fin-layout">
        <aside className="fin-sidebar">
          <div className="fin-sidebar-head">金融产品分类</div>
          <ul className="fin-cats">
            {financeCategories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={category === c.id ? "on" : ""}
                  onClick={() => setCategory(c.id)}
                >
                  <span className="fin-cat-icon">{c.icon}</span>
                  {c.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="fin-records-panel">
            <strong>
              我的融资
              <Link to="/account/orders/finance" className="fin-rec-more">
                全部
              </Link>
            </strong>
            <ul>
              {financeRecords.map((r) => (
                <li key={r.id}>
                  <div>
                    <span className="fin-rec-type">{r.type}</span>
                    <b>{r.title}</b>
                    <em>{r.time}</em>
                  </div>
                  <div className="fin-rec-meta">
                    <span>{r.amount}</span>
                    <span className={`fin-status fin-status--${r.status.includes("已") ? "ok" : "pending"}`}>
                      {r.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="fin-main">
          <div className="fin-promo">
            <div className="fin-promo-main">
              <div className="fin-promo-kicker">万连融 · 数智金融平台</div>
              <h1>园区产融一体化服务</h1>
              <p>信贷扫码申请 · 银票贴现直连 · 万联通证流转 · 供应链票据背书</p>
              <div className="fin-promo-stats">
                <div><strong>28 亿+</strong><span>平台流转规模</span></div>
                <div><strong>600+</strong><span>服务企业</span></div>
                <div><strong>5 类</strong><span>金融产品矩阵</span></div>
              </div>
            </div>
            <div className="fin-value-grid">
              {financeValueProps.map((v) => (
                <div key={v.title} className="fin-value-item">
                  <strong>{v.title}</strong>
                  <span>{v.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fin-search-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索金融产品 / 合作机构"
            />
            <button type="button" className="btn btn-primary btn-sm">搜索</button>
          </div>

          <div className="fin-toolbar">
            <strong>{financeCategories.find((c) => c.id === category)?.label ?? "全部产品"}</strong>
            <span>共 {filtered.length} 款产品</span>
          </div>

          <div className="fin-product-grid">
            {filtered.map((p) => (
              <article key={p.id} className={`fin-product-card fin-product-card--${p.category}`}>
                <div className="fin-product-head">
                  <span className="fin-product-type">{p.type}</span>
                  <span className="fin-product-mode">{p.mode}</span>
                </div>
                <h3>{p.name}</h3>
                <p>{p.highlight}</p>
                <ul className="fin-product-features">
                  {p.features.slice(0, 3).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="fin-product-foot">
                  <span>{p.partner}</span>
                  {p.rate && <b>{p.rate}</b>}
                </div>
                <div className="fin-product-actions">
                  <button type="button" className="btn btn-ghost-dark btn-sm" onClick={() => openProduct(p)}>
                    了解详情
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => primaryAction(p)}>
                    {p.mode === "扫码跳转" ? "扫码申请" : p.category === "bill" ? "上传评估" : "立即办理"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {modal === "detail" && active && (
        <div className="fin-modal-backdrop" onClick={() => setModal(null)}>
          <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>{active.name}</h3>
              <button type="button" className="fin-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <div className="fin-modal-body">
              <p className="fin-modal-highlight">{active.highlight}</p>
              <dl className="fin-detail-dl">
                <div><dt>合作机构</dt><dd>{active.partner}</dd></div>
                <div><dt>办理方式</dt><dd>{active.mode}</dd></div>
                {active.rate && <div><dt>参考利率</dt><dd>{active.rate}</dd></div>}
                {active.limit && <div><dt>额度范围</dt><dd>{active.limit}</dd></div>}
              </dl>
              <h4>产品特点</h4>
              <ul className="fin-flow-list">
                {active.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <h4>办理流程</h4>
              <ol className="fin-flow-steps">
                {active.flow.map((step, i) => (
                  <li key={step}><b>{i + 1}</b>{step}</li>
                ))}
              </ol>
            </div>
            <footer className="fin-modal-foot">
              <button type="button" className="btn btn-primary" onClick={() => primaryAction(active)}>
                {active.mode === "扫码跳转" ? "扫码申请" : "立即办理"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {modal === "qr" && active && (
        <div className="fin-modal-backdrop" onClick={() => setModal(null)}>
          <div className="fin-modal fin-modal--qr" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>{active.name} · 扫码申请</h3>
              <button type="button" className="fin-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <div className="fin-modal-body fin-qr-body">
              <div className="fin-qr-box">
                <div className="fin-qr-placeholder" aria-hidden />
                <p>请使用手机扫描跳转 {active.partner}</p>
              </div>
              <p className="fin-qr-hint">
                平台不介入资金划转，申请进度将回传至「我的融资」列表（演示环境模拟）。
              </p>
            </div>
            <footer className="fin-modal-foot">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setModal(null);
                  showToast("已模拟跳转机构页面，申请进度可在「我的融资」查看");
                }}
              >
                模拟已完成扫码
              </button>
            </footer>
          </div>
        </div>
      )}

      {modal === "bill" && active && (
        <div className="fin-modal-backdrop" onClick={() => setModal(null)}>
          <div className="fin-modal fin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>银票贴现 · 上传评估</h3>
              <button type="button" className="fin-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <div className="fin-modal-body">
              <ol className="fin-bill-steps">
                {["上传票面", "OCR 识票", "多机构比价", "提交贸背"].map((label, i) => (
                  <li key={label} className={billStep >= i ? "on" : ""}>
                    <b>{i + 1}</b>{label}
                  </li>
                ))}
              </ol>

              {billStep === 0 && (
                <div className="fin-upload-zone">
                  <p>上传银票影像或 PDF，系统将自动 OCR 识别票面信息</p>
                  <button type="button" className="btn btn-outline" onClick={runBillOcr}>
                    选择文件并识票
                  </button>
                </div>
              )}

              {billStep === 1 && (
                <div className="fin-upload-zone">
                  <p className="fin-loading">OCR 识别中…</p>
                </div>
              )}

              {billStep >= 2 && billQuotes && (
                <>
                  <div className="fin-bill-info">
                    <strong>票面金额 ¥2,000,000</strong>
                    <span>到期日 2026-02-18 · 承兑行 工商银行</span>
                  </div>
                  <table className="table fin-quote-table">
                    <thead>
                      <tr>
                        <th>机构</th>
                        <th>贴现利率</th>
                        <th>预估到账</th>
                        <th>到账时效</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {billQuotes.map((q) => (
                        <tr key={q.bank}>
                          <td><b>{q.bank}</b></td>
                          <td>{q.rate}</td>
                          <td className="fin-arrival">{q.arrival}</td>
                          <td>{q.days === 0 ? "当日" : `T+${q.days}`}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setModal(null);
                                showToast(`已选择 ${q.bank}，请提交贸易背景材料`);
                              }}
                            >
                              选择
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {modal === "token" && active && (
        <div className="fin-modal-backdrop" onClick={() => setModal(null)}>
          <div className="fin-modal fin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>{active.name}</h3>
              <button type="button" className="fin-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <div className="fin-modal-body">
              <p className="fin-modal-highlight">{active.highlight}</p>
              <div className="fin-token-flow">
                {active.flow.map((step, i) => (
                  <div key={step} className="fin-token-step">
                    <b>{i + 1}</b>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div className="fin-token-demo">
                <div className="fin-token-card">
                  <span>凭证编号</span>
                  <strong>WLTK-20260819-00128</strong>
                  <span>金额 ¥100,000 · 可拆分 · 可转让</span>
                </div>
              </div>
            </div>
            <footer className="fin-modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => showToast("已发起转让（演示）")}
              >
                转让
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setModal(null);
                  showToast("融资申请已提交，等待机构审核");
                }}
              >
                持证融资
              </button>
            </footer>
          </div>
        </div>
      )}

      {modal === "toast" && toast && <div className="fin-toast">{toast}</div>}
    </div>
  );
}
