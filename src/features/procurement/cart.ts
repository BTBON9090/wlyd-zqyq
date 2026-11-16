import { selectCartItems } from "./cartGroups";
import { UAT } from "../../uat/api";
import { useUat } from "../../uat/UatSessionProvider";
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
type ParkCartItem = CartItem & { parkId?: string };
export function useCart() {
  const uat = useUat();
  const parkId = uat.user?.currentParkId || "";
  const [localItems, setItems] = useState(() => UAT ? [] : read());
  useEffect(() => {
    if (UAT) return;
    const refresh = () => setItems(read());
    window.addEventListener("park:procurement-cart", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("park:procurement-cart", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  const cloudItems = Array.isArray(uat.entries.cart.value) ? uat.entries.cart.value as ParkCartItem[] : [];
  const items = UAT ? cloudItems.filter(i => i.parkId === parkId) : localItems;
  const mutate = async (change: (items: CartItem[]) => CartItem[]) => {
    if (!UAT) { write(change(read())); return true; }
    return uat.update("cart", (value: unknown) => {
      const all = Array.isArray(value) ? value as ParkCartItem[] : [];
      return [...all.filter(i => i.parkId !== parkId), ...change(all.filter(i => i.parkId === parkId)).map(i => ({ ...i, parkId }))];
    });
  };
  const add = async (product: Product, quantity: number) => {
    const saved = await mutate(now => {
      const old = now.find(item => item.productId === product.id);
      const nextQuantity = (old?.quantity || 0) + quantity;
      if (!validQuantity(product, nextQuantity)) throw new Error("合并后的数量不符合起订量、递增量或库存要求，请在购物车中调整");
      return old ? now.map(item => item.productId === product.id ? { ...item, quantity: nextQuantity, selected: true } : item) : [...now, { productId: product.id, quantity, selected: true, remark: "" }];
    });
    if (!saved) throw new Error("购物车修改已保留在本页面，但尚未保存到云端，请处理上方同步提示。");
  };
  const update = (productId: string, quantity: number) => mutate(now => now.map(i => i.productId === productId ? { ...i, quantity } : i));
  const select = (productId: string, selected: boolean) => mutate(now => now.map(i => i.productId === productId ? { ...i, selected } : i));
  const selectMany = (ids: string[], selected: boolean) => mutate(now => selectCartItems(now, ids, selected));
  const selectAll = (selected: boolean) => mutate(now => now.map(i => ({ ...i, selected })));
  const remark = (productId: string, remark: string) => mutate(now => now.map(i => i.productId === productId ? { ...i, remark: remark.slice(0, 200) } : i));
  const remove = (ids: string[]) => mutate(now => now.filter(i => !ids.includes(i.productId)));
  return { items, add, update, select, selectMany, selectAll, remark, remove, synced: !UAT || (uat.entries.cart.loaded && !uat.entries.cart.saving && !uat.entries.cart.revision), count: items.reduce((n, i) => n + i.quantity, 0) };
}
