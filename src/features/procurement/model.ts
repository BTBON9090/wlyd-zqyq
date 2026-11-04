import { z } from "zod";

// 客户端只接收可公开字段；成本、毛利和待审核资料不在此契约中。
export const productSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  parkId: z.string(),
  name: z.string(),
  categoryId: z.string(),
  category: z.string(),
  categoryGroup: z.string().optional(),
  categoryLeaf: z.string().optional(),
  brand: z.string(),
  sku: z.string(),
  spec: z.string(),
  unit: z.string(),
  image: z.string().optional(),
  description: z.string(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative(),
  minimum: z.number().int().positive(),
  increment: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  leadDays: z.number().int().nonnegative(),
  updatedAt: z.string(),
  sales: z.number().int().nonnegative().optional(),
  code: z.string().optional(),
  model: z.string().optional(),
  features: z.string().optional(),
  salesArea: z.string().optional(),
  freightMode: z.string().optional(),
  detailMedia: z
    .array(z.object({ type: z.enum(["image", "video"]), src: z.string() }))
    .optional(),
  deliveryOffers: z
    .array(
      z.object({
        region: z.string(),
        price: z.number().nonnegative(),
        stock: z.number().int().nonnegative(),
      }),
    )
    .optional(),
  attrs: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  images: z.array(z.string()).optional(),
});
export type Product = z.infer<typeof productSchema>;
export type CartItem = {
  productId: string;
  quantity: number;
  selected: boolean;
  remark: string;
};
// 订单模型等用户提供新的订单原型后再对齐。
export type ProcurementGateway = {
  products: (signal?: AbortSignal) => Promise<Product[]>;
};

export function validQuantity(product: Product, quantity: number) {
  return (
    Number.isSafeInteger(quantity) &&
    quantity >= product.minimum &&
    quantity <= product.stock &&
    (quantity - product.minimum) % product.increment === 0
  );
}
