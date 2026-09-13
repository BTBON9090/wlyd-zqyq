import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChainMindMap } from "../../components/map/ChainMindMap";
import { ParkPanorama } from "../../components/map/ParkPanorama";
import {
  chainSegmentFilters,
  clusterRanks,
  enterprisesInScope,
  geoScopeOptions,
  getZoneById,
  industryL1Filters,
  mapEnterprises,
  mapKpis,
  mapMatches,
  zonesInScope,
  type GeoScope,
  type MapEnterprise,
  type MapViewMode,
} from "../../data/industryMap";
import { parkName } from "../../data";
import { useRequireLogin } from "../../hooks/useRequireLogin";

const IndustryMapCanvas = lazy(() =>
  import("../../components/map/IndustryMapCanvas").then((m) => ({ default: m.IndustryMapCanvas })),
);

const VIEW_MODES: { id: MapViewMode; label: string; desc: string }[] = [
  { id: "panorama", label: "园区全景", desc: "实景全景漫游" },
  { id: "enterprise", label: "企业分布", desc: "地图企业位置定位" },
  { id: "heatmap", label: "供需热力", desc: "分布式密度热力" },
  { id: "chain", label: "产业链图谱", desc: "上下游穿透展开" },
  { id: "zone", label: "产业片区", desc: "跨区域集聚分析" },
];

type DetailTab = "info" | "chain" | "match";
type RoleFilter = "all" | "demand" | "supply" | "both";

const roleLabel: Record<MapEnterprise["role"], string> = {
  park: "园区中心",
  demand: "需求方",
  supply: "供给方",
  both: "供需双向",
};

export function IndustryMapPage() {
  const requireLogin = useRequireLogin();
  const [viewMode, setViewMode] = useState<MapViewMode>("panorama");
  const [geoScope, setGeoScope] = useState<GeoScope>("park");
  const [query, setQuery] = useState("");
  const [industryL1, setIndustryL1] = useState("全部产业");
  const [chainSegment, setChainSegment] = useState("全部环节");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showZones, setShowZones] = useState(true);
  const [active, setActive] = useState<MapEnterprise | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("info");
  const [toast, setToast] = useState("");
  const [chainMapFocus, setChainMapFocus] = useState(false);

  const scopedEnterprises = useMemo(() => enterprisesInScope(geoScope), [geoScope]);
  const scopedZones = useMemo(() => zonesInScope(geoScope), [geoScope]);

  const filtered = useMemo(() => {
    let list = scopedEnterprises;
    if (viewMode === "enterprise" || viewMode === "heatmap") {
      list = list.filter((e) => e.role !== "park");
    }
    if (roleFilter !== "all") {
      list = list.filter((e) => e.role === "park" || e.role === roleFilter);
    }
    if (industryL1 !== "全部产业") {
      list = list.filter((e) => e.role === "park" || e.industryL1 === industryL1);
    }
    if (chainSegment !== "全部环节") {
      list = list.filter((e) => e.role === "park" || e.chainSegment === chainSegment);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.industryL2.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [scopedEnterprises, viewMode, roleFilter, industryL1, chainSegment, query]);

  const matches = useMemo(
    () =>
      active
        ? mapMatches.filter((m) => m.fromId === active.id || m.toId === active.id)
        : [],
    [active],
  );

  const onSelect = useCallback(
    (ent: MapEnterprise) => {
      requireLogin(() => {
        setActive(ent);
        setDetailTab("info");
      });
    },
    [requireLogin],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2000);
  }, []);

  const showOnMapFromChain = useCallback(
    (ent: MapEnterprise) => {
      requireLogin(() => {
        setActive(ent);
        setDetailTab("info");
        setChainMapFocus(true);
        setViewMode("enterprise");
        if (ent.scope !== "park") setGeoScope(ent.scope);
        showToast(`已切换地图定位：${ent.name}`);
      });
    },
    [requireLogin, showToast],
  );

  const zone = active ? getZoneById(active.zoneId) : undefined;
  const showMap =
    viewMode === "enterprise" ||
    viewMode === "heatmap" ||
    viewMode === "zone" ||
    (viewMode === "chain" && chainMapFocus);

  const scopeHint =
    geoScopeOptions.find((g) => g.id === geoScope)?.label ?? "本园区";

  return (
    <div className="imap-page">
      <div className="imap-topbar">
        <div className="container imap-topbar-inner">
          <div>
            <Link to="/">首页</Link>
            <span className="imap-divider">/</span>
            <strong>产业地图</strong>
          </div>
          <div className="imap-topbar-actions">
            <Link to="/procurement" className="imap-link">
              集采对接
            </Link>
            <Link to="/demand" className="imap-link">
              发布需求
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => showToast("产业报告已导出（演示）")}
            >
              导出产业报告
            </button>
          </div>
        </div>
      </div>

      <div className="container imap-body">
        <div className="imap-kpis">
          {mapKpis.map((k) => (
            <div key={k.label} className="imap-kpi">
              <span className="imap-kpi-label">{k.label}</span>
              <strong>{k.value}</strong>
              <em>{k.hint}</em>
            </div>
          ))}
        </div>

        <div className="imap-view-tabs">
          {VIEW_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={viewMode === m.id ? "on" : ""}
              onClick={() => {
                setViewMode(m.id);
                if (m.id === "chain") setChainMapFocus(false);
                if (m.id === "panorama") setGeoScope("park");
              }}
            >
              <strong>{m.label}</strong>
              <span>{m.desc}</span>
            </button>
          ))}
        </div>

        {viewMode !== "panorama" && (
          <div className="imap-scope-bar" role="tablist" aria-label="地理范围">
            <span>地理范围</span>
            {geoScopeOptions.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={geoScope === g.id}
                className={geoScope === g.id ? "on" : ""}
                onClick={() => setGeoScope(g.id)}
              >
                {g.label}
              </button>
            ))}
            <em>
              当前 {scopeHint} · {filtered.filter((e) => e.role !== "park").length} 家企业 ·{" "}
              {scopedZones.length} 个片区
            </em>
          </div>
        )}

        <div className={`imap-layout ${viewMode === "panorama" ? "imap-layout--pano" : ""}`}>
          {viewMode !== "panorama" && (
            <aside className="imap-filters">
              <h3>筛选检索</h3>
              <label className="imap-field">
                <span>企业搜索</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="名称 / 产业 / 标签"
                />
              </label>
              <label className="imap-field">
                <span>主导产业</span>
                <select value={industryL1} onChange={(e) => setIndustryL1(e.target.value)}>
                  {industryL1Filters.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className="imap-field">
                <span>产业链环节</span>
                <select value={chainSegment} onChange={(e) => setChainSegment(e.target.value)}>
                  {chainSegmentFilters.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <div className="imap-field">
                <span>供需角色</span>
                <div className="imap-role-chips">
                  {(
                    [
                      ["all", "全部"],
                      ["demand", "需求方"],
                      ["supply", "供给方"],
                      ["both", "双向"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={roleFilter === id ? "on" : ""}
                      onClick={() => setRoleFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {(viewMode === "zone" || viewMode === "enterprise") && (
                <label className="imap-check">
                  <input
                    type="checkbox"
                    checked={showZones}
                    onChange={(e) => setShowZones(e.target.checked)}
                  />
                  显示产业片区
                </label>
              )}

              {viewMode === "zone" && (
                <>
                  <h3>片区列表</h3>
                  <ul className="imap-zone-list">
                    {scopedZones.map((z) => (
                      <li key={z.id}>
                        <i style={{ background: z.color }} />
                        <div>
                          <b>{z.name}</b>
                          <em>
                            {z.regionLabel} · {z.enterpriseCount} 家
                          </em>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {viewMode !== "zone" && (
                <>
                  <h3>产业集聚 TOP5</h3>
                  <ul className="imap-clusters">
                    {clusterRanks.map((c, i) => (
                      <li key={c.id}>
                        <span className="imap-rank">{i + 1}</span>
                        <div>
                          <b>{c.name}</b>
                          <div className="imap-cluster-bar">
                            <i style={{ width: `${c.share * 3}%` }} />
                          </div>
                          <em>
                            {c.count} 家 · {c.growth}
                          </em>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3>企业列表 ({filtered.filter((e) => e.role !== "park").length})</h3>
              <ul className="imap-ent-list">
                {filtered
                  .filter((e) => e.role !== "park")
                  .map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        className={active?.id === e.id ? "on" : ""}
                        onClick={() => onSelect(e)}
                      >
                        <i data-role={e.role} />
                        <span>
                          <b>{e.name}</b>
                          <em>
                            {e.industryL2}
                            {e.scope !== "park" ? ` · ${e.scope === "city" ? "全市" : e.scope === "province" ? "全省" : "全国"}` : ""}
                          </em>
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </aside>
          )}

          <div className="imap-map-col">
            <div className={`imap-map-frame ${viewMode === "panorama" ? "imap-map-frame--pano" : ""}`}>
              {viewMode === "panorama" && <ParkPanorama />}
              {viewMode === "chain" && !chainMapFocus && (
                <ChainMindMap onSelectEnterprise={onSelect} onShowOnMap={showOnMapFromChain} />
              )}
              {showMap && (
                <Suspense fallback={<div className="imap-map-loading">地图加载中…</div>}>
                  <IndustryMapCanvas
                    enterprises={filtered}
                    viewMode={viewMode === "chain" ? "enterprise" : viewMode}
                    geoScope={geoScope}
                    activeId={active?.id ?? null}
                    showZones={showZones || viewMode === "zone"}
                    onSelect={onSelect}
                  />
                </Suspense>
              )}
              {showMap && (
                <div className="imap-map-legend">
                  {viewMode === "heatmap" ? (
                    <>
                      <span>
                        <i style={{ background: "#ef4444" }} />
                        需求热力核
                      </span>
                      <span>
                        <i style={{ background: "#16a34a" }} />
                        供给热力核
                      </span>
                      <span>邻近企业已聚合</span>
                    </>
                  ) : (
                    <>
                      <span>
                        <i style={{ background: "#ef4444" }} />
                        需求方
                      </span>
                      <span>
                        <i style={{ background: "#16a34a" }} />
                        供给方
                      </span>
                      <span>
                        <i style={{ background: "#d97706" }} />
                        双向
                      </span>
                      <span>
                        <i style={{ background: "#0d4ea3" }} />
                        园区
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <p className="imap-map-hint">
              {viewMode === "panorama" && `${parkName} · 实景全景 · 拖拽环视 · 点击热点`}
              {viewMode === "enterprise" && `${scopeHint}企业位置分布 · 点击标记查看详情`}
              {viewMode === "heatmap" && `${scopeHint}供需分布式热力 · 密集区域自动聚合`}
              {viewMode === "chain" &&
                (chainMapFocus
                  ? "图谱企业已定位到地图 · 可返回图谱继续穿透"
                  : "上下游图谱穿透 · 展开节点查看企业 · 可切地图定位")}
              {viewMode === "zone" && `${scopeHint}产业片区 · 色块为集聚边界 · 悬停查看概况`}
            </p>
            {viewMode === "chain" && (
              <div className="imap-chain-switch">
                <button
                  type="button"
                  className={!chainMapFocus ? "on" : ""}
                  onClick={() => setChainMapFocus(false)}
                >
                  图谱穿透
                </button>
                <button
                  type="button"
                  className={chainMapFocus ? "on" : ""}
                  onClick={() => setChainMapFocus(true)}
                >
                  地图看位置
                </button>
              </div>
            )}
          </div>

          <aside className="imap-detail">
            {!active ? (
              <div className="imap-detail-body">
                <p className="imap-empty">点击左侧列表或地图上的企业，查看详情与撮合推荐</p>
              </div>
            ) : (
              <>
            <div className="imap-detail-head">
              <div>
                <h2>{active.name}</h2>
                <span className={`imap-role imap-role--${active.role}`}>{roleLabel[active.role]}</span>
              </div>
              {active.matchScore && (
                <div className="imap-score">
                  <strong>{active.matchScore}</strong>
                  <span>匹配指数</span>
                </div>
              )}
            </div>

            <div className="imap-detail-tabs">
              {(
                [
                  ["info", "详情"],
                  ["chain", "产业链"],
                  ["match", "智能撮合"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={detailTab === id ? "on" : ""}
                  onClick={() => setDetailTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {detailTab === "info" && (
              <div className="imap-detail-body">
                <p className="imap-intro">{active.intro}</p>
                <dl className="imap-dl">
                  <div>
                    <dt>主导产业</dt>
                    <dd>
                      {active.industryL1} / {active.industryL2}
                    </dd>
                  </div>
                  <div>
                    <dt>产业链环节</dt>
                    <dd>{active.chainSegment}</dd>
                  </div>
                  {zone && (
                    <div>
                      <dt>所属片区</dt>
                      <dd>
                        {zone.name}
                        <br />
                        <small>{zone.regionLabel}</small>
                      </dd>
                    </div>
                  )}
                  {active.employees !== "—" && (
                    <div>
                      <dt>员工规模</dt>
                      <dd>{active.employees}</dd>
                    </div>
                  )}
                  {active.revenue !== "—" && (
                    <div>
                      <dt>年营收</dt>
                      <dd>{active.revenue}</dd>
                    </div>
                  )}
                </dl>
                <div className="imap-tags">
                  {active.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                {active.demandSummary && (
                  <div className="imap-summary imap-summary--demand">
                    <strong>采购需求</strong>
                    <p>{active.demandSummary}</p>
                  </div>
                )}
                {active.supplySummary && (
                  <div className="imap-summary imap-summary--supply">
                    <strong>供给能力</strong>
                    <p>{active.supplySummary}</p>
                  </div>
                )}
                <div className="imap-detail-actions">
                  <Link to="/procurement" className="btn btn-outline btn-sm">
                    发起集采
                  </Link>
                  <Link to="/demand" className="btn btn-primary btn-sm">
                    发布对接需求
                  </Link>
                </div>
              </div>
            )}

            {detailTab === "chain" && (
              <div className="imap-detail-body">
                <div className="imap-chain-graph">
                  <div className="imap-chain-col">
                    <h4>上游 / 供应商</h4>
                    {active.upstream.length === 0 ? (
                      <p className="imap-empty">暂无上游关联</p>
                    ) : (
                      active.upstream.map((name) => (
                        <button
                          key={name}
                          type="button"
                          className="imap-chain-node imap-chain-node--up"
                          onClick={() => {
                            const ent = mapEnterprises.find((e) => e.name === name);
                            if (ent) onSelect(ent);
                          }}
                        >
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="imap-chain-center">
                    <span>{active.name}</span>
                  </div>
                  <div className="imap-chain-col">
                    <h4>下游 / 客户</h4>
                    {active.downstream.length === 0 ? (
                      <p className="imap-empty">暂无下游关联</p>
                    ) : (
                      active.downstream.map((name) => (
                        <button
                          key={name}
                          type="button"
                          className="imap-chain-node imap-chain-node--down"
                          onClick={() => {
                            const ent = mapEnterprises.find((e) => e.name === name);
                            if (ent) onSelect(ent);
                          }}
                        >
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ width: "100%", marginTop: 12 }}
                  onClick={() => {
                    setViewMode("chain");
                    setChainMapFocus(false);
                  }}
                >
                  打开产业链图谱穿透
                </button>
              </div>
            )}

            {detailTab === "match" && (
              <div className="imap-detail-body">
                {matches.length === 0 ? (
                  <p className="imap-empty">暂无 AI 推荐撮合，可切换其他企业查看</p>
                ) : (
                  <ul className="imap-matches">
                    {matches.map((m) => {
                      const targetId = m.fromId === active.id ? m.toId : m.fromId;
                      const target = mapEnterprises.find((e) => e.id === targetId);
                      if (!target) return null;
                      return (
                        <li key={m.id}>
                          <div>
                            <b>{target.name}</b>
                            <p>{m.reason}</p>
                          </div>
                          <div className="imap-match-foot">
                            <span className="imap-match-score">{m.score} 分</span>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => showToast(`已向 ${target.name} 发起对接（演示）`)}
                            >
                              一键对接
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
              </>
            )}
          </aside>
        </div>
      </div>

      {toast && <div className="imap-toast">{toast}</div>}
    </div>
  );
}
