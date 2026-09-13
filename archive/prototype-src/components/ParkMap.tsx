import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup, LatLngExpression } from "leaflet";
import { parkName } from "../data";

type LayerMode = "all" | "demand" | "supply";

type MapPoint = {
  id: string;
  name: string;
  kind: "demand" | "supply" | "park";
  lat: number;
  lng: number;
  industry: string;
  detail: string;
};

/** 临港新片区附近示意坐标 */
const points: MapPoint[] = [
  {
    id: "park",
    name: parkName,
    kind: "park",
    lat: 30.8892,
    lng: 121.9265,
    industry: "园区中心",
    detail: "入驻企业 286 家 · 主导产业：高端装备 / 新材料",
  },
  {
    id: "d1",
    name: "临港精密制造",
    kind: "demand",
    lat: 30.8968,
    lng: 121.9124,
    industry: "精密制造",
    detail: "采购需求：伺服电机、工业润滑油 · 月采规模约 120 万",
  },
  {
    id: "d2",
    name: "海工装备股份",
    kind: "demand",
    lat: 30.8785,
    lng: 121.9188,
    industry: "海工装备",
    detail: "采购需求：防护用品、认证检测 · 在途订单 3 笔",
  },
  {
    id: "d3",
    name: "智造装备科技",
    kind: "demand",
    lat: 30.9012,
    lng: 121.9386,
    industry: "智能装备",
    detail: "采购需求：ERP 对接、软件信息化服务",
  },
  {
    id: "s1",
    name: "临港新材料",
    kind: "supply",
    lat: 30.8836,
    lng: 121.9412,
    industry: "新材料",
    detail: "供给：特种合金板材、工业涂料 · 可售库存充足",
  },
  {
    id: "s2",
    name: "汇川智控临港仓",
    kind: "supply",
    lat: 30.9074,
    lng: 121.9215,
    industry: "智能控制",
    detail: "供给：伺服电机、变频器 · 园区协议价直供",
  },
  {
    id: "s3",
    name: "正衡工业服务",
    kind: "supply",
    lat: 30.8728,
    lng: 121.9338,
    industry: "企业服务",
    detail: "供给：工商财税、法律顾问、知识产权代办",
  },
];

const parkBoundary: LatLngExpression[] = [
  [30.912, 121.905],
  [30.914, 121.948],
  [30.878, 121.955],
  [30.865, 121.920],
  [30.875, 121.898],
];

function markerHtml(kind: MapPoint["kind"], label: string) {
  const color =
    kind === "demand" ? "#ef4444" : kind === "supply" ? "#16a34a" : "#0d4ea3";
  const short = kind === "park" ? "园" : kind === "demand" ? "需" : "供";
  return `
    <div class="leaflet-park-marker" style="--mk:${color}">
      <span class="leaflet-park-marker__pin"><span>${short}</span></span>
      <span class="leaflet-park-marker__label">${label}</span>
    </div>
  `;
}

export function ParkMap() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<LayerMode>("all");
  const [active, setActive] = useState<MapPoint | null>(points[0]);

  const visible = useMemo(
    () =>
      points.filter((p) => {
        if (mode === "all") return true;
        if (mode === "demand") return p.kind === "demand" || p.kind === "park";
        return p.kind === "supply" || p.kind === "park";
      }),
    [mode],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let map: LeafletMap | null = null;

    // 每次挂载使用全新 DOM 节点，避免 StrictMode 重复初始化报错
    const el = document.createElement("div");
    el.className = "map-leaflet-root";
    el.style.width = "100%";
    el.style.height = "100%";
    host.replaceChildren(el);

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        if (cancelled) return;

        map = L.map(el, {
          center: [30.8892, 121.9265],
          zoom: 13,
          zoomControl: false,
          attributionControl: true,
        });

        // 国内可访问的高德矢量路网底图
        L.tileLayer(
          "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
          {
            subdomains: "1234",
            maxZoom: 18,
            attribution: "&copy; 高德地图",
          },
        ).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.polygon(parkBoundary, {
          color: "#0d4ea3",
          weight: 2,
          dashArray: "6 6",
          fillColor: "#0d4ea3",
          fillOpacity: 0.08,
        }).addTo(map);

        markersRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setLoadError(null);
        setReady(true);

        window.setTimeout(() => map?.invalidateSize(), 100);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "地图加载失败");
          setReady(false);
        }
      }
    })();

    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      setReady(false);
      markersRef.current = null;
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (!ready || !markersRef.current) return;

    let disposed = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !markersRef.current) return;

      const group = markersRef.current;
      group.clearLayers();

      visible.forEach((p) => {
        const icon = L.divIcon({
          className: "leaflet-park-icon",
          html: markerHtml(p.kind, p.name),
          iconSize: [120, 48],
          iconAnchor: [18, 42],
        });

        const marker = L.marker([p.lat, p.lng], { icon });
        marker.bindPopup(
          `<div class="map-popup">
            <strong>${p.name}</strong>
            <div class="map-popup__tag">${p.industry}</div>
            <p>${p.detail}</p>
          </div>`,
        );
        marker.on("click", () => setActive(p));
        group.addLayer(marker);
      });
    })();

    return () => {
      disposed = true;
    };
  }, [visible, ready]);

  return (
    <div className="map-shell">
      <div className="map-toolbar">
        <div className="map-tabs">
          {(
            [
              ["all", "供需全景"],
              ["demand", "需求分布"],
              ["supply", "产品分布"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={mode === key ? "on" : ""}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="map-hint">临港新片区 · 拖拽 / 滚轮缩放 · 点击标记查看详情</div>
      </div>

      <div className="map-layout">
        <div className="map-frame map-frame--live">
          <div ref={hostRef} className="map-host" />
          {loadError && (
            <div className="map-error">
              地图加载失败：{loadError}
              <button type="button" onClick={() => window.location.reload()}>
                刷新重试
              </button>
            </div>
          )}
        </div>

        <aside className="map-side">
          <div className="map-side__head">
            <h3>{active?.name ?? parkName}</h3>
            <span className={`map-kind map-kind--${active?.kind ?? "park"}`}>
              {active?.kind === "demand"
                ? "需求方"
                : active?.kind === "supply"
                  ? "供给方"
                  : "园区中心"}
            </span>
          </div>
          <p className="map-side__industry">{active?.industry}</p>
          <p className="map-side__detail">{active?.detail}</p>

          <div className="map-legend map-legend--panel">
            <span>
              <i style={{ background: "#ef4444" }} />
              需求方
            </span>
            <span>
              <i style={{ background: "#16a34a" }} />
              供给方
            </span>
            <span>
              <i style={{ background: "#0d4ea3" }} />
              园区中心
            </span>
          </div>

          <ul className="map-list">
            {visible
              .filter((p) => p.kind !== "park")
              .map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={active?.id === p.id ? "on" : ""}
                    onClick={() => {
                      setActive(p);
                      mapRef.current?.flyTo([p.lat, p.lng], 15, { duration: 0.6 });
                    }}
                  >
                    <i
                      style={{
                        background: p.kind === "demand" ? "#ef4444" : "#16a34a",
                      }}
                    />
                    <span>
                      <b>{p.name}</b>
                      <em>{p.industry}</em>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
