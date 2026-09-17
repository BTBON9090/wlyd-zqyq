import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Buildings, Briefcase, CaretDown, CheckCircle, DownloadSimple, Headset, MagnifyingGlass, Receipt, SquaresFour, Wallet, Truck, Bank, ShoppingCart, Sparkle, Gear, FolderOpen, ClipboardText } from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { OrderCard, OrderPayment } from "./OrderCard";
import { AdaptiveTabs } from "../../components/AdaptiveTabs";
import { RefundCard, RefundDetail } from "./RefundCard";
import { OrderDetail } from "./OrderDetail";
import { ReviewCenter } from "./ReviewCenter";
import { useStickyList } from "../../components/useStickyList";
import { EmptyState, ErrorNotice, Input, Modal } from "../../components/ui";
import { accountGateway, currency, invoiceStatus, orderStatus, refundStatus, type AccountAction, type Invoice, type Order, type Refund } from "./accountData";

const subnav = [
  ["/account/messages", "通知消息"], ["/account/demands", "我的需求"], ["/account/orders/services", "我的订单"],
  ["/account/aftersales", "售后管理"], ["/account/reviews", "评价中心"], ["/account/contracts", "我的合同"], ["/account/invoices", "我的发票"], ["/account/benefits", "我的福利"],
];
const othernav = [
  {to:"/account/wallet",label:"我的钱包",Icon:Wallet}, {to:"/account/logistics",label:"万连通网络货运",Icon:Truck},
  {to:"/account/orders/finance",label:"科技助贷与融资",Icon:Bank}, {to:"/account/orders/procurement",label:"大宗商品与集采",Icon:ShoppingCart},
  {to:"/account/ai",label:"AI 产业链速配",Icon:Sparkle}, {to:"/account/profile",label:"设置与偏好",Icon:Gear},
];
type DialogState = {type:"order"|"accept"|"refund"; order:Order; refund?:Refund} | {type:"refundDetail"|"cancelRefund"; refund:Refund} | {type:"invoice"|"invoiceDetail"; invoice:Invoice; order:Order} | {type:"proposal";refund:Refund;accept:boolean};
function Status({value, text}:{value:string;text:string}) {return <span className={`v3-status v3-status-${value}`}>{text}</span>;}
function Missing({title,description}:{title:string;description:string}) {
  return <div className="v3-account-empty"><div className="v3-empty-art" aria-hidden="true"><FolderOpen size={76} weight="duotone"/><span><Sparkle size={22} weight="fill"/></span></div><h2>{title}</h2><p>{description}</p>{title.startsWith("暂无") && <div className="v3-empty-actions"><Link className="button primary" to="/services/hall">浏览企业服务 <ArrowRight size={16}/></Link><Link className="button secondary" to="/services?publish=1">发布我的需求</Link></div>}</div>;
}
export default function AccountV3Page() {
  const listRef=useRef<HTMLDivElement>(null);
  useStickyList(listRef,true);
  const {session,loading,openAuth,toast,authError}=useApp();
  const {pathname}=useLocation();
  const [params,setParams]=useSearchParams();
  const client=useQueryClient();
  const section=pathname==="/account" || pathname==="/account/orders/services" ? "orders" : pathname==="/account/aftersales" ? "refunds" : pathname==="/account/invoices" ? "invoices" : pathname==="/account/reviews" ? "reviews" : "empty";
  const title=section==="orders" ? "我的订单" : section==="refunds" ? "售后管理" : section==="invoices" ? "我的发票" : [...subnav,...othernav.map(n=>[n.to,n.label]),["/account/overview","工作台总览"],["/account/enterprise","企业档案与资质"]].find(n=>n[0]===pathname)?.[1] || "个人中心";
  const data=useQuery({queryKey:["account-commerce",session?.id],queryFn:accountGateway.load,enabled:!!session,retry:false});
  const orders=data.data?.orders || [], refunds=data.data?.refunds || [], invoices=data.data?.invoices || [];
  const [expanded,setExpanded]=useState(true);
  const [filter,setFilter]=useState("all");
  const [draft,setDraft]=useState("");
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const [selected,setSelected]=useState<string[]>([]);
  const [dialog,setDialog]=useState<DialogState|null>(null);
  const [pending,setPending]=useState(false);
  const request = useRef<{payload:string;key:string}|null>(null);
  const [error,setError]=useState<unknown>(null);
  useEffect(()=>{setFilter("all");setDraft("");setSearch("");setPage(1);setSelected([]);setDialog(null);},[pathname,session?.id]);
  const detailOrder=orders.find(o=>o.id===params.get("order"));
  const open=(next:DialogState)=>{request.current=null;setError(null);if(next.type==="order"){const updated=new URLSearchParams(params);updated.set("order",next.order.id);setParams(updated);setDialog(null);window.scrollTo({top:0,behavior:"instant"});}else setDialog(next);};
  const close=()=>{if(pending)return;setDialog(null);};
  async function submit(action:AccountAction) {
    if(pending)return;
    setPending(true);setError(null);
    try {
      const payload=JSON.stringify(action);
      if(request.current?.payload!==payload) request.current={payload,key:crypto.randomUUID()};
      const result=await accountGateway.act(action,request.current.key);
      request.current=null;
      client.setQueryData(["account-commerce",session?.id],result);
      setDialog(null);
      toast(action.type==="accept" ? "验收已确认，可在我的发票申请开票" : action.type==="invoice" ? "开票申请已提交" : action.type==="cancelRefund" ? "售后申请已取消" : action.type==="refundProposal" ? "协商反馈已提交" : action.type.startsWith("review") ? "评价记录已更新" : "售后申请已提交");
      return true;
    } catch(e){setError(e);return false;} finally {setPending(false);}
  }
  const copy=async(id:string)=>{try{await navigator.clipboard.writeText(id);toast("编号已复制");}catch{toast("复制失败，请选中编号手动复制");}};
  const findOrder=(id:string)=>orders.find(o=>o.id===id);
  const invoiceFor=(order:Order)=>invoices.find(i=>i.orderId===order.id);
  const match=(values:string[])=>values.join(" ").toLowerCase().includes(search.toLowerCase());
  const filteredOrders=orders.filter(o=>(filter==="all"||o.status===filter)&&match([o.id,o.name,o.provider]));
  const filteredRefunds=refunds.filter(r=>(filter==="all"||r.status===filter)&&match([r.id,r.orderId,r.name,r.provider]));
  const filteredInvoices=invoices.filter(i=>{const o=findOrder(i.orderId);return (filter==="all"||i.status===filter)&&match([i.orderId,o?.name||"",o?.provider||""]);});
  const statuses=section==="orders"?orderStatus:section==="refunds"?refundStatus:invoiceStatus;
  const records=section==="orders"?orders:section==="refunds"?refunds:invoices;
  const count=section==="orders"?filteredOrders.length:section==="refunds"?filteredRefunds.length:filteredInvoices.length;
  const pageCount=Math.max(1,Math.ceil(count/6));
  const currentPage=Math.min(page,pageCount);
  const slice=<T,>(items:T[])=>items.slice((currentPage-1)*6,currentPage*6);
  const tabItems:[string,string][]=[["all","全部"],...Object.entries(statuses)];
  const tabCount=(value:string)=>value==="all"?records.length:records.filter(r=>r.status===value).length;

  const visibleInvoices=slice(filteredInvoices);
  function exportRecords() {
    const rows=invoices.filter(i=>selected.includes(i.id));
    if(!rows.length)return;
    const escape=(v:string)=>`"${(/^[=+@\-\t\r]/.test(v) ? "'"+v : v).replace(/"/g,'""')}"`;
    const csv="\uFEFF"+[["订单编号","服务项目","开票金额","状态","发票抬头","开票日期"],...rows.map(i=>[i.orderId,findOrder(i.orderId)?.name||"",String(i.amount),invoiceStatus[i.status],i.title||"",i.issuedAt||""])].map(row=>row.map(escape).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download="开票记录.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const canRefund=(o:Order)=>o.paid>o.refunded && o.status!=="closed" && !refunds.some(r=>r.orderId===o.id&&r.status==="processing") && !invoices.some(i=>i.orderId===o.id&&i.status!=="available");
  return <div ref={listRef} className="v3-account-page">
    <div className="v3-account-layout">
      <aside className="v3-account-sidebar">
        <div className="v3-account-user"><span>{session?.name.slice(0,1)||"万"}</span><div><strong>{session?.name||"我的园区"}</strong><small>{session?.enterprise||"连接专业，安心办事"}</small></div></div>
        <div className="v3-sidebar-scroll">
        <div className="v3-sidebar-caption">功能菜单</div>
        <NavLink to="/account/overview"><SquaresFour/>工作台总览</NavLink>
        <NavLink to="/account/enterprise"><Buildings/>企业档案与资质</NavLink>
        <button className={`v3-sidebar-group${pathname === "/account" || subnav.some(([to]) => pathname === to || pathname.startsWith(`${to}/`)) ? " is-active" : ""}`} onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}><Briefcase/>企业服务管理<CaretDown style={{transform:expanded?"none":"rotate(-90deg)"}} size={15}/></button>
        {expanded&&<nav className="v3-account-subnav" aria-label="企业服务管理">{subnav.map(([to,label])=><NavLink key={to} to={to} className={({isActive})=>(isActive||(pathname==="/account"&&label==="我的订单"))?"active":""}>{label}{session&&["我的订单","售后管理","我的发票"].includes(label)&&<span>{label==="我的订单"?orders.length:label==="售后管理"?refunds.length:invoices.filter(i=>i.status==="available").length}</span>}</NavLink>)}</nav>}
        <nav className="v3-account-other" aria-label="其他功能">{othernav.map(({to,label,Icon})=><NavLink key={to} to={to}><Icon/>{label}</NavLink>)}</nav>
        <div className="v3-sidebar-support"><Headset size={20}/><div><strong>服务有回应</strong><small>让每一次合作更安心</small></div></div>
        </div>
      </aside>
      <div className="v3-account-main">
        {detailOrder ? <OrderDetail order={detailOrder} refunds={refunds} invoices={invoices} onBack={()=>{const next=new URLSearchParams(params);next.delete("order");setParams(next);}} onCopy={()=>void copy(detailOrder.id)} onAccept={()=>open({type:"accept",order:detailOrder})} onRefund={()=>open({type:"refund",order:detailOrder})} onInvoice={invoice=>open({type:invoice.status==="available"?"invoice":"invoiceDetail",invoice,order:detailOrder})} canRefund={canRefund(detailOrder)}/> : <>
        <header className="v3-account-heading"><div><span className="v3-account-heading-icon">{section==="refunds"?<Headset size={27}/>:section==="invoices"?<Receipt size={27}/>:<ClipboardText size={27}/>}</span><div><h1>{title}</h1><p>{section==="orders"?"从合作开始到服务交付，进展尽在掌握。":section==="refunds"?"跟进每一次售后申请，让问题得到妥善解决。":section==="invoices"?"开票申请、进度与记录，集中管理更清晰。":"您的企业事务，在这里有序管理。"}</p></div></div>{session&&<span className="v3-account-enterprise"><Buildings size={17}/>{session.enterprise||session.name}</span>}</header>
        {loading?<div className="v3-account-loading" role="status">正在读取账号信息…</div>:!session?<div className="v3-account-guest"><Missing title="登录后，掌握每一项业务进展" description="查看订单、处理售后与管理发票，让企业事务井然有序。"/><ErrorNotice error={authError}/><button className="button primary" onClick={()=>openAuth({returnTo:pathname})}>登录 / 注册 <ArrowRight size={16}/></button></div>:section==="empty"?<div className="v3-account-panel"><Missing title={`暂无${title}内容`} description="相关内容将在这里集中展示。"/></div>:data.isPending?<div className="v3-account-loading" role="status" aria-busy="true">正在加载服务记录…</div>:data.isError?<EmptyState error title="服务记录暂时无法加载" description={data.error.message} action="重试" onAction={()=>void data.refetch()}/>:section==="reviews"?<ReviewCenter orders={orders} reviews={data.data?.reviews||[]} pending={pending} error={error} onAction={async action=>(await submit(action))??false}/>:<>
          <div className="v3-account-summary">{(section==="orders" ? [["全部订单",orders.length,"all"],["正在服务",orders.filter(o=>o.status==="serving").length,"serving"],["待验收",orders.filter(o=>o.status==="accepting").length,"accepting"],["已完成",orders.filter(o=>o.status==="completed").length,"completed"]] : section==="refunds" ? [["售后申请",refunds.length,"all"],["处理中",refunds.filter(r=>r.status==="processing").length,"processing"],["已退款",currency(refunds.filter(r=>r.status==="refunded").reduce((n,r)=>n+r.amount,0)),"refunded"]] : [["可开票金额",currency(invoices.filter(i=>i.status==="available").reduce((n,i)=>n+i.amount,0)),"available"],["开票中",invoices.filter(i=>i.status==="processing").length,"processing"],["已开票金额",currency(invoices.filter(i=>i.status==="issued").reduce((n,i)=>n+i.amount,0)),"issued"]]).map(([label,value,state])=><button key={label} onClick={()=>{setFilter(String(state));setPage(1);}}><span>{label}</span><strong className={typeof value === "string" && value.startsWith("¥") ? "amount-emphasis" : undefined}>{value}</strong><ArrowUpRight size={18}/></button>)}</div>
          <section className={section === "orders" || section === "refunds" ? "v3-order-workspace" : "v3-account-panel"}>
            <div className="v3-account-toolbar" data-list-sticky><AdaptiveTabs items={tabItems.map(([value,label])=>({value,label,count:tabCount(value)}))} value={filter} onChange={value=>{setFilter(value);setPage(1);}}/>
              <form className="v3-account-search" role="search" onSubmit={e=>{e.preventDefault();setSearch(draft.trim());setPage(1);}}><label><MagnifyingGlass size={17}/><input aria-label="搜索订单、服务或商家" placeholder="搜索编号、服务或商家" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={100}/></label></form>
            </div>
            {!count?<Missing title={section === "orders" && !orders.length ? "暂无服务订单" : "暂无匹配记录"} description={section === "orders" && !orders.length ? "选一项适合的企业服务，或发布需求，让专业服务商为您提供方案。" : "您可以调整筛选条件，或查看其他状态的记录。"}/>:section==="orders"?<div className="v3-order-list">{slice(filteredOrders).map(o=><OrderCard key={o.id} order={o} canRefund={canRefund(o)} canInvoice={invoiceFor(o)?.status === "available"}
              onCopy={()=>void copy(o.id)} onDetails={()=>open({type:"order",order:o})} onAccept={()=>open({type:"accept",order:o})}
              onInvoice={()=>{const invoice=invoiceFor(o);if(invoice)open({type:"invoice",order:o,invoice});}} onRefund={()=>open({type:"refund",order:o})}/>) }</div>:section==="refunds"?<div className="v3-refund-list">{slice(filteredRefunds).map(r=><RefundCard key={r.id} refund={r} order={findOrder(r.orderId)} onCopy={()=>void copy(r.id)} onDetails={()=>open({type:"refundDetail",refund:r})} onEdit={()=>{const order=findOrder(r.orderId);if(order)open({type:"refund",order,refund:r});}} onCancel={()=>open({type:"cancelRefund",refund:r})} onProposal={accept=>open({type:"proposal",refund:r,accept})}/>)}</div>:<>
              <div className="v3-invoice-selection"><label><input type="checkbox" aria-label="选择本页开票记录" checked={visibleInvoices.length>0&&visibleInvoices.every(i=>selected.includes(i.id))} onChange={e=>setSelected(e.target.checked?[...new Set([...selected,...visibleInvoices.map(i=>i.id)])]:selected.filter(id=>!visibleInvoices.some(i=>i.id===id)))}/>全选本页</label><span>已选择 <b>{selected.length}</b> 笔记录</span><button className="button secondary" disabled={!selected.length} onClick={exportRecords}><DownloadSimple size={16}/>导出记录</button></div>
              <div className="table-scroll"><table className="v3-invoice-table"><thead><tr><th><span className="sr-only">选择</span></th><th>订单编号 / 下单时间</th><th>服务项目</th><th>服务机构</th><th>可开票金额</th><th>开票状态</th><th>操作</th></tr></thead><tbody>{visibleInvoices.map(i=>{const o=findOrder(i.orderId);return <tr key={i.id}><td><input type="checkbox" aria-label={`选择订单 ${i.orderId}`} checked={selected.includes(i.id)} onChange={e=>setSelected(e.target.checked?[...selected,i.id]:selected.filter(id=>id!==i.id))}/></td><td><Link to={`/account/orders/services?order=${i.orderId}`}>{i.orderId}</Link><small>{o?.createdAt}</small></td><td><strong>{o?.name}</strong><small>{o?.category} · {o?.spec}</small></td><td>{o?.provider}<small>{i.title||"企业服务"}</small></td><td><strong className="v3-invoice-amount">{currency(i.amount)}</strong>{!!o?.refunded&&<small>已扣除退款 {currency(o.refunded)}</small>}</td><td><Status value={i.status} text={invoiceStatus[i.status]}/></td><td>{o&&<button className={i.status==="available"?"button primary":"button secondary"} onClick={()=>open({type:i.status==="available"?"invoice":"invoiceDetail",invoice:i,order:o})}>{i.status==="available"?"申请开票":i.status==="issued"?"查看发票":"查看进度"}</button>}</td></tr>;})}</tbody></table></div>
            </>}
            {count>0&&<div className="v3-account-pagination"><span>共 {count} 条记录</span><button className="button secondary" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>上一页</button><span>{currentPage} / {pageCount}</span><button className="button secondary" disabled={currentPage===pageCount} onClick={()=>setPage(currentPage+1)}>下一页</button></div>}
          </section>
        </>}
        </>}
      </div>
    </div>
    <Modal open={!!dialog} onOpenChange={value=>{if(!value)close();}} title={dialog?.type==="order"?"订单详情":dialog?.type==="accept"?"确认服务验收":dialog?.type==="refund"?"申请售后退款":dialog?.type==="refundDetail"?"售后详情":dialog?.type==="cancelRefund"?"取消售后申请":dialog?.type==="proposal"?(dialog.accept?"确认退款协商方案":"拒绝金额调整"):dialog?.type==="invoice"?"申请开票":"发票详情"}>
      <div className="v3-account-dialog">
      {dialog?.type==="order"&&<><div className="v3-dialog-lead"><h2>{dialog.order.name}</h2><Status value={dialog.order.status} text={orderStatus[dialog.order.status]}/></div><dl className="v3-dialog-facts"><div><dt>订单编号</dt><dd>{dialog.order.id}</dd></div><div><dt>服务商</dt><dd>{dialog.order.provider}</dd></div><div><dt>服务规格</dt><dd>{dialog.order.spec}</dd></div></dl><h3>费用与付款</h3><OrderPayment order={dialog.order}/><h3>服务进度</h3><ol className="v3-order-timeline">{dialog.order.progress.map((p,i)=><li key={i}><CheckCircle size={19}/><div><strong>{p.title}</strong><time>{p.date}</time><p>{p.detail}</p></div></li>)}</ol>{dialog.order.status==="signing"&&<p className="notice">服务方案已确认，服务商将联系您完成合同签署。</p>}<Link className="button secondary" to={`/services/${dialog.order.serviceId}`}>查看服务 <ArrowUpRight size={16}/></Link></>}
      {dialog?.type==="accept"&&<><p>请确认「{dialog.order.name}」的交付成果符合约定。确认后订单将完成，您可以申请开票。</p><ErrorNotice error={error}/><div className="v3-dialog-actions"><button className="button secondary" disabled={pending} onClick={close}>返回检查</button><button className="button primary" disabled={pending} onClick={()=>void submit({type:"accept",orderId:dialog.order.id})}>{pending?"正在提交…":"确认验收通过"}</button></div></>}
      {dialog?.type==="refund"&&<RefundForm key={dialog.order.id+(dialog.refund?.id||"")} order={dialog.order} refund={dialog.refund} pending={pending} error={error} onSubmit={action=>void submit(action)}/>}
      {dialog?.type==="cancelRefund"&&<><p>取消后服务商将停止处理这笔申请。确认取消「{dialog.refund.name}」的售后申请？</p><ErrorNotice error={error}/><div className="v3-dialog-actions"><button className="button secondary" disabled={pending} onClick={close}>保留申请</button><button className="button primary" disabled={pending} onClick={()=>void submit({type:"cancelRefund",refundId:dialog.refund.id})}>{pending?"正在提交…":"确认取消"}</button></div></>}
      {dialog?.type==="refundDetail"&&<RefundDetail refund={dialog.refund} order={findOrder(dialog.refund.orderId)}/>}
      {dialog?.type==="proposal"&&<><div className="detail-callout"><h3>{dialog.accept?"同意服务商的退款方案":"拒绝本次金额调整"}</h3><p>{dialog.refund.name}</p><strong className="amount-emphasis">{currency(dialog.refund.proposal?.amount||0)}</strong><p>{dialog.accept?"确认后进入退款处理，实际到账后再更新订单净支付与可开票金额。":"原申请将保持处理中，服务商需要继续协商。"} </p></div><ErrorNotice error={error}/><div className="v3-dialog-actions"><button className="button secondary" onClick={close} disabled={pending}>返回</button><button className="button primary" disabled={pending} onClick={()=>void submit({type:"refundProposal",refundId:dialog.refund.id,accept:dialog.accept})}>{pending?"正在提交…":dialog.accept?"同意方案":"确认拒绝"}</button></div></>}
      {dialog?.type==="invoice"&&<InvoiceForm key={dialog.invoice.id} invoice={dialog.invoice} enterprise={session?.enterprise||""} pending={pending} error={error} onSubmit={action=>void submit(action)}/>}
      {dialog?.type==="invoiceDetail"&&<><div className="v3-dialog-lead"><h2>{dialog.order.name}</h2><Status value={dialog.invoice.status} text={invoiceStatus[dialog.invoice.status]}/></div><dl className="v3-dialog-facts">{[["发票抬头",dialog.invoice.title],["纳税人识别号",dialog.invoice.taxId],["开票金额",currency(dialog.invoice.amount)],["发票号码",dialog.invoice.number],["开票日期",dialog.invoice.issuedAt],["接收邮箱",dialog.invoice.email]].filter(([,value])=>value).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>{dialog.invoice.fileUrl&&/^https?:\/\//.test(dialog.invoice.fileUrl)?<a href={dialog.invoice.fileUrl} className="button primary" target="_blank" rel="noreferrer">下载电子发票 <DownloadSimple size={16}/></a>:<p className="notice">{dialog.invoice.status==="processing"?"开票申请正在处理中，开具后将发送至接收邮箱。":"电子发票文件待同步，可通过接收邮箱查收或联系服务商补发。"}</p>}</>}
      </div>
    </Modal>
  </div>;
}
function RefundForm({order,refund,pending,error,onSubmit}:{order:Order;refund?:Refund;pending:boolean;error:unknown;onSubmit:(a:AccountAction)=>void}) {
  const [amount,setAmount]=useState(String(refund?.amount||order.paid-order.refunded));
  const [reason,setReason]=useState(refund?.reason||"");
  const [description,setDescription]=useState(refund?.description||"");
  const [validation,setValidation]=useState("");
  const submit=(e:FormEvent)=>{e.preventDefault();const value=Number(amount);if(!Number.isFinite(value)||value<=0||value>order.paid-order.refunded){setValidation("退款金额须大于 0 且不超过可退金额");return;}if(reason.trim().length<5){setValidation("请至少填写 5 个字的退款原因");return;}setValidation("");onSubmit({type:"refund",orderId:order.id,refundId:refund?.id,amount:Math.round(value*100)/100,reason:reason.trim(),description:description.trim()});};
  return <form className="v3-account-form" onSubmit={submit}><p>{order.name}</p>{refund?.status==="rejected"&&<p className="aftercare-feedback is-rejected">驳回原因：{refund.note}</p>}<Input label="退款金额（元）" type="number" min="0.01" max={order.paid-order.refunded} step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)} hint={`最多可退 ${currency(order.paid-order.refunded)}`}/><label>申请原因<textarea value={reason} onChange={e=>setReason(e.target.value)} minLength={5} maxLength={500} required rows={4} placeholder="请说明需要退款的原因及相关交付情况"/></label><label>退款详细说明<textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000} rows={4} placeholder="补充服务进度、交付争议和协商情况"/></label><ErrorNotice error={validation||error}/><button className="button primary" disabled={pending}>{pending?"正在提交…":refund?"重新提交申请":"提交售后申请"}</button></form>;
}
function InvoiceForm({invoice,enterprise,pending,error,onSubmit}:{invoice:Invoice;enterprise:string;pending:boolean;error:unknown;onSubmit:(a:AccountAction)=>void}) {
  const [title,setTitle]=useState(enterprise),[taxId,setTaxId]=useState(""),[email,setEmail]=useState("");
  const [validation,setValidation]=useState("");
  return <form className="v3-account-form" onSubmit={e=>{e.preventDefault();if(title.trim().length<4){setValidation("请填写完整的企业发票抬头");return;}if(!/^[0-9A-HJ-NPQRTUWXY]{18}$/.test(taxId.trim())){setValidation("请填写 18 位统一社会信用代码");return;}setValidation("");onSubmit({type:"invoice",invoiceId:invoice.id,title:title.trim(),taxId:taxId.trim(),email:email.trim()});}}><div className="v3-invoice-form-total"><Receipt size={24}/><span>电子普通发票<strong>{currency(invoice.amount)}</strong></span></div><Input label="发票抬头" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={100} placeholder="请输入企业全称"/><Input label="纳税人识别号" value={taxId} onChange={e=>setTaxId(e.target.value.toUpperCase())} required maxLength={18} placeholder="请输入统一社会信用代码"/><Input label="接收邮箱" type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={100} placeholder="用于接收电子发票"/><ErrorNotice error={validation||error}/><button className="button primary" disabled={pending}>{pending?"正在提交…":"确认申请开票"}</button></form>;
}
