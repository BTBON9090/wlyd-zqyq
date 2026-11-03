import { useEffect, useState } from "react";
import { validQuantity, type CartItem, type Product } from "./model";

const key = "park-procurement-cart-v1";
function read(): CartItem[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? raw.filter((i): i is CartItem => typeof i?.productId === "string" && Number.isSafeInteger(i.quantity) && i.quantity > 0).map((i)=>({productId:i.productId,quantity:i.quantity,selected:i.selected!==false,remark:typeof i.remark==="string"?i.remark.slice(0,200):""})) : [];
  } catch { return []; }
}
function write(items: CartItem[]) {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event("park:procurement-cart"));
}
export function useCart() {
  const [items, setItems] = useState(read);
  useEffect(() => {
    const refresh = () => setItems(read());
    window.addEventListener("park:procurement-cart", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("park:procurement-cart", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  const add = (product: Product, quantity: number) => {
    const now = read(); const old = now.find((item) => item.productId === product.id);
    const nextQuantity = (old?.quantity || 0) + quantity;
    if (!validQuantity(product, nextQuantity)) throw new Error("合并后的数量不符合起订量、递增量或库存要求，请在购物车中调整");
    write(old ? now.map((item) => item.productId === product.id ? { ...item, quantity: nextQuantity, selected:true } : item) : [...now, { productId: product.id, quantity, selected:true, remark:"" }]);
  };
  const update = (productId: string, quantity: number) => write(read().map((i) => i.productId === productId ? { ...i, quantity } : i));
  const select = (productId:string, selected:boolean) => write(read().map((i)=>i.productId===productId?{...i,selected}:i));
  const selectAll = (selected:boolean) => write(read().map((i)=>({...i,selected})));
  const remark = (productId:string, remark:string) => write(read().map((i)=>i.productId===productId?{...i,remark:remark.slice(0,200)}:i));
  const remove = (ids: string[]) => write(read().filter((i) => !ids.includes(i.productId)));
  return { items, add, update, select, selectAll, remark, remove, count: items.reduce((n, i) => n + i.quantity, 0) };
}
