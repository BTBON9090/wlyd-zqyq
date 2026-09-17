import { accountDataSchema, type AccountData, type AccountGateway, type Invoice, type Order, type Refund } from "../features/account/accountModels";
import { catalogue } from "./catalogue";
import { mockGateway, demoControls } from "./mockGateway";
import { readStored, writeStored } from "../lib/storage";

function seed(): AccountData {
  // 20 条演示订单：前 8 条保留原有编号、服务与日期，便于既有本地记录按 id 归并。
  const ids = ["s6","s7","s3","x1-name","s2","s9","s1","s5","s4","s8","s10","s11","s12","s13","s14","x2-desc","x3-company","s15","s16","s17"];
  const states: Order["status"][] = ["serving","accepting","completed","signing","completed","pending","closed","completed","completed","serving","completed","completed","pending","signing","completed","completed","completed","accepting","serving","completed"];
  const orders: Order[] = ids.map((id, i) => {
    const s = catalogue.find(item => item.id === id)!;
    const total = [8000,80000,2400,38000,8160,30000,980,6000,3600,15000,25000,2000,15000,12000,3000,1280,2560,4800,9800,15000][i];
    const paid = [3000,80000,2400,18000,8160,0,980,6000,3600,10000,25000,1500,0,12000,3000,1280,2560,4800,5000,13000][i];
    const discount = [0,0,0,10000,0,2000,0,0,0,0,0,500,0,0,0,0,0,0,0,2000][i];
    const refunded = [0,0,0,0,0,0,980,2000,0,0,5000,800,0,0,2000,800,0,0,0,2600][i];
    const day = ["2026-09-12","2026-09-11","2026-09-10","2026-09-09","2026-09-08","2026-09-07","2026-09-06","2026-09-05","2026-09-04","2026-09-02","2026-08-30","2026-08-27","2026-08-25","2026-08-21","2026-08-18","2026-08-12","2026-08-06","2026-07-29","2026-07-22","2026-07-15"][i];
    const delivered = ["","2026-09-13 16:40","2026-09-13 16:40","","2026-09-13 16:40","","","2026-09-13 16:40","2026-09-09 16:40","","2026-09-14 11:20","2026-09-03 15:10","","","2026-08-28 10:05","2026-08-25 09:30","2026-09-01 09:40","2026-09-12 17:30","","2026-08-20 14:50"][i];
    return { id: `864005128910${43+i}`, serviceId: s.id, name: s.name, provider: s.provider, image: s.image, category: s.category,
      paymentMode: [0,1,3,9,18].includes(i) ? "installments" : "once",
      discount,
      payments: i === 0 ? [{label:"首期",amount:3000,paidAt:"2026-09-12"}] : i === 1 ? [{label:"首期",amount:30000,paidAt:"2026-09-11"},{label:"尾款",amount:50000,paidAt:"2026-09-13"}] : i === 9 ? [{label:"首期",amount:6000,paidAt:"2026-09-02"},{label:"尾款",amount:4000,paidAt:"2026-09-10"}] : i === 18 ? [{label:"首期",amount:3000,paidAt:"2026-07-22"},{label:"尾款",amount:2000,paidAt:"2026-08-05"}] : undefined,
      ...(i === 1 ? {acceptanceDeadline:"2026-09-23T18:00:00+08:00",autoAccept:true} : i === 17 ? {acceptanceDeadline:"2026-09-20T18:00:00+08:00",autoAccept:false} : {}),
      spec: s.published?.versions[0]?.name || "标准服务", quantity: 1, total, paid, refunded,
      createdAt: `${day} 09:30:45`, deliveryDays: [15,30,7,60,30,20,10,15,5,20,45,12,30,25,10,15,30,15,12,30][i], phases: [2,2,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1][i], status: states[i],
      progress: [{title:"订单已创建",date:`${day} 09:30`,detail:"服务需求已提交，等待服务商确认。"}, ...(paid ? [{title:"服务方案已确认",date:`${day} 14:20`,detail:"已确认服务范围、交付周期与费用安排。"}] : []), ...(states[i] === "accepting" || states[i] === "completed" ? [{title:"交付成果已提交",date:delivered,detail:"服务商已完成约定服务内容，提交交付成果。"}] : [])] };
  });
  // 20 条售后：覆盖处理中/协商中/已退款/被驳回/已取消与三种退款类型。
  const at = (i: number) => ({ orderId: orders[i].id, name: orders[i].name, provider: orders[i].provider });
  const refunds: Refund[] = [
    {id:"AF202609160042", ...at(1), amount:20000, reason:"部分接口范围调整", note:"服务商已提出退款金额调整方案，等待您确认。", description:"库存接口已完成联调；剩余采购对接范围发生变化，申请退还未实施部分费用。", createdAt:"2026-09-16 10:20:00",status:"processing",kind:"partial",proposal:{amount:16000,reason:"已完成需求梳理与接口设计，相关工作费用为4000元，建议退还剩余16000元。",createdAt:"2026-09-16 15:30:00",status:"pending"},history:[{title:"提交售后申请",date:"2026-09-16 10:20:00",detail:"申请部分退款20000元。"},{title:"服务商提出协商方案",date:"2026-09-16 15:30:00",detail:"建议退款16000元，请核对已完成的服务范围。"}]},
    {id:"AF202609120089", ...at(6), amount:980, reason:"企业业务调整，协商终止服务",note:"退款已原路退回。",createdAt:"2026-09-12 10:15:20",status:"refunded" as const,kind:"terminate" as const},
    {id:"AF202609130015", ...at(0), amount:1000,reason:"交付范围与约定不一致",note:"已交付初稿，请补充具体修改项和相关材料后重新提交。",createdAt:"2026-09-13 14:10:00",status:"rejected" as const},
    {id:"AF202609110031", ...at(7),amount:2000,reason:"减少部分设计物料",note:"双方已确认调整范围，部分款项已退回。",createdAt:"2026-09-11 16:45:00",status:"refunded" as const,kind:"partial" as const},
    {id:"AF202609100068", ...at(2),amount:800,reason:"服务周期调整",note:"申请人已取消本次售后申请。",createdAt:"2026-09-10 14:30:10",status:"cancelled" as const},
    {id:"AF202609090137", ...at(3), amount:3000, reason:"品牌方案方向调整", description:"标志方向与内部评审意见不一致，申请退还未进入延展设计的部分费用。", note:"服务商已提出退款金额调整方案，等待您确认。", createdAt:"2026-09-09 11:05:00",status:"processing",kind:"partial",proposal:{amount:2000,reason:"已完成品牌调研与两轮标志提案，相关工作费用为1000元，建议退还2000元。",createdAt:"2026-09-09 17:40:00",status:"pending"},history:[{title:"提交售后申请",date:"2026-09-09 11:05:00",detail:"申请部分退款3000元。"},{title:"服务商提出协商方案",date:"2026-09-09 17:40:00",detail:"建议退款2000元，请核对已完成的设计阶段。"}]},
    {id:"AF202609080024", ...at(8), amount:1200, reason:"入职人员数量少于约定", note:"服务商已按实际到岗人数重新结算，请核对后重新提交。", createdAt:"2026-09-08 15:20:00",status:"rejected" as const,kind:"partial" as const},
    {id:"AF202609060091", ...at(9), amount:5000, reason:"投放计划缩减", description:"第二期投放暂缓，申请退还尚未执行的投放费用。", note:"申请已提交，等待服务商审核。", createdAt:"2026-09-06 09:50:00",status:"processing",kind:"partial" as const},
    {id:"AF202609040055", ...at(10), amount:5000, reason:"培训场次由四场减为三场", note:"双方已确认调整范围，部分款项已退回。", createdAt:"2026-09-04 16:30:00",status:"refunded" as const,kind:"partial" as const},
    {id:"AF202609020118", ...at(11), amount:800, reason:"复检项目取消", note:"复检费用已原路退回。", createdAt:"2026-09-02 14:05:00",status:"refunded" as const,kind:"partial" as const},
    {id:"AF202608300076", ...at(13), amount:2000, reason:"开户周期超出预期", note:"申请人已取消本次售后申请。", createdAt:"2026-08-30 10:40:00",status:"cancelled" as const},
    {id:"AF202608280041", ...at(14), amount:2000, reason:"代账服务提前终止", description:"公司已完成财务人员招聘，申请终止剩余月份的代账服务。", note:"已按实际服务月份结算，剩余款项已退回。", createdAt:"2026-08-28 09:15:00",status:"refunded" as const,kind:"terminate" as const,history:[{title:"提交售后申请",date:"2026-08-28 09:15:00",detail:"申请终止服务并退款2000元。"},{title:"服务商确认结算",date:"2026-08-29 11:20:00",detail:"按实际服务月份结算，退款2000元。"}]},
    {id:"AF202608260013", ...at(15), amount:800, reason:"商标类别调整", note:"已按调整后的类别重新递交，差额部分已退回。", createdAt:"2026-08-26 15:35:00",status:"refunded" as const,kind:"partial" as const},
    {id:"AF202608240082", ...at(16), amount:1280, reason:"申报未通过，申请部分退款", description:"申报材料被退回，与服务商就前期材料费用存在分歧。", note:"申请已提交，等待服务商审核。", createdAt:"2026-08-24 13:25:00",status:"processing",kind:"partial" as const},
    {id:"AF202608200036", ...at(17), amount:2000, reason:"交付节奏与约定不一致", note:"服务商已补充提交应用示例，请确认后再决定是否退款。", createdAt:"2026-08-20 10:10:00",status:"rejected" as const,kind:"partial" as const},
    {id:"AF202608180104", ...at(18), amount:2000, reason:"抽检批次减少", description:"生产计划调整，年度委托抽检的批次数量减少。", note:"申请已提交，等待服务商审核。", createdAt:"2026-08-18 16:45:00",status:"processing",kind:"partial" as const},
    {id:"AF202608160029", ...at(19), amount:2600, reason:"海外市场范围收缩", note:"双方已确认调整范围，部分款项已退回。", createdAt:"2026-08-16 11:30:00",status:"refunded" as const,kind:"partial" as const},
    {id:"AF202609050063", ...at(17), amount:1500, reason:"应用示例范围缩减", description:"内部已确定暂不制作办公物料与对外模板，申请退还相应费用。", note:"申请已提交，等待服务商审核。", createdAt:"2026-09-05 15:55:00",status:"processing",kind:"partial" as const},
    {id:"AF202609070047", ...at(0), amount:1000, reason:"交付范围与约定不一致", description:"补充了具体修改项与相关材料，重新提交本次申请。", note:"申请已重新提交，等待服务商审核。", createdAt:"2026-09-07 10:25:00",status:"processing" as const,history:[{title:"重新提交售后申请",date:"2026-09-07 10:25:00",detail:"补充材料后重新申请退款1000元。"}]},
    {id:"AF202609030022", ...at(2), amount:800, reason:"服务周期调整", description:"合同服务期与内部安排冲突，重新提交退款申请。", note:"申请已重新提交，等待服务商审核。", createdAt:"2026-09-03 09:40:00",status:"processing" as const},
  ];
  // 20 条开票记录：分期订单按付款阶段分开启票，金额取净支付额（已扣减退款）。
  const invoiceStates: Record<number, Invoice["status"]> = {0:"available",1:"available",2:"available",3:"available",4:"issued",7:"available",8:"issued",9:"available",10:"issued",11:"processing",13:"processing",14:"available",15:"processing",16:"available",17:"available",18:"available",19:"issued"};
  const invoices: Invoice[] = [];
  for (const i of [0,1,2,3,4,7,8,9,10,11,13,14,15,16,17,18,19]) {
    const order = orders[i];
    const status = invoiceStates[i];
    const stages = order.payments?.length ? order.payments : [{label:"",amount:order.paid-order.refunded,paidAt:order.createdAt.slice(0,10)}];
    stages.forEach((stage, index) => {
      const submitted = status !== "available";
      invoices.push({ id:`INV-${order.id}${stages.length > 1 ? `-${index+1}` : ""}`, orderId:order.id, amount:stage.amount, status,
        ...(submitted ? {title:"河北启程科技有限公司",taxId:"91130100MA07Q8KJ3X",email:"finance@example.com"} : {}),
        ...(status === "issued" ? {number:`26130900000000816${String(i*2+index).padStart(3,"0")}`,issuedAt:stage.paidAt} : {}) });
    });
  }
  for (const order of orders) {
    order.contact = {name:"企业服务专员"};
    order.contract = {name:`${order.name}服务合同`,status:["pending","signing"].includes(order.status)?"pending":"signed",...(!["pending","signing"].includes(order.status)?{signedAt:order.createdAt.slice(0,10)}:{})};
    order.deliveries = Array.from({length:order.phases},(_,index)=>({name:order.phases>1?`第${index+1}阶段 · ${index===0?"方案与实施":"联调与交付"}`:"服务成果交付",status:order.status==="completed"?"accepted" as const:order.status==="accepting"?"submitted" as const:order.status==="serving"&&index===0?"working" as const:"waiting" as const,standard:index===0?"按合同约定完成服务范围，提供成果说明与核对清单。":"完成联调验证，提交交付说明与验收清单。",...(["accepting","completed"].includes(order.status)?{submittedAt:"2026-09-13 16:40:00",fileName:`${order.name}交付说明.pdf`}:{})}));
  }
  return { orders, refunds, invoices, reviews:[
    {id:"REV-01",orderId:orders[4].id,direction:"sent",score:5,content:"沟通及时，申报材料核对仔细，交付符合约定。",createdAt:"2026-09-14 10:30:00",anonymous:false,hidden:false,followup:{content:"后续问题也得到了耐心解答。",createdAt:"2026-09-16 14:00:00",hidden:false}},
    {id:"REV-02",orderId:orders[7].id,direction:"sent",score:4,content:"设计整体满意，调整后的交付范围已确认。",createdAt:"2026-09-15 11:20:00",anonymous:true,hidden:false,reply:"感谢反馈，我们会继续完善服务。"},
    {id:"REV-03",orderId:orders[4].id,direction:"received",score:5,content:"资料提供完整，需求清晰，沟通与验收配合顺畅。",createdAt:"2026-09-15 09:20:00",anonymous:false,hidden:false},
    {id:"REV-04",orderId:orders[8].id,direction:"sent",score:5,content:"入职手续办理很快，材料清单一次说明清楚，没有反复补件。",createdAt:"2026-09-10 15:40:00",anonymous:false,hidden:false},
    {id:"REV-05",orderId:orders[11].id,direction:"sent",score:4,content:"检测报告数据完整，复检沟通也顺畅，周期比预期略长几天。",createdAt:"2026-09-05 10:10:00",anonymous:false,hidden:false,reply:"检测排期受样品数量影响，已为您优先安排后续批次。"},
    {id:"REV-06",orderId:orders[14].id,direction:"sent",score:5,content:"代账会计响应及时，月初申报提醒到位，票据整理规范。",createdAt:"2026-09-01 09:50:00",anonymous:false,hidden:false,followup:{content:"终止服务时结算也很清楚，没有额外费用。",createdAt:"2026-09-02 10:30:00",hidden:false}},
    {id:"REV-07",orderId:orders[16].id,direction:"sent",score:3,content:"申报材料撰写专业，但进度同步偏慢，需要主动追问。",createdAt:"2026-09-03 16:20:00",anonymous:true,hidden:false,reply:"已增加关键节点主动同步，感谢指正。"},
    {id:"REV-08",orderId:orders[2].id,direction:"received",score:5,content:"需求描述准确，合同与材料回传及时，服务范围确认高效。",createdAt:"2026-08-30 11:15:00",anonymous:false,hidden:false},
    {id:"REV-09",orderId:orders[3].id,direction:"received",score:4,content:"品牌方向明确，评审意见集中，方案推进顺利。",createdAt:"2026-08-29 14:35:00",anonymous:false,hidden:false},
    {id:"REV-10",orderId:orders[5].id,direction:"received",score:4,content:"咨询目标清晰，内部决策链短，对接过程顺畅。",createdAt:"2026-08-27 10:05:00",anonymous:true,hidden:false},
    {id:"REV-11",orderId:orders[6].id,direction:"received",score:5,content:"配合度高，物料反馈及时，终止服务时也按约定完成结算。",createdAt:"2026-08-25 09:30:00",anonymous:false,hidden:false},
    {id:"REV-12",orderId:orders[9].id,direction:"received",score:5,content:"预算与目标说明清楚，投放素材提供及时，验收标准明确。",createdAt:"2026-08-22 16:50:00",anonymous:false,hidden:false},
    {id:"REV-13",orderId:orders[10].id,direction:"received",score:4,content:"培训需求梳理到位，参训名单与场地安排都提前确认。",createdAt:"2026-08-21 15:25:00",anonymous:false,hidden:false},
    {id:"REV-14",orderId:orders[12].id,direction:"received",score:5,content:"工程需求明确，现场条件配合到位，安全要求交代清楚。",createdAt:"2026-08-19 11:40:00",anonymous:false,hidden:false},
    {id:"REV-15",orderId:orders[13].id,direction:"received",score:4,content:"出海目标市场清晰，资料准备充分，沟通节奏稳定。",createdAt:"2026-08-17 14:10:00",anonymous:true,hidden:false},
    {id:"REV-16",orderId:orders[15].id,direction:"received",score:5,content:"商标类别调整沟通顺畅，材料补充及时，配合度高。",createdAt:"2026-08-15 10:55:00",anonymous:false,hidden:false},
    {id:"REV-17",orderId:orders[17].id,direction:"received",score:4,content:"品牌基础素材提供完整，评审节奏稳定，改稿意见明确。",createdAt:"2026-08-13 16:05:00",anonymous:false,hidden:false},
    {id:"REV-18",orderId:orders[18].id,direction:"received",score:5,content:"来料批次信息准确，取样配合及时，检测要求说明清楚。",createdAt:"2026-08-10 09:20:00",anonymous:false,hidden:false},
    {id:"REV-19",orderId:orders[19].id,direction:"received",score:5,content:"海外布局目标明确，决策效率高，是很好合作的客户。",createdAt:"2026-08-05 15:45:00",anonymous:false,hidden:false},
    {id:"REV-20",orderId:orders[1].id,direction:"received",score:4,content:"系统对接需求描述专业，测试环境提供及时，验收标准可量化。",createdAt:"2026-08-02 11:30:00",anonymous:false,hidden:true},
  ] };
}
const keys = new Set<string>();
async function current() {
  if (!navigator.onLine) throw new Error("网络已断开，请联网后重试");
  const user = await mockGateway.session();
  if (!user) throw new Error("请登录后查看企业服务记录");
  const key = `commerce-v3:${user.id}`;
  const initial = seed();
  const data = readStored(key, accountDataSchema, initial);
  // Add newly supported metadata to existing local records without resetting changes.
  for (const order of data.orders) {
    const original = initial.orders.find(item => item.id === order.id);
    if (!original) continue;
    order.discount ??= original.discount;
    order.paymentMode ??= original.paymentMode;
    order.payments ??= original.payments;
    order.acceptanceDeadline ??= original.acceptanceDeadline;
    order.autoAccept ??= original.autoAccept;
    order.contract ??= original.contract;
    order.deliveries ??= original.deliveries;
    order.contact ??= original.contact;
  }
  const enrichedKey = `${key}:extended-v2`;
  if (!localStorage.getItem(enrichedKey)) {
    // 补入新增的演示记录：保留用户已产生的改动，用户自己新建的记录仍排在前面。
    const merge = <T extends { id: string }>(seeded: T[], stored: T[]) => [
      ...stored.filter(item => !seeded.some(record => record.id === item.id)),
      ...seeded.map(record => stored.find(item => item.id === record.id) ?? record),
    ];
    data.orders = merge(initial.orders, data.orders);
    data.refunds = merge(initial.refunds, data.refunds);
    data.invoices = merge(initial.invoices, data.invoices);
    data.reviews = merge(initial.reviews, data.reviews);
    if (writeStored(key, data)) localStorage.setItem(enrichedKey, "1");
  }
  const receipts = await mockGateway.receipts();
  for (const receipt of receipts) {
    if (data.orders.some(order => order.id === receipt.id)) continue;
    const s = catalogue.find(item => item.id === receipt.serviceId);
    data.orders.unshift({id:receipt.id,serviceId:receipt.serviceId,name:receipt.serviceName,provider:s?.provider || "服务商",image:s?.image,category:s?.category || "企业服务",spec:receipt.versionName || "需求沟通",quantity:receipt.quantity || 1,total:(s?.priceMin || 0)*(receipt.quantity || 1),paid:0,refunded:0,createdAt:receipt.createdAt.replace("T"," ").slice(0,19),deliveryDays:0,phases:1,status:receipt.status === "closed" ? "closed" : "pending",progress:[{title:"需求已提交",date:receipt.createdAt.slice(0,10),detail:receipt.requirement}]});
  }
  return {key,data};
}
export const accountGateway: AccountGateway = {
  load: async () => { const {data} = await current(); if (demoControls.fault === "error") throw new Error("服务记录暂时无法加载"); return demoControls.fault === "empty" ? {orders:[],refunds:[],invoices:[],reviews:[]} : data; },
  act: async (action, requestKey) => {
    const {key,data} = await current();
    if (keys.has(requestKey)) return data;
    if (demoControls.failNext) { demoControls.failNext=false; throw new Error("提交失败，请重试。已填写内容已保留。"); }
    if (action.type === "accept") {
      const order = data.orders.find(o=>o.id===action.orderId);
      if (!order || order.status !== "accepting") throw new Error("订单状态已变化，请刷新后重试");
      order.status="completed";
      order.progress.push({title:"验收完成",date:new Date().toLocaleString("zh-CN"),detail:"您已确认服务成果验收通过。"});
      if (!data.invoices.some(i=>i.orderId===order.id)) data.invoices.push({id:`INV-${order.id}`,orderId:order.id,amount:order.paid-order.refunded,status:"available"});
    } else if (action.type === "refund") {
      const order=data.orders.find(o=>o.id===action.orderId);
      if (!order || order.status === "closed" || !Number.isFinite(action.amount) || action.amount <= 0 || action.amount > order.paid-order.refunded || action.reason.trim().length < 5) throw new Error("请检查退款金额和申请原因");
      if (data.invoices.some(i=>i.orderId===order.id && i.status !== "available")) throw new Error("订单已进入开票流程，请联系服务商协商红冲后退款");
      if (data.refunds.some(r=>r.orderId===order.id && r.status === "processing")) throw new Error("该订单已有处理中申请，请勿重复提交");
      const existing=action.refundId ? data.refunds.find(r=>r.id===action.refundId && r.orderId===order.id && r.status === "rejected") : undefined;
      if (action.refundId && !existing) throw new Error("售后状态已更新，请刷新后重试");
      if (existing) Object.assign(existing,{status:"processing",amount:action.amount,reason:action.reason,description:action.description,note:"申请已重新提交，等待服务商审核。"});
      else data.refunds.unshift({id:`AF${Date.now()}`,orderId:order.id,name:order.name,provider:order.provider,amount:action.amount,reason:action.reason,description:action.description,note:"申请已提交，等待服务商审核。",createdAt:new Date().toLocaleString("zh-CN"),status:"processing"});
    } else if (action.type === "cancelRefund") {
      const refund=data.refunds.find(r=>r.id===action.refundId);
      if (!refund || !["processing","rejected"].includes(refund.status)) throw new Error("当前申请无法取消");
      refund.status="cancelled"; refund.note="申请人已取消本次申请。";
    } else if (action.type === "refundProposal") {
      const refund=data.refunds.find(r=>r.id===action.refundId);
      const order=data.orders.find(o=>o.id===refund?.orderId);
      if (!refund || !order || refund.status!=="processing" || refund.proposal?.status!=="pending") throw new Error("协商方案已更新，请刷新后重试");
      refund.proposal.status=action.accept?"accepted":"rejected";
      const detail=action.accept?`您已同意退款${refund.proposal.amount}元，等待退款处理。`:"您已拒绝本次调整，等待服务商继续协商。";
      if(action.accept) refund.amount=refund.proposal.amount;
      refund.note=detail;
      refund.history ??=[];
      refund.history.push({title:action.accept?"已同意协商方案":"已拒绝协商方案",date:new Date().toLocaleString("zh-CN"),detail});
    } else if (action.type === "review") {
      const order=data.orders.find(o=>o.id===action.orderId);
      if (!order || order.status!=="completed" || data.reviews.some(r=>r.orderId===order.id&&r.direction==="sent")) throw new Error("当前订单无法重复评价");
      if(!Number.isInteger(action.score)||action.score<1||action.score>5||action.content.length>1000) throw new Error("请检查评分和评价内容");
      data.reviews.unshift({id:`REV-${Date.now()}`,orderId:order.id,direction:"sent",score:action.score,content:action.content.trim(),anonymous:action.anonymous,hidden:false,createdAt:new Date().toLocaleString("zh-CN")});
    } else if (action.type === "reviewFollowup" || action.type === "reviewVisibility" || action.type === "reviewAnonymous") {
      const review=data.reviews.find(r=>r.id===action.reviewId&&r.direction==="sent");
      if(!review) throw new Error("评价记录不存在");
      if(action.type==="reviewFollowup") {
        if(review.followup || !action.content.trim() || action.content.length>1000) throw new Error("请检查追评内容，已追评的记录不能重复提交");
        review.followup={content:action.content.trim(),createdAt:new Date().toLocaleString("zh-CN"),hidden:false};
      } else if(action.type==="reviewAnonymous") review.anonymous=action.anonymous;
      else if(action.target==="review") review.hidden=action.hidden;
      else if(review.followup) review.followup.hidden=action.hidden;
    } else if (action.type === "invoice") {
      if (action.title.trim().length < 4 || !/^[0-9A-HJ-NPQRTUWXY]{18}$/.test(action.taxId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(action.email)) throw new Error("请检查发票抬头、税号及接收邮箱");
      const invoice=data.invoices.find(i=>i.id===action.invoiceId);
      if (!invoice || invoice.status !== "available") throw new Error("当前开票状态已变化，请刷新重试");
      if (data.refunds.some(r=>r.orderId===invoice.orderId && r.status==="processing")) throw new Error("订单正在处理退款，请完成售后后申请开票");
      Object.assign(invoice,{status:"processing",title:action.title,taxId:action.taxId,email:action.email});
    }
    if (!writeStored(key,data)) throw new Error("记录保存失败，请检查浏览器存储设置后重试");
    keys.add(requestKey);
    return accountDataSchema.parse(data);
  },
};
