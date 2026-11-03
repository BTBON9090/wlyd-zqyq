import { productSchema, type Product } from "../../features/procurement/model.ts";

// 模拟供应商端 Product / Supply 的生效快照；不读取另一个站点的浏览器数据。
type Supply = { leadDays:number; minimum:number; increment:number; stock:number; tax:number; cost:number; original:number; promotion:"none"|"discount"|"fixed"; discount:number; fixed:number };
type SupplierProduct = { id:string; name:string; categoryId:string; category:string; sku:string; unit:string; image?:string; status:"draft"|"reviewing"|"rejected"|"on_sale"|"offline"|"price_review"; parkStatuses:Record<string,"on_sale"|"offline"|"reviewing"|"rejected">; parks:Record<string,Supply>; updatedAt:string };
const parkId = "PARK-DEMO-001";
const supply = (index:number):Supply => ({leadDays:3,minimum:1,increment:1,stock:120+index*30,tax:13,cost:30+index*8,original:50+index*12,promotion:"discount",discount:90,fixed:90});
const item = (index:number, name:string, categoryId:string, category:string, unit:string, status:SupplierProduct["status"], parkStatus:SupplierProduct["parkStatuses"][string], image?:string):SupplierProduct => ({ id:`JC-PRODUCT-${String(index+1).padStart(3,"0")}`,name,categoryId,category,sku:`SKU-${10001+index}`,unit,image,status,parkStatuses:{[parkId]:parkStatus},parks:{[parkId]:supply(index)},updatedAt:"2026-10-28" });
export const supplierProducts:SupplierProduct[] = [
  item(0,"安全防护帽","security","安全防护","顶","on_sale","on_sale","media/procurement/helmet.svg"),
  item(1,"防护手套","security","安全防护","双","on_sale","on_sale"),
  item(2,"工业防护眼镜","security","安全防护","副","reviewing","reviewing"),
  item(3,"一次性防护口罩","security","安全防护","盒","rejected","rejected"),
  item(4,"绝缘工具套装","tools","工具设施","套","offline","offline"),
  item(5,"办公打印纸","office","办公用品","箱","draft","on_sale"),
  item(6,"工业清洁剂","cleaning","清洁耗材","桶","price_review","on_sale"),
  item(7,"防滑安全鞋","security","安全防护","双","on_sale","on_sale"),
  item(8,"劳保工作服","security","安全防护","套","on_sale","on_sale"),
];
const round = (n:number) => Math.round(n*100)/100;
export function toPublicProduct(source:SupplierProduct, activeParkId:string):Product|null {
  const current=source.parks[activeParkId];
  // 园区独立状态为准；调价审核期间继续使用已生效供货数据。
  if (source.status === "draft" || source.parkStatuses[activeParkId] !== "on_sale" || !current) return null;
  const sale=current.promotion === "discount" ? current.original*current.discount/100 : current.promotion === "fixed" ? current.fixed : current.original;
  return productSchema.parse({ id:source.id, supplierId:"SUP-DEMO-001",supplierName:"园区集采供应商",parkId:activeParkId,name:source.name,categoryId:source.categoryId,category:source.category,brand:"",sku:source.sku,spec:"标准款",unit:source.unit,image:source.image,description:"商品规格与供货信息以供应商发布为准。",price:round(sale*(1+current.tax/100)),originalPrice:round(current.original*(1+current.tax/100)),taxRate:current.tax,minimum:current.minimum,increment:current.increment,stock:current.stock,leadDays:current.leadDays,updatedAt:source.updatedAt });
}
export const publishedProducts = supplierProducts.map((item)=>toPublicProduct(item,parkId)).filter((item):item is Product=>item!==null);
