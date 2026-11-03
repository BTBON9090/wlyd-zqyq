import categories from "./prototypeCategories.json";

// 产品提供的原型类目与运营内容，仅供演示布局；正式数据由园区与供应商接口提供。
export const prototypeCategories = categories;
export const prototypeSlides = [
  { tag:"政企联采 · 企业采购", title:"把采购难题交给专业平台", subtitle:"汇集园区供应商商品，查看供货条件并按需采购。", badges:["供应商商品","供货信息可查","按需选择"], action:"探索集采商品", image:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80" },
  { tag:"绿色制造 · 节能降碳专场", title:"绿色低碳产线节能备件联合招标会", subtitle:"工业智能变频器、高效螺杆空压机、节能工矿灯等商品集中展示。", badges:["工业备件","节能产品","供货条件清晰","采购信息可查"], action:"查看节能集采专区", image:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80" },
  { tag:"生产备件 · 供需对接", title:"园区工业品与备件采购专区", subtitle:"浏览生产备件与工业耗材，了解供应商与商品信息。", badges:["生产备件","工业耗材","园区供应商"], action:"浏览相关商品", image:"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80" },
];

// 原型中的资讯仅用于展示内容结构，不代表实际园区公告。
export const prototypeBulletins = {
 news:[{tag:"签约",title:"经开区高端装备园三期管网铸铁件集采完成签约 (2860万元)",time:"10分钟前"},{tag:"公告",title:"2026年第二批规上制造企业集采专项补贴申报已开启",time:"1小时前"},{tag:"到货",title:"中心仓新到防爆电机与低压电气现货500台，次日达",time:"2小时前"},{tag:"专班",title:"管委会供应链专班累计助力园区企业协议降本超1200万",time:"昨天"}],
 tenders:[{tag:"寻源",title:"邯郸某大型汽配企业紧急寻源CNC硬质合金刀具300套",time:"15分钟前"},{tag:"竞价",title:"经开区新能源电池PACK产线标准化周转托盘公开竞价",time:"3小时前"},{tag:"年标",title:"智能仓储立体库专用高强度防静电缠绕膜年标征集",time:"5小时前"},{tag:"询价",title:"304特种内六角螺栓月度框架集中协议供货询价开启",time:"昨天"}],
 prices:[{tag:"调价",title:"Q235B热卷经开区协议指导价今日下浮20元/吨",time:"09:30"},{tag:"指数",title:"工业紧固件集采综合价格指数报104.2 (环比持平)",time:"09:00"},{tag:"现货",title:"46#重负荷抗磨液压油现货协议价直降8%",time:"昨天"},{tag:"补贴",title:"经开区企业使用数字人民币结算集采订单享1%补贴",time:"3天前"}],
};
