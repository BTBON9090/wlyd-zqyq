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
    const update = () => {
      frame = 0;
      const headerHeight = header?.getBoundingClientRect().height || 72;
      root.style.setProperty("--list-header-height", `${headerHeight}px`);
      // Shorten the sidebar at the footer instead of pushing its navigation behind the header.
      if (sidebar?.parentElement) {
        const bottom = sidebar.parentElement.getBoundingClientRect().bottom;
        root.style.setProperty(
          "--list-sidebar-height",
          `${Math.max(120, Math.min(window.innerHeight, bottom) - headerHeight - 32)}px`,
        );
      }
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
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);
}
