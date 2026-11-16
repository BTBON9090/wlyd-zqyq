import type { CartItem, Product } from "../model";
import type { NewOrder } from "./types";

type CheckoutRow = { item: CartItem; product: Product | undefined };
type Recipient = { receiver: string; phone: string; region: string; street: string };

/** One checkout may contain only one server-issued supplier ID. */
export function buildSupplierOrders(
  rows: CheckoutRow[], recipient: Recipient, note: string,
  remarks: Record<string, string> = {},
): NewOrder[] {
  const groups = new Map<string, NewOrder>();
  for (const { item, product } of rows) {
    if (!product || !product.supplierId.trim() || !product.supplierName.trim()) {
      throw new Error("商品或供应商信息已变化，请刷新购物车后重试。");
    }
    let group = groups.get(product.supplierId);
    if (!group) {
      if (groups.size) throw new Error("一次仅允许结算一个供应商");
      group = {
        supplier: product.supplierName,
        receiver: recipient.receiver,
        phone: recipient.phone,
        address: recipient.region + " " + recipient.street,
        note: note.trim(),
        items: [],
      };
      groups.set(product.supplierId, group);
    }
    // Owner, buyer and final price are re-derived from these product IDs by the server.
    group.items.push({
      id: product.id, productId: product.id, name: product.name, sku: product.sku,
      brand: product.brand, model: product.model, spec: product.spec, unit: product.unit,
      quantity: item.quantity, price: product.price, taxRate: product.taxRate,
      shipped: 0, image: product.image, remark: remarks[item.productId] ?? item.remark,
    });
  }
  return [...groups.values()];
}
