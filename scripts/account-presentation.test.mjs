import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptanceTime,
  orderAmounts,
} from "../src/features/account/orderPresentation.ts";

test("discounted installment balance uses the agreed amount", () => {
  assert.deepEqual(
    orderAmounts({ total: 38000, discount: 10000, paid: 18000, refunded: 0 }),
    {
      payable: 28000,
      remaining: 10000,
      netPaid: 18000,
      paymentLabel: "部分付款",
    },
  );
});
test("a partial refund does not turn a settled order into an unpaid order", () => {
  assert.deepEqual(orderAmounts({ total: 6000, paid: 6000, refunded: 2000 }), {
    payable: 6000,
    remaining: 0,
    netPaid: 4000,
    paymentLabel: "已结清",
  });
});
test("currency rounding and zero receipts remain distinct", () => {
  assert.equal(
    orderAmounts({ total: 0.3, discount: 0.1, paid: 0.2, refunded: 0 })
      .remaining,
    0,
  );
  assert.equal(
    orderAmounts({ total: 2000, paid: 0, refunded: 0 }).paymentLabel,
    "未付款",
  );
});
test("acceptance clock uses the absolute deadline and never displays negative time", () => {
  const deadline = "2026-09-23T18:00:00+08:00";
  assert.equal(
    acceptanceTime(deadline, Date.parse("2026-09-22T17:59:59+08:00")),
    "1天 00:00:01",
  );
  assert.equal(acceptanceTime(deadline, Date.parse(deadline)), null);
  assert.equal(
    acceptanceTime(deadline, Date.parse("2026-09-24T18:00:00+08:00")),
    null,
  );
  assert.equal(acceptanceTime("invalid", Date.now()), null);
});
