import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  industryArticles,
  matchedPolicies,
  newsCategoryFilters,
  newsTopics,
  newsValueProps,
  parkEvents,
  policyDeadlines,
  policyLevelFilters,
  type IndustryArticle,
  type NewsCategory,
  type ParkEvent,
  type PolicyItem,
} from "../../data/industryNews";
import { useRequireLogin } from "../../hooks/useRequireLogin";

type TabId = "recommend" | NewsCategory;
type ModalKind = "article" | "policy" | "event" | "ai" | "subscribe" | "toast" | null;

const PAGE_SIZE = 8;

const tabItems: { id: TabId; label: string }[] = [
  { id: "recommend", label: "推荐" },
  { id: "policy", label: "政策速递" },
  { id: "notice", label: "园区公告" },
  { id: "industry", label: "行业动态" },
  { id: "event", label: "活动沙龙" },
  { id: "report", label: "研报洞察" },
];

export function NewsPage() {
  const requireLogin = useRequireLogin();
  const [tab, setTab] = useState<TabId>("recommend");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const [page, setPage] = useState(1);
  const [topics, setTopics] = useState(newsTopics);
  const [bookmarks, setBookmarks] = useState<string[]>(["a1", "pol2"]);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeArticle, setActiveArticle] = useState<IndustryArticle | null>(null);
  const [activePolicy, setActivePolicy] = useState<PolicyItem | null>(null);
  const [activeEvent, setActiveEvent] = useState<ParkEvent | null>(null);
  const [toast, setToast] = useState("");
  const [aiInput, setAiInput] = useState("");

  const featured = industryArticles.find((a) => a.featured) ?? industryArticles[0];

  const filteredArticles = useMemo(() => {
    let list = industryArticles;
    if (tab !== "recommend") {
      list = list.filter((a) => a.category === tab);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [tab, query]);

  const filteredPolicies = useMemo(() => {
    let list = matchedPolicies;
    if (level !== "all") {
      list = list.filter((p) => p.level === level);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => b.matchScore - a.matchScore);
  }, [level, query]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const pageItems = filteredArticles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showToast = (msg: string) => {
    setToast(msg);
    setModal("toast");
    window.setTimeout(() => {
      setModal((m) => (m === "toast" ? null : m));
      setToast("");
    }, 2200);
  };

  const toggleBookmark = (id: string) => {
    requireLogin(() => {
      setBookmarks((prev) =>
        prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
      );
      showToast(bookmarks.includes(id) ? "已取消收藏" : "已加入我的收藏");
    });
  };

  const registerEvent = (event: ParkEvent) => {
    requireLogin(() => {
      setRegisteredEvents((prev) => [...prev, event.id]);
      setActiveEvent(null);
      setModal(null);
      showToast("报名成功，电子凭证已推送至工作台");
    });
  };

  const openArticle = (article: IndustryArticle) => {
    requireLogin(() => {
      setActiveArticle(article);
      setModal("article");
    });
  };

  const openPolicy = (policy: PolicyItem) => {
    requireLogin(() => {
      setActivePolicy(policy);
      setModal("policy");
    });
  };

  const openEvent = (event: ParkEvent) => {
    requireLogin(() => {
      setActiveEvent(event);
      setModal("event");
    });
  };

  const submitAi = () => {
    if (!aiInput.trim()) return;
    showToast("AI 已解析问题，正在生成政策解读与申报路径…");
    setAiInput("");
    setModal(null);
  };

  const toggleTopic = (id: string) => {
    requireLogin(() => {
      setTopics((prev) =>
        prev.map((t) => (t.id === id ? { ...t, on: !t.on } : t)),
      );
      showToast("订阅偏好已更新");
    });
  };

  return (
    <div className="news-page">
      <div className="news-topbar">
        <div className="container news-topbar-inner">
          <div className="news-topbar-links">
            <Link to="/">首页</Link>
            <span className="news-divider">|</span>
            <button type="button" className="news-link-btn" onClick={() => requireLogin(() => setModal("subscribe"))}>
              我的订阅
            </button>
            <button type="button" className="news-link-btn" onClick={() => requireLogin(() => setModal("ai"))}>
              AI 政策解读
            </button>
            <Link to="/services" className="news-link-btn">企服申报辅导</Link>
            <span className="news-divider">|</span>
            <span className="news-hotline">政策咨询 400-998-9988</span>
          </div>
        </div>
      </div>

      <div className="news-hero">
        <div className="container news-hero-inner">
          <div className="news-hero-copy">
            <span className="news-hero-kicker">产业资讯 · 政策优先</span>
            <h1>政策精准匹配 & 园区情报中心</h1>
            <p>基于企业画像智能推荐可申报政策，实时推送园区公告、行业动态与活动沙龙。</p>
            <div className="news-hero-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => requireLogin(() => setModal("ai"))}>
                AI 政策计算器
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab("policy")}>
                查看政策速递
              </button>
            </div>
          </div>
          <button
            type="button"
            className={`news-featured news-featured--${featured.coverTone ?? "p1"}`}
            onClick={() => openArticle(featured)}
          >
            {featured.urgent && <span className="news-urgent-badge">紧急</span>}
            <span className="news-featured-type">{featured.typeLabel}</span>
            <strong>{featured.title}</strong>
            <p>{featured.summary}</p>
            <em>{featured.timeLabel} · {featured.readCount.toLocaleString()} 阅读</em>
          </button>
        </div>
      </div>

      <div className="container news-value-row">
        {newsValueProps.map((v) => (
          <div key={v.title} className="news-value-card">
            <span>{v.icon}</span>
            <div>
              <b>{v.title}</b>
              <p>{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="container news-layout">
        <aside className="news-sidebar">
          <div className="news-sidebar-head">资讯分类</div>
          <ul className="news-cats">
            {newsCategoryFilters.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={tab === c.id || (c.id === "all" && tab === "recommend") ? "on" : ""}
                  onClick={() => {
                    setTab(c.id === "all" ? "recommend" : (c.id as TabId));
                    setPage(1);
                  }}
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="news-deadline-panel">
            <strong>申报日历</strong>
            <ul>
              {policyDeadlines.map((d) => (
                <li key={d.id}>
                  <div className="news-deadline-date">{d.date}</div>
                  <div>
                    <b>{d.title}</b>
                    <span className={d.daysLeft <= 14 ? "news-deadline-urgent" : ""}>
                      剩 {d.daysLeft} 天 · {d.level}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="news-subscribe-panel">
            <strong>订阅主题</strong>
            <div className="news-topic-chips">
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={t.on ? "on" : ""}
                  onClick={() => toggleTopic(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="news-main">
          <div className="news-search-row">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="搜索政策、公告、行业动态…"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              aria-label="政策层级"
            >
              {policyLevelFilters.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary btn-sm">搜索</button>
          </div>

          <div className="news-tabs">
            {tabItems.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? "on" : ""}
                onClick={() => {
                  setTab(t.id);
                  setPage(1);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {(tab === "recommend" || tab === "policy") && (
            <section className="news-policy-section">
              <div className="news-section-head">
                <h2>AI 政策匹配</h2>
                <span>基于「临港精密制造」企业画像 · 匹配 {filteredPolicies.length} 项</span>
              </div>
              <div className="news-policy-grid">
                {filteredPolicies.slice(0, 4).map((p) => (
                  <article key={p.id} className="news-policy-card">
                    <div className="news-policy-top">
                      <span className={`news-level news-level--${p.level}`}>{p.level}</span>
                      <span className={`news-status news-status--${p.status === "即将截止" ? "warn" : "ok"}`}>
                        {p.status}
                      </span>
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                    <div className="news-policy-meta">
                      <span>最高 {p.subsidyMax}</span>
                      <span>截止 {p.deadline.slice(5).replace("-", "/")}</span>
                      <strong>{p.matchScore}% 匹配</strong>
                    </div>
                    <div className="news-policy-actions">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => openPolicy(p)}>
                        查看详情
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => showToast("已设置申报提醒，截止前 3 天将再次通知")}
                      >
                        设提醒
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="news-feed-section">
            <div className="news-section-head">
              <h2>{tab === "recommend" ? "综合资讯" : tabItems.find((t) => t.id === tab)?.label}</h2>
              <span>共 {filteredArticles.length} 条</span>
            </div>
            <div className="news-feed">
              {pageItems.map((a) => (
                <article key={a.id} className={`news-card news-card--${a.coverTone ?? "default"}`}>
                  <div className="news-card-main">
                    <div className="news-card-tags">
                      {a.urgent && <span className="news-tag news-tag--urgent">紧急</span>}
                      <span className="news-tag">{a.typeLabel}</span>
                      {a.tags.slice(0, 2).map((t) => (
                        <span key={t} className="news-tag news-tag--muted">{t}</span>
                      ))}
                    </div>
                    <button type="button" className="news-card-title" onClick={() => openArticle(a)}>
                      {a.title}
                    </button>
                    <p>{a.summary}</p>
                    <div className="news-card-foot">
                      <span>{a.source}</span>
                      <span>{a.timeLabel}</span>
                      <span>{a.readCount.toLocaleString()} 阅读</span>
                    </div>
                  </div>
                  <div className="news-card-actions">
                    <button
                      type="button"
                      className={bookmarks.includes(a.id) ? "on" : ""}
                      onClick={() => toggleBookmark(a.id)}
                      title="收藏"
                    >
                      {bookmarks.includes(a.id) ? "★" : "☆"}
                    </button>
                    <button type="button" onClick={() => requireLogin(() => { setActiveArticle(a); setModal("ai"); })}>
                      AI 解读
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="news-pagination">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
                <span>{page} / {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</button>
              </div>
            )}
          </section>

          {(tab === "recommend" || tab === "event") && (
            <section className="news-events-section">
              <div className="news-section-head">
                <h2>近期活动</h2>
                <span>{parkEvents.length} 场可报名</span>
              </div>
              <div className="news-events-grid">
                {parkEvents.map((ev) => (
                  <article key={ev.id} className="news-event-card">
                    <div className="news-event-date">
                      <b>{ev.date.slice(5).replace("-", "/")}</b>
                      <span>{ev.time}</span>
                    </div>
                    <div>
                      <h3>{ev.title}</h3>
                      <p>{ev.summary}</p>
                      <div className="news-event-meta">
                        <span>{ev.format}</span>
                        <span>{ev.location}</span>
                        <span>{ev.registered}/{ev.seats} 已报名</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={registeredEvents.includes(ev.id)}
                        onClick={() => openEvent(ev)}
                      >
                        {registeredEvents.includes(ev.id) ? "已报名" : "立即报名"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {modal === "article" && activeArticle && (
        <div className="news-modal-backdrop" onClick={() => setModal(null)}>
          <div className="news-modal news-modal--wide" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="news-modal-close" onClick={() => setModal(null)}>×</button>
            <span className="news-tag">{activeArticle.typeLabel}</span>
            <h2>{activeArticle.title}</h2>
            <div className="news-modal-meta">
              <span>{activeArticle.source}</span>
              <span>{activeArticle.timeLabel}</span>
              <span>{activeArticle.readCount.toLocaleString()} 阅读</span>
            </div>
            <p className="news-modal-summary">{activeArticle.summary}</p>
            <div className="news-modal-body">
              <p>
                本文为园区产服平台转载/整理内容。涉及申报类资讯，请以主管部门最新发布为准。
                平台提供材料清单下载、AI 预审与一对一辅导预约，可在「企业服务」模块发起咨询。
              </p>
              <ul>
                {activeArticle.tags.map((t) => (
                  <li key={t}>#{t}</li>
                ))}
              </ul>
            </div>
            <div className="news-modal-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal("ai")}>
                AI 解读此文
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleBookmark(activeArticle.id)}>
                {bookmarks.includes(activeArticle.id) ? "取消收藏" : "收藏"}
              </button>
              <Link to="/services" className="btn btn-ghost btn-sm">预约申报辅导</Link>
            </div>
          </div>
        </div>
      )}

      {modal === "policy" && activePolicy && (
        <div className="news-modal-backdrop" onClick={() => setModal(null)}>
          <div className="news-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="news-modal-close" onClick={() => setModal(null)}>×</button>
            <span className={`news-level news-level--${activePolicy.level}`}>{activePolicy.level}</span>
            <h2>{activePolicy.title}</h2>
            <div className="news-policy-detail-grid">
              <div><span>发布单位</span><b>{activePolicy.department}</b></div>
              <div><span>政策类别</span><b>{activePolicy.category}</b></div>
              <div><span>最高补贴</span><b>{activePolicy.subsidyMax}</b></div>
              <div><span>申报截止</span><b>{activePolicy.deadline}</b></div>
              <div><span>匹配度</span><b>{activePolicy.matchScore}%</b></div>
              <div><span>状态</span><b>{activePolicy.status}</b></div>
            </div>
            <p className="news-modal-summary">{activePolicy.summary}</p>
            <div className="news-modal-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => showToast("已生成材料清单，请至工作台查看")}>
                获取材料清单
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => showToast("已设置申报提醒")}>
                设截止提醒
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "event" && activeEvent && (
        <div className="news-modal-backdrop" onClick={() => setModal(null)}>
          <div className="news-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="news-modal-close" onClick={() => setModal(null)}>×</button>
            <h2>{activeEvent.title}</h2>
            <div className="news-policy-detail-grid">
              <div><span>时间</span><b>{activeEvent.date} {activeEvent.time}</b></div>
              <div><span>形式</span><b>{activeEvent.format}</b></div>
              <div><span>地点</span><b>{activeEvent.location}</b></div>
              <div><span>主办</span><b>{activeEvent.host}</b></div>
            </div>
            <p className="news-modal-summary">{activeEvent.summary}</p>
            <div className="news-modal-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => registerEvent(activeEvent)}>
                确认报名
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "ai" && (
        <div className="news-modal-backdrop" onClick={() => setModal(null)}>
          <div className="news-modal news-modal--ai" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="news-modal-close" onClick={() => setModal(null)}>×</button>
            <h2>AI 政策解读</h2>
            <p className="news-modal-summary">
              输入您关心的问题，AI 将结合企业画像与最新政策库，生成解读要点、申报条件与材料清单。
            </p>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="例如：我们是一家精密制造企业，想了解研发加计扣除和数字化改造券能否同时申报？"
              rows={4}
            />
            <div className="news-ai-suggestions">
              {["研发加计扣除条件", "专精特新补贴额度", "出口信保扶持范围"].map((s) => (
                <button key={s} type="button" onClick={() => setAiInput(s)}>{s}</button>
              ))}
            </div>
            <div className="news-modal-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={submitAi}>开始解读</button>
            </div>
          </div>
        </div>
      )}

      {modal === "subscribe" && (
        <div className="news-modal-backdrop" onClick={() => setModal(null)}>
          <div className="news-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="news-modal-close" onClick={() => setModal(null)}>×</button>
            <h2>我的订阅</h2>
            <p className="news-modal-summary">选择感兴趣的主题，新资讯与政策匹配结果将推送至工作台。</p>
            <div className="news-topic-chips news-topic-chips--lg">
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={t.on ? "on" : ""}
                  onClick={() => toggleTopic(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="news-subscribe-count">已收藏 {bookmarks.length} 条 · 已订阅 {topics.filter((t) => t.on).length} 个主题</p>
          </div>
        </div>
      )}

      {modal === "toast" && toast && (
        <div className="news-toast">{toast}</div>
      )}
    </div>
  );
}
