import assert from "node:assert/strict";
import { supplierProducts, toPublicProduct, publishedProducts } from "../src/dev/procurement/supplierFixture.ts";
import { validQuantity } from "../src/features/procurement/model.ts";

import { quote, lineAmounts, totals, locateRegion } from "../src/features/procurement/delivery.ts";

const park = "PARK-DEMO-001";
assert.equal(publishedProducts.length, 5);
for (const id of ["JC-PRODUCT-003", "JC-PRODUCT-004", "JC-PRODUCT-005", "JC-PRODUCT-006"]) {
  assert(!publishedProducts.some((product) => product.id === id), `${id} 不应展示`);
}
assert.equal(toPublicProduct(supplierProducts[0], "another-park"), null);
assert.equal(toPublicProduct(supplierProducts[6], park)?.price, 124.07, "调价审核时使用当前生效价格");
assert(!("cost" in publishedProducts[0]), "采购成本不得出现在客户端模型");
assert.equal(publishedProducts[1].sales, 13, "销量应保留供应商演示样例中的数据");
assert.equal(publishedProducts[1].code, "SP20260002");
assert.equal(publishedProducts[1].model, "型号 2");
assert.equal(publishedProducts[1].unit, "件", "单位应与供应商样例一致");
assert.equal(publishedProducts[0].price, 50.85, "生效含税销售价应按税率计算");
const quantityProduct = {...publishedProducts[0], minimum:3, increment:2, stock:8};
assert(validQuantity(quantityProduct, 3));
assert(validQuantity(quantityProduct, 5));
assert(!validQuantity(quantityProduct, 4));
assert(!validQuantity(quantityProduct, 9));
assert(!validQuantity(quantityProduct, 3.5));
console.log("集采园区可见性、已生效价格、公开字段和购买数量检查通过。");

const helmet = publishedProducts[0];
const local = quote(helmet, "上海市浦东新区临港");
const regional = quote(helmet, "苏州市工业园区");
assert.equal(regional.price,51.11);
assert.equal(regional.stock,86);
assert(!validQuantity(regional,87) && validQuantity(local,87));
assert.deepEqual(lineAmounts(local,2), {gross:10170,net:9000,tax:1170});
assert.deepEqual(totals([{product:local,item:{quantity:2}},{product:publishedProducts[1],item:{quantity:1}}]),{gross:16475,net:14580,tax:1895});
assert.equal(locateRegion(31.324,120.706,10),"苏州市工业园区");
assert.equal(locateRegion(31.324,120.706,15000),undefined);
assert.equal(locateRegion(20,100,10),undefined);
console.log("配送报价、定位边界与逐行税额核对通过。");
