import type { ProcurementGateway } from "../../features/procurement/model";
import { publishedProducts } from "./supplierFixture";
import { demoControls } from "../mockGateway";

// 复用现有验收工具的加载、空态和异常开关，不代表两端已实时同步。
export const mockProcurementGateway: ProcurementGateway = { products: async (signal) => {
  if (demoControls.delay) await new Promise<void>((resolve, reject) => {
    const done = () => { signal?.removeEventListener("abort", abort); resolve(); };
    const timer = window.setTimeout(done, demoControls.delay);
    const abort = () => { window.clearTimeout(timer); reject(new Error("请求已取消")); };
    if (signal?.aborted) abort(); else signal?.addEventListener("abort", abort, { once:true });
  });
  if (!navigator.onLine || demoControls.fault === "error") throw new Error("商品暂时无法加载，请稍后重试");
  if (demoControls.fault === "empty") return [];
  return publishedProducts;
} };
