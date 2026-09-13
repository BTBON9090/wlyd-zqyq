import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CategoryCascader } from "../../components/CategoryCascader";
import {
  FilterChip,
  FilterDropdown,
  FilterRangeRow,
  useExclusiveOpen,
} from "../../components/FilterDropdown";
import { ServiceCard } from "../../components/ServiceCard";
import { ServicesSidePanel } from "../../components/EmployerSideNav";
import {
  applyPricePreset,
  applyPublishedPreset,
  applyRatingPreset,
  categoryPathLabel,
  defaultHallFilters,
  filterEnterpriseServices,
  priceRangeFilters,
  publishedWithinFilters,
  ratingFilters,
  serviceCategories,
  sortOptions,
  type ServiceCategoryId,
  type ServiceHallFilters,
} from "../../data/enterpriseServices";

function isCategoryId(v: string | null): v is ServiceCategoryId | "all" {
  if (!v) return false;
  return serviceCategories.some((c) => c.id === v);
}

type OpenKey = "price" | "published" | "rating" | "sort";

function priceSummary(f: ServiceHallFilters) {
  if (!f.priceMin && !f.priceMax) return undefined;
  if (f.pricePreset !== "all" && f.pricePreset !== "custom") {
    return priceRangeFilters.find((x) => x.id === f.pricePreset)?.label;
  }
  if (f.priceMin && f.priceMax) return `¥${f.priceMin}-${f.priceMax}`;
  if (f.priceMin) return `¥${f.priceMin}起`;
  return `¥${f.priceMax}内`;
}

function publishedSummary(f: ServiceHallFilters) {
  if (!f.publishedFrom && !f.publishedTo) return undefined;
  if (f.publishedPreset !== "all" && f.publishedPreset !== "custom") {
    return publishedWithinFilters.find((x) => x.id === f.publishedPreset)?.label;
  }
  if (f.publishedFrom && f.publishedTo) return `${f.publishedFrom}~${f.publishedTo}`;
  if (f.publishedFrom) return `${f.publishedFrom}起`;
  return `至${f.publishedTo}`;
}

function ratingSummary(
  lo: string,
  hi: string,
  preset: string,
  fallbackLabel: string,
) {
  if (!lo && !hi) return undefined;
  if (preset !== "all" && preset !== "custom") {
    return ratingFilters.find((x) => x.id === preset)?.label ?? fallbackLabel;
  }
  if (lo && hi) return `${lo}-${hi}分`;
  if (lo) return `${lo}分及以上`;
  return `${hi}分及以下`;
}

export function ServicesHallPage() {
  const [params, setParams] = useSearchParams();
  const { openKey, toggle, close } = useExclusiveOpen<OpenKey>();
  const [filters, setFilters] = useState<ServiceHallFilters>(() => {
    const cat = params.get("cat");
    const q = params.get("q") ?? "";
    return {
      ...defaultHallFilters,
      categoryId: isCategoryId(cat) ? cat : "all",
      query: q,
    };
  });
  const [draft, setDraft] = useState<ServiceHallFilters>(filters);

  useEffect(() => {
    const cat = params.get("cat");
    const q = params.get("q") ?? "";
    setFilters((prev) => {
      const categoryId = isCategoryId(cat) ? cat : "all";
      const catChanged = categoryId !== prev.categoryId;
      const next = {
        ...prev,
        categoryId,
        query: q,
        ...(catChanged ? { categoryL2: "", categoryL3: "" } : {}),
      };
      return next;
    });
  }, [params]);

  useEffect(() => {
    if (openKey) setDraft(filters);
  }, [openKey, filters]);

  const filtered = useMemo(() => filterEnterpriseServices(filters), [filters]);

  const patchFilters = (partial: Partial<ServiceHallFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const patchDraft = (partial: Partial<ServiceHallFilters>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const syncUrl = (next: ServiceHallFilters) => {
    const sp = new URLSearchParams();
    if (next.categoryId !== "all") sp.set("cat", next.categoryId);
    if (next.query.trim()) sp.set("q", next.query.trim());
    setParams(sp, { replace: true });
  };

  const applyCategory = (nextCat: {
    categoryId: ServiceCategoryId | "all";
    categoryL2: string;
    categoryL3: string;
  }) => {
    const next = { ...filters, ...nextCat };
    setFilters(next);
    syncUrl(next);
  };

  const submitSearch = () => syncUrl(filters);

  const clearFilters = () => {
    setFilters({ ...defaultHallFilters, query: "" });
    setDraft({ ...defaultHallFilters, query: "" });
    setParams({}, { replace: true });
    close();
  };

  const commitDraft = () => {
    setFilters(draft);
  };

  const catLabel = categoryPathLabel(filters);

  return (
    <div className="svc-page svc-page--hall">
      <div className="container svc-layout">
        <ServicesSidePanel activeCategory={filters.categoryId} />

        <div className="svc-main">
          <div className="svc-hall-hero">
            <div>
              <h1>服务大厅</h1>
              <p>级联类目 · 紧凑筛选 · 关键词覆盖名称 / 简介 / 概述</p>
            </div>
          </div>

          <div className="svc-filter-bar">
            <div className="svc-filter-search">
              <input
                value={filters.query}
                onChange={(e) => patchFilters({ query: e.target.value })}
                placeholder="关键词：服务名称、简介、概述、服务商…"
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={submitSearch}>
                搜索
              </button>
            </div>

            <div className="svc-filter-chips">
              <div className="svc-filter-chip-item svc-filter-chip-item--cascade">
                <CategoryCascader
                  value={{
                    categoryId: filters.categoryId,
                    categoryL2: filters.categoryL2,
                    categoryL3: filters.categoryL3,
                  }}
                  onChange={applyCategory}
                />
              </div>

              <FilterDropdown
                label="价格区间"
                summary={priceSummary(filters)}
                open={openKey === "price"}
                onToggle={() => toggle("price")}
                onClose={close}
                onClear={() => {
                  const cleared = applyPricePreset("all");
                  patchDraft(cleared);
                  setFilters((prev) => ({ ...prev, ...cleared }));
                  close();
                }}
                onConfirm={commitDraft}
              >
                <FilterRangeRow
                  left={
                    <input
                      type="number"
                      min={0}
                      placeholder="最低价格"
                      value={draft.priceMin}
                      onChange={(e) =>
                        patchDraft({ pricePreset: "custom", priceMin: e.target.value })
                      }
                    />
                  }
                  right={
                    <input
                      type="number"
                      min={0}
                      placeholder="最高价格"
                      value={draft.priceMax}
                      onChange={(e) =>
                        patchDraft({ pricePreset: "custom", priceMax: e.target.value })
                      }
                    />
                  }
                />
                <div className="svc-fd-chips">
                  {priceRangeFilters.map((f) => (
                    <FilterChip
                      key={f.id}
                      active={draft.pricePreset === f.id}
                      onClick={() => patchDraft(applyPricePreset(f.id))}
                    >
                      {f.label}
                    </FilterChip>
                  ))}
                </div>
              </FilterDropdown>

              <FilterDropdown
                label="发布时间"
                summary={publishedSummary(filters)}
                open={openKey === "published"}
                onToggle={() => toggle("published")}
                onClose={close}
                onClear={() => {
                  const cleared = applyPublishedPreset("all");
                  patchDraft(cleared);
                  setFilters((prev) => ({ ...prev, ...cleared }));
                  close();
                }}
                onConfirm={commitDraft}
              >
                <FilterRangeRow
                  left={
                    <input
                      type="date"
                      value={draft.publishedFrom}
                      onChange={(e) =>
                        patchDraft({
                          publishedPreset: "custom",
                          publishedFrom: e.target.value,
                        })
                      }
                    />
                  }
                  right={
                    <input
                      type="date"
                      value={draft.publishedTo}
                      onChange={(e) =>
                        patchDraft({
                          publishedPreset: "custom",
                          publishedTo: e.target.value,
                        })
                      }
                    />
                  }
                />
                <div className="svc-fd-chips">
                  {publishedWithinFilters.map((f) => (
                    <FilterChip
                      key={f.id}
                      active={draft.publishedPreset === f.id}
                      onClick={() => patchDraft(applyPublishedPreset(f.id))}
                    >
                      {f.label}
                    </FilterChip>
                  ))}
                </div>
              </FilterDropdown>

              <FilterDropdown
                label="综合评分"
                summary={ratingSummary(
                  filters.ratingLo,
                  filters.ratingHi,
                  filters.ratingPreset,
                  "综合评分",
                )}
                open={openKey === "rating"}
                onToggle={() => toggle("rating")}
                onClose={close}
                onClear={() => {
                  const cleared = applyRatingPreset("all");
                  patchDraft(cleared);
                  setFilters((prev) => ({ ...prev, ...cleared }));
                  close();
                }}
                onConfirm={commitDraft}
              >
                <FilterRangeRow
                  left={
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      placeholder="最低分"
                      value={draft.ratingLo}
                      onChange={(e) =>
                        patchDraft({ ratingPreset: "custom", ratingLo: e.target.value })
                      }
                    />
                  }
                  right={
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      placeholder="最高分"
                      value={draft.ratingHi}
                      onChange={(e) =>
                        patchDraft({ ratingPreset: "custom", ratingHi: e.target.value })
                      }
                    />
                  }
                />
                <div className="svc-fd-chips">
                  {ratingFilters.map((f) => (
                    <FilterChip
                      key={f.id}
                      active={draft.ratingPreset === f.id}
                      onClick={() => patchDraft(applyRatingPreset(f.id))}
                    >
                      {f.label}
                    </FilterChip>
                  ))}
                </div>
              </FilterDropdown>

              <FilterDropdown
                label="排序"
                summary={
                  filters.sort === "comprehensive"
                    ? undefined
                    : sortOptions.find((o) => o.id === filters.sort)?.label
                }
                open={openKey === "sort"}
                onToggle={() => toggle("sort")}
                onClose={close}
                onClear={() => {
                  patchDraft({ sort: "comprehensive" });
                  setFilters((prev) => ({ ...prev, sort: "comprehensive" }));
                  close();
                }}
                onConfirm={commitDraft}
              >
                <div className="svc-fd-chips svc-fd-chips--single">
                  {sortOptions.map((o) => (
                    <FilterChip
                      key={o.id}
                      active={draft.sort === o.id}
                      onClick={() => patchDraft({ sort: o.id })}
                    >
                      {o.label}
                    </FilterChip>
                  ))}
                </div>
              </FilterDropdown>

              <button
                type="button"
                className="svc-fd-reset"
                title="清空筛选"
                onClick={clearFilters}
                aria-label="清空筛选"
              >
                ↻
              </button>
            </div>
          </div>

          <div className="svc-toolbar">
            <strong>{catLabel}</strong>
            <span>共 {filtered.length} 项</span>
          </div>

          {filtered.length === 0 ? (
            <div className="svc-empty">
              <p>暂无符合条件的服务</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={clearFilters}>
                重置筛选
              </button>
            </div>
          ) : (
            <div className="svc-grid">
              {filtered.map((s) => (
                <ServiceCard key={s.id} service={s} showPath />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
