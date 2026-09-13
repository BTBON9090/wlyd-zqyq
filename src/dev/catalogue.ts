import { z } from "zod";
import { serviceSchema } from "../lib/models";
import source from "./prototype/services.json";
/** 由原型 PublishedService 导出，仅在演示构建加载，禁止当作真实成交/评价。 */
export const catalogue = z.array(serviceSchema).parse(source);
