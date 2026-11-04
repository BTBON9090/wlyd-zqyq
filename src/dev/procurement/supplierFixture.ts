import { productSchema, type Product } from "../../features/procurement/model.ts";

// 模拟供应商端 Product / Supply 的生效快照；不读取另一个站点的浏览器数据。
type Supply = { leadDays:number; minimum:number; increment:number; stock:number; tax:number; cost:number; original:number; promotion:"none"|"discount"|"fixed"; discount:number; fixed:number };
type SupplierProduct = { id:string; name:string; categoryId:string; category:string; sku:string; code:string; model:string; brand:string; sales:number; features:string; unit:string; image?:string; status:"draft"|"reviewing"|"rejected"|"on_sale"|"offline"|"price_review"; parkStatuses:Record<string,"on_sale"|"offline"|"reviewing"|"rejected">; parks:Record<string,Supply>; updatedAt:string };
const parkId = "PARK-DEMO-001";
const supply = (index:number):Supply => ({leadDays:3,minimum:1,increment:1,stock:120+index*30,tax:13,cost:30+index*8,original:50+index*12,promotion:"discount",discount:90,fixed:90});
const item = (index:number, name:string, categoryId:string, category:string, _unit:string, status:SupplierProduct["status"], parkStatus:SupplierProduct["parkStatuses"][string], image?:string):SupplierProduct => ({ id:`JC-PRODUCT-${String(index+1).padStart(3,"0")}`,name,categoryId,category,sku:`SKU-${10001+index}`,code:`SP${20260001+index}`,model:`型号 ${index+1}`,brand:"3M",sales:index*13,features:"适用于企业日常采购与安全防护。",unit:"件",image,status,parkStatuses:{[parkId]:parkStatus},parks:{[parkId]:supply(index)},updatedAt:new Date(Date.now()-index*86400000).toISOString() });
export const supplierProducts:SupplierProduct[] = [
  item(0,"安全防护帽","safety_ppe","劳保安防与车间防护","顶","on_sale","on_sale","media/procurement/helmet.svg"),
  item(1,"防护手套","safety_ppe","劳保安防与车间防护","双","on_sale","on_sale"),
  item(2,"工业防护眼镜","safety_ppe","劳保安防与车间防护","副","reviewing","reviewing"),
  item(3,"一次性防护口罩","safety_ppe","劳保安防与车间防护","盒","rejected","rejected"),
  item(4,"绝缘工具套装","fasteners_hardware","工业紧固与五金机电","套","offline","offline"),
  item(5,"办公打印纸","office_supplies","数字化办公与企服耗材","箱","draft","on_sale"),
  item(6,"工业清洁剂","energy_saving","节能环保与厂房维保","桶","price_review","on_sale"),
  item(7,"防滑安全鞋","safety_ppe","劳保安防与车间防护","双","on_sale","on_sale"),
  item(8,"劳保工作服","safety_ppe","劳保安防与车间防护","套","on_sale","on_sale"),
];
const round = (n:number) => Math.round(n*100)/100;
export function toPublicProduct(source:SupplierProduct, activeParkId:string):Product|null {
  const current=source.parks[activeParkId];
  // 园区独立状态为准；调价审核期间继续使用已生效供货数据。
  if (source.status === "draft" || source.parkStatuses[activeParkId] !== "on_sale" || !current) return null;
  const sale=current.promotion === "discount" ? current.original*current.discount/100 : current.promotion === "fixed" ? current.fixed : current.original;
  // Demo SKUs use their actual product type, not a more specific technical grade.
  const ppeGroups:Record<string,string>={"安全防护帽":"头部面部与呼吸","防护手套":"手部与高空防坠","防滑安全鞋":"防护服与安全鞋","劳保工作服":"防护服与安全鞋"};
  const group=source.categoryId==="safety_ppe"?ppeGroups[source.name]:source.name==="工业清洁剂"?"厂房清洁与保养":undefined;
  return productSchema.parse({ ...(source.id==="JC-PRODUCT-001"?{
    images:["helmet-side","helmet-top","helmet-liner","helmet-brim"].map(n=>"media/procurement/"+n+".svg"),
    deliveryOffers:[{region:"苏州市工业园区",price:51.11,stock:86},{region:"上海市浦东新区临港",price:round(sale*(1+current.tax/100)),stock:current.stock}],
  }:{}), categoryGroup:group,categoryLeaf:group?source.name:undefined,id:source.id, supplierId:"SUP-DEMO-001",supplierName:"园区集采供应商",parkId:activeParkId,name:source.name,categoryId:source.categoryId,category:source.category,brand:source.brand,sku:source.sku,code:source.code,model:source.model,sales:source.sales,features:source.features,freightMode:"免运费",spec:"标准款",unit:source.unit,image:source.image,description:"商品规格与供货信息以供应商发布为准。",price:round(sale*(1+current.tax/100)),originalPrice:round(current.original*(1+current.tax/100)),taxRate:current.tax,minimum:current.minimum,increment:current.increment,stock:current.stock,leadDays:current.leadDays,updatedAt:source.updatedAt });
}
export const publishedProducts = supplierProducts.map((item)=>toPublicProduct(item,parkId)).filter((item):item is Product=>item!==null);
