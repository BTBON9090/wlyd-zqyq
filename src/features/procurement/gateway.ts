import { z } from "zod";
import { http } from "../../lib/api";
import { productSchema, type ProcurementGateway } from "./model";
import { SHARED_PROCUREMENT, sharedRequest } from "./sharedApi";

// 拟议接口：实际路径、权限、服务端定价及园区上下文须与后端确认。
const api: ProcurementGateway = {
  products: (signal) => http("/procurement/products", z.array(productSchema), { signal }),
};
const shared: ProcurementGateway = { products: signal => sharedRequest("/products", z.array(productSchema), { signal }) };
export const procurementGateway: ProcurementGateway = SHARED_PROCUREMENT ? shared : __DEMO__
  ? (await import("../../dev/procurement/mockGateway")).mockProcurementGateway
  : api;
