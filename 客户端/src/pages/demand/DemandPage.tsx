import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmployerSideShell } from "../../components/EmployerSideNav";
import {
  demandBudgetFilters,
  demandCategoryFilters,
  demandPeriodFilters,
  demandPosts,
  myDemandBids,
  type DemandPost,
} from "../../data/demands";
import { useRequireLogin } from "../../hooks/useRequireLogin";

const PAGE_SIZE = 8;

type ModalKind = "detail" | "bid" | "publish" | "toast" | null;

export function DemandPage() {
  const requireLogin = useRequireLogin();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [period, setPeriod] = useState("all");
  const [budget, setBudget] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalKind>(null);
  const [active, setActive] = useState<DemandPost | null>(null);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => {
    let list = demandPosts;
    if (category !== "all") {
      list = list.filter((d) => d.category === category);
    }
    if (period !== "all") {
      const pf = demandPeriodFilters.find((f) => f.id === period);
      if (pf && "maxDays" in pf) {
        if (period === "short") list = list.filter((d) => d.periodDays <= 7);
        else if (period === "medium") list = list.filter((d) => d.periodDays > 7 && d.periodDays <= 30);
        else list = list.filter((d) => d.periodDays > 30);
      }
    }
    if (budget !== "all") {
      const bf = demandBudgetFilters.find((f) => f.id === budget);
      if (bf && bf.id !== "all") {
        list = list.filter((d) => {
          const mid = (d.budgetMin + d.budgetMax) / 2;
          if (bf.min != null && mid < bf.min) return false;
          if (bf.max != null && mid > bf.max) return false;
          return true;
        });
      }
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [category, period, budget, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showToast = (msg: string) => {
    setToast(msg);
    setModal("toast");
    window.setTimeout(() => {
      setModal((m) => (m === "toast" ? null : m));
      setToast("");
    }, 2000);
  };

  const takeOrder = (demand: DemandPost) => {
    requireLogin(() => {
      setActive(demand);
      setModal("bid");
    });
  };

  const openDemand = (demand: DemandPost) => {
    requireLogin(() => {
      setActive(demand);
      setModal("detail");
    });
  };

  return (
    <div className="demand-page">
      <div className="demand-topbar">
        <div className="container demand-topbar-inner">
          <div className="demand-topbar-links">
            <Link to="/">首页</Link>
            <span className="demand-divider">|</span>
            <Link to="/services/hall">服务大厅</Link>
            <button type="button" className="demand-link-btn" onClick={() => requireLogin(() => setModal("publish"))}>
              发布需求
            </button>
            <span className="demand-divider">|</span>
            <span className="demand-hotline">官方客服 400-998-9988</span>
          </div>
        </div>
      </div>

      <div className="container demand-layout">
        <EmployerSideShell
          footer={
            <div className="demand-bids-panel">
              <strong>
                我的接单
                <Link to="/account/orders/demand" className="demand-bid-more">
                  全部
                </Link>
              </strong>
              <ul>
                {myDemandBids.map((b) => (
                  <li key={b.id}>
                    <b>{b.demandTitle}</b>
                    <div className="demand-bid-meta">
                      <span>{b.amount}</span>
                      <em className={`demand-status demand-status--${b.status === "已中标" ? "ok" : "pending"}`}>
                        {b.status}
                      </em>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          }
        />

        <div className="demand-main">
          <div className="demand-search-row">
            <select className="demand-search-type" defaultValue="demand" aria-label="搜索类型">
              <option value="demand">需求</option>
              <option value="service">服务</option>
            </select>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="输入搜索内容…"
            />
            <button type="button" className="btn btn-primary btn-sm">搜索</button>
          </div>

          <div className="demand-head-row">
            <h1>需求大厅</h1>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => requireLogin(() => setModal("publish"))}>
              + 发布需求
            </button>
          </div>

          <div className="demand-filters">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              {demandCategoryFilters.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
            >
              {demandPeriodFilters.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            <select
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value);
                setPage(1);
              }}
            >
              {demandBudgetFilters.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            <span className="demand-filter-count">共 {filtered.length} 条需求</span>
          </div>

          {pageItems.length === 0 ? (
            <div className="demand-empty">
              <p>暂无匹配需求</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setPeriod("all");
                  setBudget("all");
                  setPage(1);
                }}
              >
                清除筛选
              </button>
            </div>
          ) : (
            <div className="demand-grid">
              {pageItems.map((d) => (
                <article key={d.id} className="demand-card">
                  <h3>
                    <button type="button" className="demand-card-title" onClick={() => openDemand(d)}>
                      {d.title}
                    </button>
                  </h3>
                  <div className="demand-card-tags">
                    {d.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className="demand-card-budget">{d.budgetLabel}</div>
                  <p>{d.summary}</p>
                  <footer>
                    <span>{d.period}</span>
                    <span className="demand-card-date">🕐 {d.publishedAt}</span>
                  </footer>
                  <button type="button" className="btn btn-primary btn-sm demand-card-btn" onClick={() => takeOrder(d)}>
                    立即接单
                  </button>
                </article>
              ))}
            </div>
          )}

          {filtered.length > PAGE_SIZE && (
            <div className="demand-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n === page ? "on" : ""}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                下一页
              </button>
            </div>
          )}
        </div>
      </div>

      {modal === "detail" && active && (
        <div className="demand-modal-backdrop" onClick={() => setModal(null)}>
          <div className="demand-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>{active.title}</h3>
              <button type="button" className="demand-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <div className="demand-modal-body">
              <div className="demand-card-budget">{active.budgetLabel}</div>
              <div className="demand-card-tags">
                {active.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <p>{active.summary}</p>
              <dl className="demand-detail-dl">
                <div><dt>发布企业</dt><dd>{active.company}</dd></div>
                <div><dt>项目周期</dt><dd>{active.period.replace("项目周期：", "")}</dd></div>
                <div><dt>发布时间</dt><dd>{active.publishedAt}</dd></div>
                <div><dt>当前报价</dt><dd>{active.quotes} 家服务商已报价</dd></div>
              </dl>
            </div>
            <footer className="demand-modal-foot">
              <button type="button" className="btn btn-primary" onClick={() => takeOrder(active)}>
                立即接单
              </button>
            </footer>
          </div>
        </div>
      )}

      {modal === "bid" && active && (
        <div className="demand-modal-backdrop" onClick={() => setModal(null)}>
          <div className="demand-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>提交报价 · {active.title}</h3>
              <button type="button" className="demand-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <form
              className="demand-form"
              onSubmit={(e) => {
                e.preventDefault();
                setModal(null);
                showToast("报价已提交，等待雇主选标");
              }}
            >
              <label>
                <span>报价金额</span>
                <input required placeholder="如 800 元 / 月 或 9800 元包干" />
              </label>
              <label>
                <span>交付说明</span>
                <textarea required rows={3} placeholder="说明交付周期、服务范围与优势" />
              </label>
              <label>
                <span>联系方式</span>
                <input required placeholder="手机号或邮箱" />
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost-dark" onClick={() => setModal(null)}>取消</button>
                <button type="submit" className="btn btn-primary">提交报价</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "publish" && (
        <div className="demand-modal-backdrop" onClick={() => setModal(null)}>
          <div className="demand-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>发布需求</h3>
              <button type="button" className="demand-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <form
              className="demand-form"
              onSubmit={(e) => {
                e.preventDefault();
                setModal(null);
                showToast("需求已发布至需求大厅");
              }}
            >
              <label>
                <span>需求标题</span>
                <input required placeholder="如：小规模纳税人代记账服务" />
              </label>
              <label>
                <span>服务类目</span>
                <select required defaultValue="finance_tax">
                  {demandCategoryFilters.filter((f) => f.id !== "all").map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>预算范围</span>
                <input required placeholder="如 1,000 ~ 5,000 元" />
              </label>
              <label>
                <span>详细描述</span>
                <textarea required rows={4} placeholder="交付周期、服务地区、资质要求等" />
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost-dark" onClick={() => setModal(null)}>取消</button>
                <button type="submit" className="btn btn-primary">发布需求</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "toast" && toast && <div className="demand-toast">{toast}</div>}
    </div>
  );
}
