import { z } from "zod";

// 客户端只接收可公开字段；成本、毛利和待审核资料不在此契约中。
export const productSchema = z.object({
  id: z.string(), supplierId: z.string(), supplierName: z.string(), parkId: z.string(),
  name: z.string(), categoryId: z.string(), category: z.string(), brand: z.string(),
  sku: z.string(), spec: z.string(), unit: z.string(), image: z.string().optional(),
  description: z.string(), price: z.number().nonnegative(), originalPrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative(), minimum: z.number().int().positive(),
  increment: z.number().int().positive(), stock: z.number().int().nonnegative(),
  leadDays: z.number().int().nonnegative(), updatedAt: z.string(),
});
export type Product = z.infer<typeof productSchema>;
export type CartItem = { productId: string; quantity: number };
// 订单模型等用户提供新的订单原型后再对齐。
export type ProcurementGateway = { products: (signal?: AbortSignal) => Promise<Product[]> };

export function validQuantity(product: Product, quantity: number) {
  return Number.isSafeInteger(quantity) && quantity >= product.minimum && quantity <= product.stock && (quantity - product.minimum) % product.increment === 0;
}
