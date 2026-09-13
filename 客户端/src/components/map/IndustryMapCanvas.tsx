import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import {
  geoScopeOptions,
  parkBoundary,
  zonesInScope,
  type GeoScope,
  type MapEnterprise,
  type MapViewMode,
} from "../../data/industryMap";

type Props = {
  enterprises: MapEnterprise[];
  viewMode: MapViewMode;
  geoScope: GeoScope;
  activeId: string | null;
  showZones: boolean;
  onSelect: (enterprise: MapEnterprise) => void;
};

function markerHtml(ent: MapEnterprise, isActive: boolean) {
  const colors: Record<MapEnterprise["role"], string> = {
    demand: "#ef4444",
    supply: "#16a34a",
    both: "#d97706",
    park: "#0d4ea3",
  };
  const short =
    ent.role === "park" ? "园" : ent.role === "demand" ? "需" : ent.role === "supply" ? "供" : "双";
  const activeCls = isActive ? " is-active" : "";
  return `
    <div class="leaflet-park-marker${activeCls}" style="--mk:${colors[ent.role]}">
      <span class="leaflet-park-marker__pin"><span>${short}</span></span>
      <span class="leaflet-park-marker__label">${ent.name}</span>
    </div>
  `;
}

/** 将邻近企业聚合为分布式热力核，避免「一企一圈」 */
function buildHeatCells(
  list: MapEnterprise[],
  kind: "demand" | "supply",
  cellDeg: number,
) {
  const buckets = new Map<string, { lat: number; lng: number; w: number }>();
  list.forEach((e) => {
    const isDemand = e.role === "demand" || e.role === "both";
    const isSupply = e.role === "supply" || e.role === "both";
    if (kind === "demand" && !isDemand) return;
    if (kind === "supply" && !isSupply) return;
    const weight = e.role === "both" ? 0.7 : 1;
    const latKey = Math.round(e.lat / cellDeg);
    const lngKey = Math.round(e.lng / cellDeg);
    const key = `${latKey}:${lngKey}`;
    const cur = buckets.get(key);
    if (cur) {
      cur.lat = (cur.lat * cur.w + e.lat * weight) / (cur.w + weight);
      cur.lng = (cur.lng * cur.w + e.lng * weight) / (cur.w + weight);
      cur.w += weight;
    } else {
      buckets.set(key, { lat: e.lat, lng: e.lng, w: weight });
    }
  });
  return [...buckets.values()];
}

export function IndustryMapCanvas({
  enterprises,
  viewMode,
  geoScope,
  activeId,
  showZones,
  onSelect,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);
  const zonesRef = useRef<LayerGroup | null>(null);
  const heatRef = useRef<LayerGroup | null>(null);
  const parkPolyRef = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const heatCellDeg = useMemo(() => {
    if (geoScope === "national") return 1.2;
    if (geoScope === "province") return 0.35;
    if (geoScope === "city") return 0.08;
    return 0.012;
  }, [geoScope]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let map: LeafletMap | null = null;
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

        const opt = geoScopeOptions.find((g) => g.id === geoScope) ?? geoScopeOptions[0];
        map = L.map(el, {
          center: opt.center,
          zoom: opt.zoom,
          zoomControl: false,
        });

        L.tileLayer(
          "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
          { subdomains: "1234", maxZoom: 18, attribution: "&copy; 高德地图" },
        ).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        parkPolyRef.current = L.layerGroup().addTo(map);
        zonesRef.current = L.layerGroup().addTo(map);
        markersRef.current = L.layerGroup().addTo(map);
        heatRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setLoadError(null);
        setReady(true);
        window.setTimeout(() => map?.invalidateSize(), 120);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "地图加载失败");
        }
      }
    })();

    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onResize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    ro?.observe(host);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      markersRef.current = null;
      zonesRef.current = null;
      heatRef.current = null;
      parkPolyRef.current = null;
      if (map) map.remove();
      mapRef.current = null;
      host.replaceChildren();
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const opt = geoScopeOptions.find((g) => g.id === geoScope) ?? geoScopeOptions[0];
    mapRef.current.flyTo(opt.center, opt.zoom, { duration: 0.7 });
  }, [ready, geoScope]);

  useEffect(() => {
    if (!ready || !parkPolyRef.current) return;
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !parkPolyRef.current) return;
      parkPolyRef.current.clearLayers();
      if (geoScope !== "park" && viewMode !== "enterprise") return;
      L.polygon(parkBoundary, {
        color: "#0d4ea3",
        weight: 2,
        dashArray: "8 6",
        fillColor: "#0d4ea3",
        fillOpacity: 0.05,
      }).addTo(parkPolyRef.current);
    })();
    return () => {
      disposed = true;
    };
  }, [ready, geoScope, viewMode]);

  useEffect(() => {
    if (!ready || !zonesRef.current) return;
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !zonesRef.current) return;
      const group = zonesRef.current;
      group.clearLayers();
      if (!showZones && viewMode !== "zone") return;

      zonesInScope(geoScope).forEach((z) => {
        const emphasis = viewMode === "zone";
        const poly = L.polygon(z.boundary, {
          color: z.color,
          weight: emphasis ? 2.5 : 1.5,
          dashArray: emphasis ? undefined : "5 4",
          fillColor: z.color,
          fillOpacity: emphasis ? 0.28 : 0.12,
          className: "imap-zone-poly",
        });
        poly.bindTooltip(
          `<div class="imap-zone-tip"><b>${z.name}</b><br/>${z.regionLabel}<br/>${z.enterpriseCount} 家 · ${z.industry}</div>`,
          { sticky: true, direction: "top", opacity: 0.95 },
        );
        group.addLayer(poly);
      });
    })();
    return () => {
      disposed = true;
    };
  }, [ready, showZones, viewMode, geoScope]);

  useEffect(() => {
    if (!ready || !markersRef.current) return;
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !markersRef.current) return;
      const group = markersRef.current;
      group.clearLayers();

      const showMarkers =
        viewMode === "enterprise" || viewMode === "zone" || viewMode === "heatmap";
      if (!showMarkers) return;

      const list =
        viewMode === "enterprise"
          ? enterprises.filter((e) => e.role !== "park")
          : viewMode === "heatmap"
            ? []
            : enterprises;

      list.forEach((ent) => {
        const icon = L.divIcon({
          className: "leaflet-park-icon",
          html: markerHtml(ent, ent.id === activeId),
          iconSize: [40, 40],
          iconAnchor: [20, 36],
        });
        const marker = L.marker([ent.lat, ent.lng], { icon });
        marker.on("click", () => onSelect(ent));
        group.addLayer(marker);
      });
    })();
    return () => {
      disposed = true;
    };
  }, [ready, enterprises, viewMode, activeId, onSelect]);

  useEffect(() => {
    if (!ready || !heatRef.current) return;
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !heatRef.current) return;
      const group = heatRef.current;
      group.clearLayers();
      if (viewMode !== "heatmap") return;

      const ents = enterprises.filter((e) => e.role !== "park");
      const demandCells = buildHeatCells(ents, "demand", heatCellDeg);
      const supplyCells = buildHeatCells(ents, "supply", heatCellDeg);

      const baseRadius =
        geoScope === "national" ? 90000 : geoScope === "province" ? 28000 : geoScope === "city" ? 5000 : 900;

      const paint = (
        cells: { lat: number; lng: number; w: number }[],
        color: string,
      ) => {
        cells.forEach((c) => {
          const intensity = Math.min(1, 0.25 + c.w * 0.22);
          const radius = baseRadius * (0.7 + Math.min(c.w, 4) * 0.28);
          // 多层半透明圆叠加，形成分布式热力晕染
          [1, 0.55, 0.28].forEach((scale, i) => {
            group.addLayer(
              L.circle([c.lat, c.lng], {
                radius: radius * scale,
                color,
                weight: 0,
                fillColor: color,
                fillOpacity: intensity * (0.22 - i * 0.05),
                interactive: false,
              }),
            );
          });
        });
      };

      paint(demandCells, "#ef4444");
      paint(supplyCells, "#16a34a");
    })();
    return () => {
      disposed = true;
    };
  }, [ready, viewMode, enterprises, heatCellDeg, geoScope]);

  useEffect(() => {
    if (!ready || !activeId || !mapRef.current) return;
    if (viewMode === "heatmap" || viewMode === "panorama" || viewMode === "chain") return;
    const ent = enterprises.find((e) => e.id === activeId);
    if (ent) {
      const z = geoScope === "national" ? 6 : geoScope === "province" ? 9 : geoScope === "city" ? 11 : 15;
      mapRef.current.flyTo([ent.lat, ent.lng], z, { duration: 0.5 });
    }
  }, [activeId, ready, enterprises, viewMode, geoScope]);

  return (
    <div className="imap-canvas-wrap">
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
  );
}
