import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  MagnifyingGlass,
  CaretRight,
  X,
} from "@phosphor-icons/react";
import { categories } from "../../data/categories";
import { gateway } from "../../lib/api";
import { useApp } from "../../app/AppProvider";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState, Skeletons } from "../../components/ui";
import { ServiceCard } from "./ServiceCard";
import { DemandComposer } from "./DemandComposer";
import { loadHomeContent } from "../home/homeContent";

/** 读取首页版本偏好，用于企业服务页面同步切换风格 */
function getHomeVersion(): "v1" | "v2" | "v3" {
  try {
    const value = localStorage.getItem("park-home-version");
    if (value === "v1" || value === "v2" || value === "v3") return value;
  } catch {
    /* ignore */
  }
  return "v3";
}

export default function ServicesPage() {
  const location = useLocation();
  const hall = location.pathname.endsWith("/hall");
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, openAuth } = useApp();
  const query = (params.get("q") || "").trim().slice(0, 100);
  const cat = categories.some((c) => c.id === params.get("cat"))
    ? params.get("cat")!
    : "all";
  const sub = params.get("sub") || "";
  const leaf = params.get("leaf") || "";
  const sort = params.get("sort") || "recommended";
  const price = ["under1000", "1000to5000", "over5000"].includes(
    params.get("price") || "",
  )
    ? params.get("price")!
    : "all";
  const rating = Number(params.get("rating")) || 0;
  const [draft, setDraft] = useState(query);
  const [publish, setPublish] = useState(false);
  useEffect(() => setDraft(query), [query]);
  useEffect(() => {
    if (params.get("publish") === "1" && session) setPublish(true);
  }, [params, session]);
  const services = useQuery({
    queryKey: ["services"],
    queryFn: ({ signal }) => gateway.services(signal),
  });
  const content = useQuery({
    queryKey: ["homepage-content"],
    queryFn: ({ signal }) => loadHomeContent(signal),
    retry: false,
  });
  const patch = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    next.delete("page");
    Object.entries(values).forEach(([key, value]) => {
      if (!value || value === "all" || value === "recommended")
        next.delete(key);
      else next.set(key, value);
    });
    setParams(next);
  };
  function chooseCategory(id: string) {
    if (!hall) navigate(`/services/hall?cat=${id}`);
    else patch({ cat: id, sub: "", leaf: "" });
  }
  const all = services.data || [];
  const filtered = all
    .filter(
      (s) =>
        (cat === "all" || s.categoryId === cat) &&
        (!sub || s.published?.categoryL2 === sub) &&
        (!leaf || s.published?.categoryL3 === leaf) &&
        (!query ||
          [
            s.name,
            s.desc,
            s.provider,
            s.overview,
            s.published?.categoryL2,
            s.published?.categoryL3,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!rating || (s.published?.rating || 0) >= rating) &&
        (price === "all" ||
          (price === "under1000"
            ? s.priceMin < 1000
            : price === "1000to5000"
              ? s.priceMin >= 1000 && s.priceMin <= 5000
              : s.priceMin > 5000)),
    )
    .sort((a, b) =>
      sort === "priceAsc"
        ? a.priceMin - b.priceMin
        : sort === "priceDesc"
          ? b.priceMin - a.priceMin
          : sort === "sales"
            ? (b.published?.salesCount || 0) - (a.published?.salesCount || 0)
            : sort === "newest"
              ? b.publishedAt.localeCompare(a.publishedAt)
              : Number(!!b.hot) - Number(!!a.hot),
    );
  const count = hall ? 15 : 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / count));
  const page = Math.min(
    totalPages,
    Math.max(1, Math.floor(Number(params.get("page"))) || 1),
  );
  const visible = filtered.slice((page - 1) * count, page * count);
  const secondary = [
    ...new Set(
      all
        .filter((s) => s.categoryId === cat)
        .map((s) => s.published?.categoryL2)
        .filter(Boolean),
    ),
  ];
  const tertiary = [
    ...new Set(
      all
        .filter((s) => s.categoryId === cat && s.published?.categoryL2 === sub)
        .map((s) => s.published?.categoryL3)
        .filter(Boolean),
    ),
  ];
  function openPublish() {
    if (!session) {
      openAuth({ returnTo: "/services?publish=1" });
      return;
    }
    setPublish(true);
  }
  const homeVersion = getHomeVersion();
  const isV3 = homeVersion === "v3";
  return (
    <div className={`commerce-container service-v2${isV3 ? " service-v3" : ""}`}>
      <Breadcrumb
        items={[
          { label: "企业服务", to: hall ? "/services" : undefined },
          ...(hall ? [{ label: "服务大厅" }] : []),
        ]}
      />
      <div className="service-v2-top">
        <div>
          <h1>企业服务</h1>
          <p>汇聚专业商家，服务企业经营</p>
        </div>
        <form
          className="showcase-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (hall) patch({ q: draft.trim() });
            else
              navigate(`/services/hall?q=${encodeURIComponent(draft.trim())}`);
          }}
        >
          <MagnifyingGlass size={18} />
          <input
            aria-label="搜索服务名称或服务商"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={100}
            placeholder="搜索服务、商家或关键词"
          />
          {draft && (
            <button
              type="button"
              className="service-clear"
              aria-label="清空搜索"
              onClick={() => {
                setDraft("");
                patch({ q: "" });
              }}
            >
              <X size={13} />
            </button>
          )}
          <button>搜索</button>
        </form>
        <button className="button secondary" onClick={openPublish}>
          发布需求 <ArrowRight size={15} />
        </button>
      </div>
      <div className="service-v2-layout">
        <aside className="service-v2-sidebar">
          <nav className="service-page-links">
            <NavLink to="/services" end>
              服务推荐 <CaretRight size={14} />
            </NavLink>
            <NavLink to="/services/hall">
              服务大厅 <CaretRight size={14} />
            </NavLink>
            <Link to="/account/orders/services">
              我的服务订单 <CaretRight size={14} />
            </Link>
          </nav>
          <h2>全部服务分类</h2>
          <nav aria-label="服务分类">
            {categories.slice(1).map((c) => (
              <button
                key={c.id}
                className={cat === c.id ? "selected" : ""}
                onClick={() => chooseCategory(c.id)}
              >
                <c.icon size={17} />
                <span>{c.label}</span>
                <CaretRight size={12} />
              </button>
            ))}
          </nav>
          <div className="service-side-help">
            <strong>让需求找到专业回应</strong>
            <p>写清服务内容与交付要求，便于商家沟通方案。</p>
            <button onClick={openPublish}>发布我的需求 →</button>
          </div>
        </aside>
        <div className="service-v2-main">
          {!hall && (
            <>
              <div className="service-v2-hero">
                <div className="service-promo">
                  <ContentImage
                    src={content.data?.serviceBannerImage}
                    alt="企业服务运营宣传图"
                    placeholder="企业服务 Banner · 待上传"
                    eager
                  />
                  <div>
                    <span>企业经营 · 专业同行</span>
                    <h2>
                      把经营难题
                      <br />
                      交给专业的人
                    </h2>
                    <p>工商财税 · 品牌设计 · 数字化服务</p>
                    <Link className="button primary" to="/services/hall">
                      探索全部服务 <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
                <div className="service-match">
                  <span>需求对接</span>
                  <h3>找不到合适的服务？</h3>
                  <p>发布需求，让服务从您的具体业务出发。</p>
                  <ol>
                    <li>描述需求与预算</li>
                    <li>沟通方案与交付</li>
                    <li>确认合作安排</li>
                  </ol>
                  <button
                    className="button secondary full-width"
                    onClick={openPublish}
                  >
                    发布服务需求
                  </button>
                </div>
              </div>
              <div className="service-value-strip">
                {[
                  ["多规格可选", "按范围与预算选择"],
                  ["商家信息可查", "了解团队与服务案例"],
                  ["交付标准清晰", "查看周期与阶段安排"],
                  ["服务进度留痕", "在个人中心查看记录"],
                ].map(([title, desc]) => (
                  <div key={title}>
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <section className="service-catalogue">
            <div className="service-catalogue-title">
              <h2>{hall ? "服务大厅" : "热门服务"}</h2>
              <span>专业商家服务</span>
              {!hall && (
                <Link to="/services/hall">
                  查看全部 <ArrowRight size={14} />
                </Link>
              )}
            </div>
            {hall && (
              <div className="service-filter-panel">
                <div className="category-line">
                  <span>服务分类</span>
                  <div>
                    <button
                      aria-pressed={cat === "all"}
                      onClick={() => chooseCategory("all")}
                    >
                      全部
                    </button>
                    {categories.slice(1).map((c) => (
                      <button
                        key={c.id}
                        aria-pressed={cat === c.id}
                        onClick={() => chooseCategory(c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                {secondary.length > 0 && (
                  <div className="category-line">
                    <span>细分类目</span>
                    <div>
                      <button
                        aria-pressed={!sub}
                        onClick={() => patch({ sub: "", leaf: "" })}
                      >
                        全部
                      </button>
                      {secondary.map((name) => (
                        <button
                          key={name}
                          aria-pressed={sub === name}
                          onClick={() => patch({ sub: name!, leaf: "" })}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {sub && tertiary.length > 0 && (
                  <div className="category-line">
                    <span>服务项目</span>
                    <div>
                      <button
                        aria-pressed={!leaf}
                        onClick={() => patch({ leaf: "" })}
                      >
                        全部
                      </button>
                      {tertiary.map((name) => (
                        <button
                          key={name}
                          aria-pressed={leaf === name}
                          onClick={() => patch({ leaf: name! })}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="service-filter-controls">
                  <label>
                    价格{" "}
                    <select
                      value={price}
                      onChange={(e) => patch({ price: e.target.value })}
                    >
                      <option value="all">不限价格</option>
                      <option value="under1000">1,000 元以下</option>
                      <option value="1000to5000">1,000–5,000 元</option>
                      <option value="over5000">5,000 元以上</option>
                    </select>
                  </label>
                  <label>
                    评分{" "}
                    <select
                      value={rating}
                      onChange={(e) => patch({ rating: e.target.value })}
                    >
                      <option value={0}>不限评分</option>
                      <option value={4.5}>4.5 分及以上</option>
                      <option value={4.8}>4.8 分及以上</option>
                    </select>
                  </label>
                  <button
                    onClick={() => {
                      setParams({});
                      setDraft("");
                    }}
                  >
                    清空条件
                  </button>
                </div>
              </div>
            )}
            <div className="service-sort">
              <div>
                {[
                  ["recommended", "综合推荐"],
                  ["sales", "销量"],
                  ["newest", "最新发布"],
                  ["priceAsc", "价格 ↑"],
                  ["priceDesc", "价格 ↓"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    aria-pressed={sort === id}
                    onClick={() => patch({ sort: id })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span>
                {query && `“${query}” · `}共 {filtered.length} 项
              </span>
            </div>
            {services.isPending ? (
              <Skeletons />
            ) : services.isError ? (
              <EmptyState
                error
                title="服务暂时无法加载"
                action="重新加载"
                onAction={() => void services.refetch()}
              />
            ) : visible.length ? (
              <div className="service-v2-grid">
                {visible.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="暂无匹配的服务"
                description="试试其他类目，或清除筛选条件。"
                action="清除筛选"
                onAction={() => setParams({})}
              />
            )}
            {hall && totalPages > 1 && (
              <nav className="pagination" aria-label="服务分页">
                <button
                  disabled={page === 1}
                  onClick={() => patch({ page: String(page - 1) })}
                >
                  上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    aria-current={page === i + 1 ? "page" : undefined}
                    onClick={() => patch({ page: String(i + 1) })}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => patch({ page: String(page + 1) })}
                >
                  下一页
                </button>
              </nav>
            )}
          </section>
          <div className="service-bottom-note">
            服务内容、规格价格与交付安排以商家发布及双方确认为准。
          </div>
        </div>
      </div>
      {publish && (
        <DemandComposer
          open={publish}
          onClose={() => {
            setPublish(false);
            const next = new URLSearchParams(params);
            next.delete("publish");
            setParams(next, { replace: true });
          }}
        />
      )}
    </div>
  );
}
