import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CaretRight,
  MagnifyingGlass,
  SlidersHorizontal,
  X,
} from "@phosphor-icons/react";
import { categories } from "../../data/categories";
import { gateway } from "../../lib/api";
import { Breadcrumb } from "../../components/Shell";
import { EmptyState, Skeletons } from "../../components/ui";
import { ServiceCard } from "./ServiceCard";
export default function ServicesPage() {
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") || "").trim().slice(0, 100);
  const cat = categories.some((c) => c.id === params.get("cat"))
    ? params.get("cat")!
    : "all";
  const sort = ["recommended", "newest", "priceAsc", "priceDesc"].includes(
    params.get("sort") || "",
  )
    ? params.get("sort")!
    : "recommended";
  const price = ["all", "under1000", "1000to5000", "over5000"].includes(
    params.get("price") || "",
  )
    ? params.get("price")!
    : "all";
  const page = Math.max(1, Math.floor(Number(params.get("page"))) || 1);
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);
  const services = useQuery({
    queryKey: ["services"],
    queryFn: ({ signal }) => gateway.services(signal),
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
  const filtered = (services.data || [])
    .filter(
      (s) =>
        (cat === "all" || s.categoryId === cat) &&
        (!query ||
          [s.name, s.desc, s.category, s.provider, s.overview]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())) &&
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
          : sort === "newest"
            ? b.publishedAt.localeCompare(a.publishedAt)
            : Number(b.hot || false) - Number(a.hot || false),
    );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * 12, currentPage * 12);
  return (
    <div className="container services-page">
      <Breadcrumb items={[{ label: "企业服务" }]} />
      <section className="services-heading">
        <div>
          <h1>企业服务大厅</h1>
          <p>按类别、预算查找适合您的专业服务。</p>
        </div>
        <Link to="/services/requests" className="button secondary">
          我的服务申请 <ArrowRight size={17} />
        </Link>
      </section>
      <div className="services-layout">
        <aside className="category-sidebar">
          <h2>服务分类</h2>
          <nav aria-label="服务分类">
            {categories.map((c) => (
              <button
                key={c.id}
                className={cat === c.id ? "active" : ""}
                onClick={() => patch({ cat: c.id })}
                aria-pressed={cat === c.id}
              >
                <c.icon size={20} />
                <span>{c.label}</span>
                <CaretRight size={14} />
              </button>
            ))}
          </nav>
          <div className="sidebar-tip">
            <strong>还没找到合适的？</strong>
            <p>试试更简短的关键词，或按服务类别查找。</p>
            <button
              className="text-button"
              onClick={() => {
                setParams({});
                setDraft("");
              }}
            >
              重置筛选 <ArrowRight size={15} />
            </button>
          </div>
        </aside>
        <div className="services-results">
          <form
            className="catalogue-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              patch({ q: draft.trim() });
            }}
          >
            <MagnifyingGlass size={21} />
            <input
              aria-label="搜索服务名称或服务商"
              placeholder="搜索服务名称、关键词或服务商"
              value={draft}
              maxLength={100}
              onChange={(e) => setDraft(e.target.value)}
            />
            {draft && (
              <button
                type="button"
                className="icon-button"
                aria-label="清空搜索"
                onClick={() => {
                  setDraft("");
                  patch({ q: "" });
                }}
              >
                <X />
              </button>
            )}
            <button className="button primary">搜索</button>
          </form>
          <div className="filters">
            <div>
              <SlidersHorizontal size={17} />
              <label htmlFor="price-filter">价格</label>
              <select
                id="price-filter"
                value={price}
                onChange={(e) => patch({ price: e.target.value })}
              >
                <option value="all">不限价格</option>
                <option value="under1000">1,000 元以下</option>
                <option value="1000to5000">1,000–5,000 元</option>
                <option value="over5000">5,000 元以上</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-filter">排序</label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => patch({ sort: e.target.value })}
              >
                <option value="recommended">综合推荐</option>
                <option value="newest">最新发布</option>
                <option value="priceAsc">价格从低到高</option>
                <option value="priceDesc">价格从高到低</option>
              </select>
            </div>
          </div>
          <div className="result-summary" aria-live="polite">
            <span>
              <strong>{categories.find((c) => c.id === cat)?.label}</strong>
              {!services.isPending && <> · 共 {filtered.length} 项服务</>}
            </span>
            {(query || cat !== "all" || price !== "all") && (
              <button
                className="text-button"
                onClick={() => {
                  setParams({});
                  setDraft("");
                }}
              >
                清除筛选 <X size={14} />
              </button>
            )}
          </div>
          {query && <div className="search-query">搜索「{query}」的结果</div>}
          {services.isPending ? (
            <Skeletons />
          ) : services.isError ? (
            <EmptyState
              error
              title="服务加载失败"
              description="请检查网络后重试，筛选条件会保留。"
              action="重新加载"
              onAction={() => void services.refetch()}
            />
          ) : visible.length ? (
            <div className="service-grid catalogue-grid">
              {visible.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <EmptyState
              action="清除筛选"
              onAction={() => {
                setParams({});
                setDraft("");
              }}
            />
          )}
          {filtered.length > 9 && (
            <nav className="pagination" aria-label="服务分页">
              <button
                className="icon-button"
                aria-label="上一页"
                disabled={currentPage === 1}
                onClick={() => patch({ page: String(currentPage - 1) })}
              >
                <ArrowLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  aria-current={p === currentPage ? "page" : undefined}
                  onClick={() => patch({ page: String(p) })}
                >
                  {p}
                </button>
              ))}
              <button
                className="icon-button"
                aria-label="下一页"
                disabled={currentPage === totalPages}
                onClick={() => patch({ page: String(currentPage + 1) })}
              >
                <ArrowRight />
              </button>
            </nav>
          )}
          <p className="catalogue-note">
            展示价格为参考，具体费用与交付范围以双方确认的服务方案为准。
          </p>
        </div>
      </div>
    </div>
  );
}
