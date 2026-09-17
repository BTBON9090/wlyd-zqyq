import { accountDataSchema, type AccountData, type AccountGateway, type Order, type Refund } from "../features/account/accountModels";
import { catalogue } from "./catalogue";
import { mockGateway, demoControls } from "./mockGateway";
import { readStored, writeStored } from "../lib/storage";

function seed(): AccountData {
  const ids = ["s6", "s7", "s3", "x1-name", "s2", "s9", "s1", "s5"];
  const states: Order["status"][] = ["serving", "accepting", "completed", "signing", "completed", "pending", "closed", "completed"];
  const orders: Order[] = ids.map((id, i) => {
    const s = catalogue.find(item => item.id === id)!;
    const total = [8000, 80000, 2400, 38000, 8160, 30000, 980, 6000][i];
    const paid = [3000, 80000, 2400, 18000, 8160, 0, 980, 6000][i];
    const day = String(12-i).padStart(2,"0");
    return { id: `864005128910${43+i}`, serviceId: s.id, name: s.name, provider: s.provider, image: s.image, category: s.category,
      paymentMode: [0,1,3].includes(i) ? "installments" : "once",
      discount: i === 3 ? 10000 : i === 5 ? 2000 : 0,
      payments: i === 0 ? [{label:"首期",amount:3000,paidAt:"2026-09-12"}] : i === 1 ? [{label:"首期",amount:30000,paidAt:"2026-09-11"},{label:"尾款",amount:50000,paidAt:"2026-09-13"}] : undefined,
      ...(i === 1 ? {acceptanceDeadline:"2026-09-23T18:00:00+08:00",autoAccept:true} : {}),
      spec: s.published?.versions[0]?.name || "标准服务", quantity: 1, total, paid, refunded: i === 6 ? 980 : i === 7 ? 2000 : 0,
      createdAt: `2026-09-${day} 09:30:45`, deliveryDays: [15,30,7,60,30,20,10,15][i], phases: i < 2 ? 2 : 1, status: states[i],
      progress: [{title:"订单已创建",date:`2026-09-${day} 09:30`,detail:"服务需求已提交，等待服务商确认。"}, ...(paid ? [{title:"服务方案已确认",date:`2026-09-${day} 14:20`,detail:"已确认服务范围、交付周期与费用安排。"}] : []), ...(states[i] === "accepting" || states[i] === "completed" ? [{title:"交付成果已提交",date:"2026-09-13 16:40",detail:"服务商已完成约定服务内容，提交交付成果。"}] : [])] };
  });
  const refunds: Refund[] = [
    {id:"AF202609160042", orderId:orders[1].id, name:orders[1].name, provider:orders[1].provider, amount:20000, reason:"部分接口范围调整", note:"服务商已提出退款金额调整方案，等待您确认。", description:"库存接口已完成联调；剩余采购对接范围发生变化，申请退还未实施部分费用。", createdAt:"2026-09-16 10:20:00",status:"processing",kind:"partial",proposal:{amount:16000,reason:"已完成需求梳理与接口设计，相关工作费用为4000元，建议退还剩余16000元。",createdAt:"2026-09-16 15:30:00",status:"pending"},history:[{title:"提交售后申请",date:"2026-09-16 10:20:00",detail:"申请部分退款20000元。"},{title:"服务商提出协商方案",date:"2026-09-16 15:30:00",detail:"建议退款16000元，请核对已完成的服务范围。"}]},
    {id:"AF202609120089", orderId:orders[6].id, name:orders[6].name, provider:orders[6].provider, amount:980, reason:"企业业务调整，协商终止服务",note:"退款已原路退回。",createdAt:"2026-09-12 10:15:20",status:"refunded" as const},
    {id:"AF202609130015", orderId:orders[0].id, name:orders[0].name, provider:orders[0].provider, amount:1000,reason:"交付范围与约定不一致",note:"已交付初稿，请补充具体修改项和相关材料后重新提交。",createdAt:"2026-09-13 14:10:00",status:"rejected" as const},
    {id:"AF202609110031", orderId:orders[7].id,name:orders[7].name,provider:orders[7].provider,amount:2000,reason:"减少部分设计物料",note:"双方已确认调整范围，部分款项已退回。",createdAt:"2026-09-11 16:45:00",status:"refunded" as const},
    {id:"AF202609100068",orderId:orders[2].id,name:orders[2].name,provider:orders[2].provider,amount:800,reason:"服务周期调整",note:"申请人已取消本次售后申请。",createdAt:"2026-09-10 14:30:10",status:"cancelled" as const},
  ];
  const invoices = [2,4,7].map((i, index) => ({id:`INV-${orders[i].id}`,orderId:orders[i].id,amount:orders[i].paid-orders[i].refunded,status:index === 1 ? "issued" as const : "available" as const,
    ...(index === 1 ? {title:"河北启程科技有限公司",taxId:"91130100MA07Q8KJ3X",email:"finance@example.com",number:"26130900000000816240",issuedAt:"2026-09-13"} : {})}));
  for (const order of orders) {
    order.contact = {name:"企业服务专员"};
    order.contract = {name:`${order.name}服务合同`,status:["pending","signing"].includes(order.status)?"pending":"signed",...(!["pending","signing"].includes(order.status)?{signedAt:order.createdAt.slice(0,10)}:{})};
    order.deliveries = Array.from({length:order.phases},(_,index)=>({name:order.phases>1?`第${index+1}阶段 · ${index===0?"方案与实施":"联调与交付"}`:"服务成果交付",status:order.status==="completed"?"accepted" as const:order.status==="accepting"?"submitted" as const:order.status==="serving"&&index===0?"working" as const:"waiting" as const,standard:index===0?"按合同约定完成服务范围，提供成果说明与核对清单。":"完成联调验证，提交交付说明与验收清单。",...(["accepting","completed"].includes(order.status)?{submittedAt:"2026-09-13 16:40:00",fileName:`${order.name}交付说明.pdf`}:{})}));
  }
  return { orders, refunds, invoices, reviews:[
    {id:"REV-01",orderId:orders[4].id,direction:"sent",score:5,content:"沟通及时，申报材料核对仔细，交付符合约定。",createdAt:"2026-09-14 10:30:00",anonymous:false,hidden:false,followup:{content:"后续问题也得到了耐心解答。",createdAt:"2026-09-16 14:00:00",hidden:false}},
    {id:"REV-02",orderId:orders[7].id,direction:"sent",score:4,content:"设计整体满意，调整后的交付范围已确认。",createdAt:"2026-09-15 11:20:00",anonymous:true,hidden:false,reply:"感谢反馈，我们会继续完善服务。"},
    {id:"REV-03",orderId:orders[4].id,direction:"received",score:5,content:"资料提供完整，需求清晰，沟通与验收配合顺畅。",createdAt:"2026-09-15 09:20:00",anonymous:false,hidden:false},
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
  const enrichedKey = `${key}:extended-v1`;
  if (!localStorage.getItem(enrichedKey)) {
    if (!data.refunds.some(r=>r.id===initial.refunds[0].id)) data.refunds.unshift(initial.refunds[0]);
    if (!data.reviews.length) data.reviews = initial.reviews;
    if (writeStored(key,data)) localStorage.setItem(enrichedKey,"1");
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
