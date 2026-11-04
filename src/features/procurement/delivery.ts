import type { Product } from "./model";

export type Address = {
  id: string;
  receiver: string;
  phone: string;
  region: string;
  street: string;
};
export type Book = {
  entries: Address[];
  selected: string;
  region: string;
  defaultId?: string;
};
export const blankBook: Book = { entries: [], selected: "", region: "" };
// Local coverage areas for the sample catalogue. Location only suggests an area,
// never an unverified street address. Published offers use the exact area key.
export const zones = [
  { name: "上海市浦东新区临港", lat: 30.9, lon: 121.92, radius: 12 },
  { name: "苏州市工业园区", lat: 31.324, lon: 120.706, radius: 9 },
];
export function locateRegion(lat: number, lon: number, accuracy: number) {
  return zones.find(
    (z) =>
      Math.hypot(
        (lat - z.lat) * 111,
        (lon - z.lon) * 111 * Math.cos((lat * Math.PI) / 180),
      ) +
        accuracy / 1000 <=
      z.radius,
  )?.name;
}
export function quote(product: Product, region: string) {
  const offer = product.deliveryOffers?.find((o) => o.region === region);
  return offer
    ? { ...product, price: offer.price, stock: offer.stock }
    : product;
}
// Round once per line so displayed tax + net reconciles to the gross amount.
export function lineAmounts(product: Product, quantity: number) {
  const gross = Math.round(product.price * 100) * quantity;
  const net = Math.round(gross / (1 + product.taxRate / 100));
  return { gross, net, tax: gross - net };
}
export function totals(
  rows: { product?: Product; item: { quantity: number } }[],
) {
  return rows.reduce(
    (a, { product, item }) => {
      if (!product) return a;
      const l = lineAmounts(product, item.quantity);
      return {
        gross: a.gross + l.gross,
        net: a.net + l.net,
        tax: a.tax + l.tax,
      };
    },
    { gross: 0, net: 0, tax: 0 },
  );
}
