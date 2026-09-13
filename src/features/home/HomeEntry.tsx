import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
const V1 = lazy(() => import("./HomePage"));
const V2 = lazy(() => import("./HomeV2Page"));
const V3 = lazy(() => import("./HomeV3Page"));
const versions = [
  { id: "v1", label: "V1 · 原版首页" },
  { id: "v2", label: "V2 · 专题首页" },
  { id: "v3", label: "V3 · 品牌展示" },
] as const;
type Version = (typeof versions)[number]["id"];
const isVersion = (value: string | null | undefined): value is Version =>
  versions.some((item) => item.id === value);
function savedVersion() {
  try {
    const value = localStorage.getItem("park-home-version");
    return isVersion(value) ? value : "v3";
  } catch {
    return "v3";
  }
}
export default function HomeEntry() {
  const [params, setParams] = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);
  const picker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pickerOpen) return;
    picker.current
      ?.querySelector<HTMLButtonElement>(
        '.home-version-options button[aria-pressed="true"]',
      )
      ?.focus();
    const close = (event: MouseEvent) => {
      if (!picker.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPickerOpen(false);
        picker.current
          ?.querySelector<HTMLButtonElement>(".home-version-switch")
          ?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [pickerOpen]);
  const preferred = params.get("home");
  const version = __DEMO__
    ? isVersion(preferred)
      ? preferred
      : savedVersion()
    : isVersion(import.meta.env.VITE_HOME_VERSION)
      ? (import.meta.env.VITE_HOME_VERSION as Version)
      : "v2";
  const Page = version === "v1" ? V1 : version === "v2" ? V2 : V3;
  function switchVersion(next: Version) {
    try {
      localStorage.setItem("park-home-version", next);
    } catch {
      /* URL 仍然可以切换 */
    }
    setParams((current) => {
      const updated = new URLSearchParams(current);
      updated.set("home", next);
      return updated;
    });
    setPickerOpen(false);
    picker.current
      ?.querySelector<HTMLButtonElement>(".home-version-switch")
      ?.focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  return (
    <>
      <Suspense fallback={<div className="loading-page">正在加载首页…</div>}>
        <Page />
      </Suspense>
      {__DEMO__ && (
        <div ref={picker} className="home-version-picker">
          {pickerOpen && (
            <div
              className="home-version-options"
              id="home-version-options"
              role="group"
              aria-label="选择首页版本"
            >
              {versions.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={version === item.id}
                  onClick={() => switchVersion(item.id)}
                >
                  {item.label}
                  <span>{version === item.id ? "当前" : "切换"}</span>
                </button>
              ))}
            </div>
          )}
          <button
            className="home-version-switch"
            onClick={() => setPickerOpen(!pickerOpen)}
            aria-label={`当前首页 ${version.toUpperCase()}，选择首页版本`}
            aria-expanded={pickerOpen}
            aria-controls="home-version-options"
          >
            <span>{version.toUpperCase()}</span>
            <div>
              <strong>首页版本对比</strong>
              <small>V1 / V2 / V3 · 点击切换</small>
            </div>
            <b aria-hidden="true">⇄</b>
          </button>
        </div>
      )}
    </>
  );
}
