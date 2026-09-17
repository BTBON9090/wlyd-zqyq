import { useLayoutEffect } from "react";

/**
 * Publish the real navigation height as `--site-header-height` so sticky layers
 * (首页二层吸顶导航、详情页目录) sit right below the header instead of guessing
 * from the static `--header-height` token, which is smaller than the V3/V4 header.
 */
export function useHeaderHeight() {
  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      root.style.setProperty(
        "--site-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(header);
    window.addEventListener("resize", schedule);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      root.style.removeProperty("--site-header-height");
    };
  }, []);
}
