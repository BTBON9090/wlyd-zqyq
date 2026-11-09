import type { Product } from "./model";

/** Supplier SKUs may overlap; a quick-add code must identify exactly one product. */
export function findProductByCode(products: Product[], input: string): Product | undefined {
  const code = input.trim().toLowerCase();
  if (!code) return undefined;
  const matches = products.filter(product =>
    [product.sku, product.code].some(value => value?.trim().toLowerCase() === code),
  );
  if (matches.length > 1) {
    throw new Error("多个商品使用该编码，请到集采商城确认供应商后选择商品。");
  }
  return matches[0];
}
