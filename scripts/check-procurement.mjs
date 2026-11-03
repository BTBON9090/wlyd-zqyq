import assert from "node:assert/strict";
import { supplierProducts, toPublicProduct, publishedProducts } from "../src/dev/procurement/supplierFixture.ts";
import { validQuantity } from "../src/features/procurement/model.ts";

const park = "PARK-DEMO-001";
assert.equal(publishedProducts.length, 5);
for (const id of ["JC-PRODUCT-003", "JC-PRODUCT-004", "JC-PRODUCT-005", "JC-PRODUCT-006"]) {
  assert(!publishedProducts.some((product) => product.id === id), `${id} 不应展示`);
}
assert.equal(toPublicProduct(supplierProducts[0], "another-park"), null);
assert.equal(toPublicProduct(supplierProducts[6], park)?.price, 124.07, "调价审核时使用当前生效价格");
assert(!("cost" in publishedProducts[0]), "采购成本不得出现在客户端模型");
const quantityProduct = {...publishedProducts[0], minimum:3, increment:2, stock:8};
assert(validQuantity(quantityProduct, 3));
assert(validQuantity(quantityProduct, 5));
assert(!validQuantity(quantityProduct, 4));
assert(!validQuantity(quantityProduct, 9));
assert(!validQuantity(quantityProduct, 3.5));
console.log("集采园区可见性、已生效价格、公开字段和购买数量检查通过。");
