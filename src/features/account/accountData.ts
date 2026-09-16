import { http } from "../../lib/api";
import { accountDataSchema, type AccountGateway } from "./accountModels";
export * from "./accountModels";
const production: AccountGateway = {
  load: () => http("/account/commerce", accountDataSchema),
  act: (action, key) => http("/account/commerce/actions", accountDataSchema, { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(action) }),
};
export const accountGateway: AccountGateway = __DEMO__ ? (await import("../../dev/accountGateway")).accountGateway : production;
export const currency = (value: number) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", useGrouping: false }).format(value);
