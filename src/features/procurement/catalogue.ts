import { SHARED_PROCUREMENT, sharedParkId } from "./sharedApi";
import { UAT } from "../../uat/api";
import { useUat } from "../../uat/UatSessionProvider";
import { useQuery } from "@tanstack/react-query";
import { procurementGateway } from "./gateway";
import type { Product } from "./model";

export const prototype = UAT || __DEMO__ ? await import("../../dev/procurement/prototypeCatalogue") : null;
export type Category = { id:string; name:string; groups?:{name:string;items:string[]}[] };
export const aliases:Record<string,string> = {security:"safety_ppe",cleaning:"energy_saving",tools:"fasteners_hardware",office:"office_supplies"};
export function useProducts() {
  const { user } = useUat();
  return useQuery({ queryKey: UAT ? ["procurement-products", user?.id, user?.currentParkId] : SHARED_PROCUREMENT ? ["procurement-products", sharedParkId] : ["procurement-products"], queryFn: ({signal}) => procurementGateway.products(signal), enabled: !UAT || !!user?.currentParkId, retry:false, ...(SHARED_PROCUREMENT ? { staleTime:0, refetchOnWindowFocus:true } : {}) });
}
export function getCategories(products:Product[]):Category[] {
  const categories:Category[]=(prototype?.prototypeCategories||[]).map(c=>({...c,groups:c.groups.map(g=>({...g,items:[...g.items]}))}));
  for(const p of products){
    let c=categories.find(c=>c.id===p.categoryId);
    if(!c){c={id:p.categoryId,name:p.category,groups:[]};categories.push(c);}
    if(!p.categoryGroup)continue;
    const groups=c.groups||=[];let g=groups.find(g=>g.name===p.categoryGroup);
    if(!g){g={name:p.categoryGroup,items:[]};groups.push(g);}
    if(p.categoryLeaf&&!g.items.includes(p.categoryLeaf))g.items.push(p.categoryLeaf);
  }
  return categories;
}
export function resolveCategory(raw:string,categories:Category[]) {
  return raw!=="all"&&!categories.some((c)=>c.id===raw)?aliases[raw]||raw:raw;
}
