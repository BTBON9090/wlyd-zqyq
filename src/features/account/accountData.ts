import { UAT } from "../../uat/api";
import { http } from "../../lib/api";
import { accountDataSchema, type AccountGateway } from "./accountModels";
export * from "./accountModels";
const production: AccountGateway = {
  load: () => http("/account/commerce", accountDataSchema),
  act: (action, key) => http("/account/commerce/actions", accountDataSchema, { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(action) }),
};
const unconnected: AccountGateway = { load: async () => (await import("./reviewedAccountExample")).reviewedAccountExample(), act: async () => { throw new Error("此模块仍为界面演示，尚未接入业务服务，操作未提交。"); } };
export const accountGateway: AccountGateway = UAT ? unconnected : __DEMO__ ? (await import("../../dev/accountGateway")).accountGateway : production;
export { currency } from "../../lib/money";
