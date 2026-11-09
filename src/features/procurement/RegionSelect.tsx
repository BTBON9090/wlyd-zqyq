import { useEffect, useId, useRef, useState } from "react";
import { CaretDown, CaretRight, Check, MapPin } from "@phosphor-icons/react";
import regions from "china-division/dist/pca-code.json";

const levels = ["省份", "城市", "区县"];
const cityPart = (name: string) => ["市辖区", "县"].includes(name) ? "" : name;
function initialPath(value: string) {
  const province = regions.find(p => value.startsWith(p.name));
  for (const c of province?.children ?? []) {
    const district = c.children.find(a => value.startsWith(province!.name + cityPart(c.name) + a.name));
    if (district) return [province!.code, c.code, district.code];
  }
  return [province?.code || "", "", ""];
}

export function RegionSelect({ value, onChange, compact = false }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  const menuId = useId();
  const root = useRef<HTMLFieldSetElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const choices = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string[]>([]);
  const [level, setLevel] = useState(0);
  const province = regions.find(p => p.code === path[0]);
  const city = province?.children.find(c => c.code === path[1]);
  const district = city?.children.find(a => a.code === path[2]);
  const names = [province?.name, city && (city.name === "市辖区" ? province?.name : city.name), district?.name];
  const options = level === 0 ? regions : level === 1 ? province?.children : city?.children;

  function toggle() {
    if (!open) {
      const saved = initialPath(value);
      setPath(saved);
      setLevel(saved[1] ? 2 : saved[0] ? 1 : 0);
    }
    setOpen(!open);
  }
  function choose(code: string, name: string) {
    if (level === 2 && province && city) {
      onChange(province.name + cityPart(city.name) + name);
      setOpen(false);
      trigger.current?.focus();
    } else if (level === 0) {
      const cities = regions.find(p => p.code === code)!.children;
      const onlyCity = cities.length === 1 ? cities[0].code : "";
      setPath([code, onlyCity, ""]);
      setLevel(onlyCity ? 2 : 1);
    } else {
      setPath([path[0], code, ""]);
      setLevel(2);
    }
  }
  useEffect(() => {
    if (!open) return;
    const closeOutside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", escape, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open || !choices.current) return;
    const selected = choices.current.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    (selected || choices.current.querySelector("button"))?.focus();
  }, [level, open]);

  return <fieldset ref={root} className={"buyer-region-select" + (compact ? " buyer-region-compact" : "")} onBlur={e => {
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  }}>
    <legend className={compact ? "sr-only" : undefined}>省市区</legend>
    <button type="button" ref={trigger} className="buyer-region-trigger" aria-label={'选择省市区' + (value ? '：' + value : '')}
      aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={toggle}>
      <MapPin size={17}/><span>{value || "请选择省、市、区"}</span><CaretDown size={16}/>
    </button>
    {open && <div className="buyer-region-menu" id={menuId} role="group" aria-label="选择省市区">
      <div className="buyer-region-path">
        {levels.map((label, i) => <div key={label}>
          {i > 0 && <CaretRight size={12} aria-hidden="true"/>}
          <button type="button" disabled={i > 0 && !path[i-1]} aria-current={level === i ? "step" : undefined}
            onClick={() => setLevel(i)} title={names[i] || label}>
            <small>{label}</small><span>{names[i] || '请选择'}</span>
          </button>
        </div>)}
      </div>
      <div className="buyer-region-options" ref={choices} key={level} role="group" aria-label={'选择' + levels[level]}>
        {options?.map(o => <button key={o.code} type="button" aria-pressed={path[level] === o.code}
          onClick={() => choose(o.code, o.name)}>
          {level === 1 && o.name === '市辖区' ? province?.name : o.name}
          {path[level] === o.code && <Check size={14}/>}
        </button>)}
      </div>
    </div>}
  </fieldset>;
}
