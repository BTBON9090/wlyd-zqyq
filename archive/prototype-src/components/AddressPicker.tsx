import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { reverseGeocode } from "../data/onboarding";

type AddressValue = {
  address: string;
  lat: number | null;
  lng: number | null;
};

export function AddressPicker({
  value,
  onChange,
  onSearch,
}: {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  onSearch: (query: string) => AddressValue | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState(value.address);
  const [error, setError] = useState("");

  onChangeRef.current = onChange;

  useEffect(() => {
    setQuery(value.address);
  }, [value.address]);

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
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;

      const center: [number, number] = [value.lat ?? 30.8892, value.lng ?? 121.9265];
      map = L.map(el, { center, zoom: 14, zoomControl: false });
      L.tileLayer(
        "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
        { subdomains: "1234", maxZoom: 18, attribution: "&copy; 高德地图" },
      ).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        // 展示用地址描述；经纬度仅写入数据字段
        onChangeRef.current(reverseGeocode(lat, lng));
      });

      mapRef.current = map;
      setReady(true);
      window.setTimeout(() => map?.invalidateSize(), 120);
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
      markerRef.current = null;
      host.replaceChildren();
      setReady(false);
    };
    // 仅初始化一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || value.lat == null || value.lng == null) return;
    const lat = value.lat;
    const lng = value.lng;
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !mapRef.current) return;
      const map = mapRef.current;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
      map.setView([lat, lng], map.getZoom());
    })();
    return () => {
      disposed = true;
    };
  }, [ready, value.lat, value.lng]);

  const handleSearch = () => {
    setError("");
    const result = onSearch(query);
    if (!result || result.lat == null || result.lng == null) {
      setError("未找到该地址，请换关键词或在地图上点击选点");
      return;
    }
    onChange(result);
  };

  const located = value.lat != null && value.lng != null && value.address.trim().length > 0;

  return (
    <div className="address-picker">
      <div className="auth-otp-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="输入地址关键词查询，或在地图上点击定位"
          aria-label="办公地址"
        />
        <button type="button" className="btn btn-outline" onClick={handleSearch}>
          查询定位
        </button>
      </div>
      {error && <div className="auth-error" style={{ marginTop: 8 }}>{error}</div>}

      {located && (
        <div className="address-result">
          <div className="address-result-main">
            <span className="address-result-label">办公地点</span>
            <strong>{value.address}</strong>
          </div>
          {/* 经纬度仅作存储展示，不参与地址文案 */}
          <div className="address-result-coords" title="坐标已保存，用于地图定位">
            坐标已保存
          </div>
        </div>
      )}

      <div className="address-map">
        <div ref={hostRef} className="map-host" />
      </div>
      <p className="form-hint">
        {located
          ? "已根据查询/地图选点写入办公地址；经纬度仅后台存储用于定位。"
          : "请输入地址查询，或点击地图选点。界面展示具体地址，经纬度自动保存。"}
      </p>
    </div>
  );
}
