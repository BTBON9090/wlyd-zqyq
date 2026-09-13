import { useEffect, useMemo, useState } from "react";
import {
  formatParkLocation,
  getCities,
  getParkById,
  getParksByCity,
  getProvinces,
  parks,
} from "../data/parks";

type ParkPickerProps = {
  value: string;
  onChange: (parkId: string) => void;
  locked?: boolean;
  title?: string;
};

export function ParkPicker({ value, onChange, locked, title = "选择省市及园区" }: ParkPickerProps) {
  const selected = getParkById(value);
  const [province, setProvince] = useState(selected?.province ?? "");
  const [city, setCity] = useState(selected?.city ?? "");

  useEffect(() => {
    if (parks.length === 1) {
      const only = parks[0];
      setProvince(only.province);
      setCity(only.city);
      onChange(only.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const park = getParkById(value);
    if (!park) return;
    setProvince(park.province);
    setCity(park.city);
  }, [value]);

  const provinces = getProvinces();
  const cities = useMemo(() => (province ? getCities(province) : []), [province]);
  const cityParks = useMemo(
    () => (province && city ? getParksByCity(province, city) : []),
    [province, city],
  );

  if (locked && selected) {
    return (
      <section>
        <h3>{title || "入驻园区"}</h3>
        <div className="auth-notice auth-notice--ok">
          已根据邀请码定位：{selected.name}
          <span> · {formatParkLocation(selected)}</span>
        </div>
      </section>
    );
  }

  const applyCity = (prov: string, nextCity: string) => {
    setCity(nextCity);
    const list = getParksByCity(prov, nextCity);
    if (list.length === 1) {
      onChange(list[0].id);
    } else {
      onChange("");
    }
  };

  const handleProvince = (next: string) => {
    setProvince(next);
    onChange("");
    if (!next) {
      setCity("");
      return;
    }
    const nextCities = getCities(next);
    if (nextCities.length === 1) {
      applyCity(next, nextCities[0]);
    } else {
      setCity("");
    }
  };

  const singlePark = parks.length <= 1;

  return (
    <section>
      <h3>{title}</h3>
      <div className="form-grid">
        <label>
          <span>省份 *</span>
          <select
            required
            disabled={singlePark}
            value={province}
            onChange={(e) => handleProvince(e.target.value)}
          >
            <option value="">请选择省份</option>
            {provinces.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>城市 *</span>
          <select
            required
            disabled={singlePark || !province}
            value={city}
            onChange={(e) => {
              const nextCity = e.target.value;
              if (!nextCity) {
                setCity("");
                onChange("");
                return;
              }
              applyCity(province, nextCity);
            }}
          >
            <option value="">{province ? "请选择城市" : "请先选择省份"}</option>
            {cities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="span-2">
          <span>园区 *</span>
          <select
            required
            disabled={singlePark || !city}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{city ? "请选择园区" : "请先选择城市"}</option>
            {cityParks.map((park) => (
              <option key={park.id} value={park.id}>
                {park.name}（{park.district}）
              </option>
            ))}
          </select>
          {selected && (
            <em className="form-hint" style={{ display: "block", marginTop: 6 }}>
              {formatParkLocation(selected)} · {selected.intro}
            </em>
          )}
          {singlePark && <em className="form-hint">当前仅一个园区，已自动选定</em>}
        </label>
      </div>
    </section>
  );
}
