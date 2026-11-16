import test from "node:test";
import assert from "node:assert/strict";
import { buildSupplierOrders } from "../src/features/procurement/orders/buildSupplierOrders.ts";
import { orderSchema } from "../src/features/procurement/orders/types.ts";
import { productSchema } from "../src/features/procurement/model.ts";
import { findProductByCode } from "../src/features/procurement/productCode.ts";

const recipient = { receiver: "虚构采购员", phone: "13800000000", region: "演示区", street: "测试路1号" };
const product = (id, supplierId, supplierName = "同名测试店铺") => productSchema.parse({
  id, supplierId, supplierName, parkId: "park-a", name: `商品${id}`, categoryId: "office", category: "办公", brand: "测试", sku: `SKU-${id}`,
  spec: "标准", unit: "件", description: "测试商品", price: 12, originalPrice: 12, taxRate: 0, minimum: 1, increment: 1, stock: 10, leadDays: 1, updatedAt: "2026-11-06",
});
const row = (id, supplierId, quantity = 1) => ({ product: product(id, supplierId), item: { productId: id, quantity, selected: true, remark: `备注${id}` } });

test("one supplier produces one order preserving all quantities and remarks", () => {
  const rows = [row("A", "supplier-1", 2), row("C", "supplier-1")];
  const orders = buildSupplierOrders(rows, recipient, "  按批送货  ", { A: "结算页新备注" });
  assert.equal(orders.length, 1);
  assert.deepEqual(orders.map(order => order.items.map(item => item.productId)), [["A", "C"]]);
  assert.deepEqual(orders.map(order => order.items.map(item => item.quantity)), [[2, 1]]);
  assert.equal(orders[0].items[0].remark, "结算页新备注");
  assert.equal(orders[0].items[1].remark, "备注C");
  assert.equal(orders[0].note, "按批送货");
  assert.equal(orders[0].address, "演示区 测试路1号");
  for (const order of orders) {
    assert.equal(Object.hasOwn(order, "supplierId"), false, "server derives ownership from products");
    assert.equal(Object.hasOwn(order, "buyerId"), false, "server derives buyer from session");
    assert.equal(order.items.some(item => Object.hasOwn(item, "supplierId")), false);
  }
});

test("missing or unidentified supplier products abort grouping rather than partially submitting", () => {
  assert.throws(() => buildSupplierOrders([row("A", "supplier-1"), { product: undefined, item: { productId: "missing" } }], recipient, ""), /供应商信息已变化/);
  const invalid = row("B", "supplier-2");
  invalid.product.supplierId = " ";
  assert.throws(() => buildSupplierOrders([invalid], recipient, ""), /供应商信息已变化/);
  assert.equal(productSchema.safeParse({ ...product("A", "supplier-1"), supplierId: "" }).success, false);
});

test("order response preserves server supplier identity with legacy demo compatibility", () => {
  const group = buildSupplierOrders([row("A", "supplier-1")], recipient, "")[0];
  const response = { ...group, id: "O-1", supplier: "服务端确认的店铺", supplierId: "supplier-1", created: "2026-11-06", status: "pending_pay", shipments: [], items: group.items.map(item => ({ ...item, supplierId: "supplier-1" })) };
  const parsed = orderSchema.parse(response);
  assert.equal(parsed.supplierId, "supplier-1");
  assert.equal(parsed.items[0].supplierId, "supplier-1");
  assert.equal(parsed.supplier, "服务端确认的店铺");
  delete response.supplierId;
  delete response.items[0].supplierId;
  assert.equal(orderSchema.safeParse(response).success, true);
});

test("quick add rejects overlapping supplier SKUs instead of selecting the first supplier", () => {
  const a = { ...product("A", "supplier-1"), sku: "SAME-SKU" };
  const b = { ...product("B", "supplier-2"), code: "same-sku" };
  assert.throws(() => findProductByCode([a, b], " SAME-SKU "), /确认供应商/);
  assert.equal(findProductByCode([a, b], "sku-b").supplierId, "supplier-2");
  assert.equal(findProductByCode([a, b], "unknown"), undefined);
  assert.equal(findProductByCode([a, b], ""), undefined);
});

// Display names cannot be used to bypass the single-supplier rule.
test("different suppliers with identical shop names cannot be checked out together", () => {
  assert.throws(() => buildSupplierOrders([row("A", "supplier-1"), row("B", "supplier-2")], recipient, ""), /一次仅允许结算一个供应商/);
});
