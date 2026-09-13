import { z } from "zod";
const media = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["image", "video", "file"]),
  url: z.string().optional(),
});
export const versionSchema = z.object({
  id: z.string(),
  name: z.string(),
  sellingPoints: z.string(),
  highlights: z.array(z.string()),
  price: z.number().nonnegative(),
  unit: z.string(),
  startAfterPayDays: z.number().nonnegative(),
  startDayType: z.string(),
  fulfillmentType: z.enum([
    "once_pay_once_accept",
    "installment_pay_installment_accept",
  ]),
  deliveryCycleDays: z.number().nonnegative(),
  deliveryStandard: z.string(),
  phases: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      settleRatio: z.number().min(0).max(100),
      deliveryCycleDays: z.number().nonnegative(),
      deliveryStandard: z.string(),
    }),
  ),
});
export const publishedServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  intro: z.string(),
  categoryL1: z.string(),
  categoryL2: z.string(),
  categoryL3: z.string(),
  serviceAreaLabel: z.string(),
  coverUrl: z.string().optional(),
  media: z.array(media),
  taxRate: z.number(),
  versions: z.array(versionSchema),
  detailContent: z.string(),
  detailGuarantee: z.string(),
  detailImages: z.array(media),
  relatedCases: z.array(
    z.object({
      id: z.string(),
      categoryPath: z.string(),
      title: z.string(),
      intro: z.string(),
      coverUrl: z.string().optional(),
    }),
  ),
  faqs: z.array(
    z.object({ id: z.string(), question: z.string(), answer: z.string() }),
  ),
  reviews: z.array(
    z.object({
      id: z.string(),
      scope: z.enum(["service", "shop"]),
      buyerName: z.string(),
      score: z.number(),
      content: z.string(),
      tags: z.array(z.string()).optional(),
      createdAt: z.string(),
      serviceName: z.string().optional(),
      reply: z.string().optional(),
    }),
  ),
  salesCount: z.number().nonnegative(),
  rating: z.number().min(0).max(5),
  shop: z.object({
    id: z.string(),
    name: z.string(),
    intro: z.string(),
    phone: z.string(),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    badges: z.array(z.string()),
    score: z.number(),
    halfYearDeals: z.number(),
    employerCount: z.number(),
    completeRate: z.number(),
    introImages: z.array(media),
    teamImages: z.array(media),
  }),
});
export type PublishedService = z.infer<typeof publishedServiceSchema>;
export type ServiceVersion = z.infer<typeof versionSchema>;
export const money = (value: number) =>
  value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
