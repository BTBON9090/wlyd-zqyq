import type { CartItem, Product } from "./model";

type CartRow = { item: CartItem; product: Product | undefined };

// Supplier IDs define ownership; identical display names must remain separate.
export function groupCartRows(rows: CartRow[]) {
  const groups = new Map<string | null, { id: string | null; name: string; rows: CartRow[] }>();
  for (const row of rows) {
    const id = row.product?.supplierId || null;
    let group = groups.get(id);
    if (!group) {
      group = { id, name: row.product?.supplierName || "已失效商品", rows: [] };
      groups.set(id, group);
    }
    group.rows.push(row);
  }
  return [...groups.values()];
}

export function selectCartItems(items: CartItem[], ids: string[], selected: boolean) {
  const targets = new Set(ids);
  return items.map(item => targets.has(item.productId) ? { ...item, selected } : item);
}
