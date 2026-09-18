import { useEffect, type RefObject } from "react";

/** Keep list controls below the actual navigation height, including mobile menus. */
export function useStickyList(
  ref: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return;
    const header = document.querySelector<HTMLElement>(".site-header");
    const sidebar = root.querySelector<HTMLElement>(
      ".service-v2-sidebar, .v3-account-sidebar",
    );
    let frame = 0;
    // 侧栏内部滚动区：高度被页脚压缩时，需要让用户看出下面还有菜单。
    const scrollers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-sidebar-scroll]"),
    );
    const update = () => {
      frame = 0;
      const headerHeight = header?.getBoundingClientRect().height || 72;
      root.style.setProperty("--list-header-height", `${headerHeight}px`);
      // Shorten the sidebar at the footer instead of pushing its navigation behind the header.
      if (sidebar?.parentElement) {
        const bottom = sidebar.parentElement.getBoundingClientRect().bottom;
        const height = Math.max(
          120,
          Math.min(window.innerHeight, bottom) - headerHeight - 32,
        );
        root.style.setProperty("--list-sidebar-height", `${height}px`);
        // 空间不够时先让出底部辅助卡片，把高度留给菜单。
        root.dataset.sidebarCompact = String(height < 360);
      }
      scrollers.forEach((element) => {
        const overflowing = element.scrollHeight > element.clientHeight + 1;
        element.dataset.overflow = String(overflowing);
        element.dataset.atEnd = String(
          !overflowing ||
            element.scrollTop + element.clientHeight >=
              element.scrollHeight - 1,
        );
      });
      root
        .querySelectorAll<HTMLElement>("[data-list-sticky]")
        .forEach((element) => {
          const top = Number.parseFloat(getComputedStyle(element).top);
          element.dataset.stuck = String(
            Number.isFinite(top) &&
              element.getBoundingClientRect().top <= top + 1,
          );
        });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    if (header) observer.observe(header);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // 滚动事件不冒泡，侧栏滚动区要单独监听。
    scrollers.forEach((element) =>
      element.addEventListener("scroll", schedule, { passive: true }),
    );
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      scrollers.forEach((element) =>
        element.removeEventListener("scroll", schedule),
      );
      cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);
}
