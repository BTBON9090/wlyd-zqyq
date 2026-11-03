import { useQuery } from "@tanstack/react-query";
import { procurementGateway } from "./gateway";
import type { Product } from "./model";

export const prototype = __DEMO__ ? await import("../../dev/procurement/prototypeCatalogue") : null;
export type Category = { id:string; name:string; groups?:{name:string;items:string[]}[] };
export const aliases:Record<string,string> = {security:"safety_ppe",cleaning:"energy_saving",tools:"fasteners_hardware",office:"office_supplies"};
export function useProducts() { return useQuery({queryKey:["procurement-products"],queryFn:({signal})=>procurementGateway.products(signal),retry:false}); }
export function getCategories(products:Product[]):Category[] {
  const live:Category[]=[...new Map(products.map((p)=>[p.categoryId,{id:p.categoryId,name:p.category}])).values()];
  return prototype ? [...prototype.prototypeCategories,...live.filter((item)=>!prototype.prototypeCategories.some((c)=>c.id===item.id))] : live;
}
export function resolveCategory(raw:string,categories:Category[]) {
  return raw!=="all"&&!categories.some((c)=>c.id===raw)?aliases[raw]||raw:raw;
}
