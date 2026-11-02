import { useEffect, type ReactNode } from "react";
/** 首页方案已固定为 V4 品牌首页；商城内页沿用 v3 皮肤。 */
export type DesignVersion = "v4";
type CommerceVersion = "v1" | "v2" | "v3";
const commerceVersion: CommerceVersion = "v3";
export function DesignVersionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.designVersion = commerceVersion;
    return () => { delete document.documentElement.dataset.designVersion; };
  }, []);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reduced.matches) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(".button.primary") : null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--button-x", `${event.clientX - rect.left}px`);
      target.style.setProperty("--button-y", `${event.clientY - rect.top}px`);
      target.style.setProperty("--v3-light-x", `${event.clientX - rect.left}px`);
      target.style.setProperty("--v3-light-y", `${event.clientY - rect.top}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, []);
  return <>{children}</>;
}
export const useDesignVersion = () => ({ version: "v4" as DesignVersion, commerceVersion });
