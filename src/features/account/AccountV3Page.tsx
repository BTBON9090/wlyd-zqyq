import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Buildings, Briefcase, CaretDown, CheckCircle, Clock, Copy, DownloadSimple, Headset, MagnifyingGlass, Receipt, SquaresFour, Wallet, Truck, Bank, ShoppingCart, Sparkle, Gear, FolderOpen, ClipboardText } from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { ContentImage } from "../../components/ContentImage";
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
type DialogState = {type:"order"|"accept"|"refund"; order:Order; refund?:Refund} | {type:"refundDetail"|"cancelRefund"; refund:Refund} | {type:"invoice"|"invoiceDetail"; invoice:Invoice; order:Order};
function Status({value, text}:{value:string;text:string}) {return <span className={`v3-status v3-status-${value}`}>{text}</span>;}
function Missing({title,description}:{title:string;description:string}) {
  return <div className="v3-account-empty"><div className="v3-empty-art" aria-hidden="true"><FolderOpen size={76} weight="duotone"/><span><Sparkle size={22} weight="fill"/></span></div><h2>{title}</h2><p>{description}</p></div>;
}
export default function AccountV3Page() {
  const listRef=useRef<HTMLDivElement>(null);
  useStickyList(listRef,true);
  const {session,loading,openAuth,toast,authError}=useApp();
  const {pathname}=useLocation();
  const [params,setParams]=useSearchParams();
  const client=useQueryClient();
  const section=pathname==="/account" || pathname==="/account/orders/services" ? "orders" : pathname==="/account/aftersales" ? "refunds" : pathname==="/account/invoices" ? "invoices" : "empty";
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
  useEffect(()=>{
    const id=params.get("order");
    const order=data.data?.orders.find(o=>o.id===id);
    if (order) setDialog({type:"order",order});
  },[params,data.data]);
  const open=(next:DialogState)=>{request.current=null;setError(null);setDialog(next);};
  const close=()=>{if(pending)return;setDialog(null);if(params.has("order")){const next=new URLSearchParams(params);next.delete("order");setParams(next,{replace:true});}};
  async function submit(action:AccountAction) {
    if(pending)return;
    setPending(true);setError(null);
    try {
      const payload=JSON.stringify(action);
      if(request.current?.payload!==payload) request.current={payload,key:crypto.randomUUID()};
      const result=await accountGateway.act(action,request.current.key);
      request.current=null;
      client.setQueryData(["account-commerce",session?.id],result);
      setDialog(null); const next=new URLSearchParams(params);next.delete("order");setParams(next,{replace:true});
      toast(action.type==="accept" ? "验收已确认，可在我的发票申请开票" : action.type==="invoice" ? "开票申请已提交" : action.type==="cancelRefund" ? "售后申请已取消" : "售后申请已提交");
    } catch(e){setError(e);} finally {setPending(false);}
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
  const primaryTabs=tabItems.slice(0,3);
  const overflowTabs=tabItems.slice(3);
  // 各中心（工作台、档案、钱包、货运、助贷、集采、AI、设置）的一级页面不展示面包屑。
  const centerEntryPaths=["/account/overview","/account/enterprise",...othernav.map(n=>n.to)];
  const showAccountBreadcrumb=!centerEntryPaths.includes(pathname);
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
    {showAccountBreadcrumb&&<div className="v3-account-top"><div><Link to="/">首页</Link><span>/</span>个人中心<span>/</span>{title}</div><Link to="/services">发现更多企业服务 <ArrowUpRight size={15}/></Link></div>}
    <div className="v3-account-layout">
      <aside className="v3-account-sidebar">
        <div className="v3-account-user"><span>{session?.name.slice(0,1)||"万"}</span><div><strong>{session?.name||"我的园区"}</strong><small>{session?.enterprise||"连接专业，安心办事"}</small></div></div>
        <div className="v3-sidebar-caption">功能菜单</div>
        <NavLink to="/account/overview"><SquaresFour/>工作台总览</NavLink>
        <NavLink to="/account/enterprise"><Buildings/>企业档案与资质</NavLink>
        <button className="v3-sidebar-group" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}><Briefcase/>企业服务管理<CaretDown style={{transform:expanded?"none":"rotate(-90deg)"}} size={15}/></button>
        {expanded&&<nav className="v3-account-subnav" aria-label="企业服务管理">{subnav.map(([to,label])=><NavLink key={to} to={to} className={({isActive})=>(isActive||(pathname==="/account"&&label==="我的订单"))?"active":""}>{label}{session&&["我的订单","售后管理","我的发票"].includes(label)&&<span>{label==="我的订单"?orders.length:label==="售后管理"?refunds.length:invoices.filter(i=>i.status==="available").length}</span>}</NavLink>)}</nav>}
        <nav className="v3-account-other" aria-label="其他功能">{othernav.map(({to,label,Icon})=><NavLink key={to} to={to}><Icon/>{label}</NavLink>)}</nav>
        <div className="v3-sidebar-support"><Headset size={20}/><div><strong>服务有回应</strong><small>让每一次合作更安心</small></div></div>
      </aside>
      <div className="v3-account-main">
        <header className="v3-account-heading"><div><span className="v3-account-heading-icon">{section==="refunds"?<Headset size={27}/>:section==="invoices"?<Receipt size={27}/>:<ClipboardText size={27}/>}</span><div><h1>{title}</h1><p>{section==="orders"?"从合作开始到服务交付，进展尽在掌握。":section==="refunds"?"跟进每一次售后申请，让问题得到妥善解决。":section==="invoices"?"开票申请、进度与记录，集中管理更清晰。":"您的企业事务，在这里有序管理。"}</p></div></div>{session&&<span className="v3-account-enterprise"><Buildings size={17}/>{session.enterprise||session.name}</span>}</header>
        {loading?<div className="v3-account-loading" role="status">正在读取账号信息…</div>:!session?<div className="v3-account-guest"><Missing title="登录后，掌握每一项业务进展" description="查看订单、处理售后与管理发票，让企业事务井然有序。"/><ErrorNotice error={authError}/><button className="button primary" onClick={()=>openAuth({returnTo:pathname})}>登录 / 注册 <ArrowRight size={16}/></button></div>:section==="empty"?<div className="v3-account-panel"><Missing title={`暂无${title}内容`} description="相关内容将在这里集中展示。"/></div>:data.isPending?<div className="v3-account-loading" role="status" aria-busy="true">正在加载服务记录…</div>:data.isError?<EmptyState error title="服务记录暂时无法加载" description={data.error.message} action="重试" onAction={()=>void data.refetch()}/>:<>
          <div className="v3-account-summary">{(section==="orders" ? [["全部订单",orders.length,"all"],["正在服务",orders.filter(o=>o.status==="serving").length,"serving"],["待验收",orders.filter(o=>o.status==="accepting").length,"accepting"],["已完成",orders.filter(o=>o.status==="completed").length,"completed"]] : section==="refunds" ? [["售后申请",refunds.length,"all"],["处理中",refunds.filter(r=>r.status==="processing").length,"processing"],["已退款",currency(refunds.filter(r=>r.status==="refunded").reduce((n,r)=>n+r.amount,0)),"refunded"]] : [["可开票金额",currency(invoices.filter(i=>i.status==="available").reduce((n,i)=>n+i.amount,0)),"available"],["开票中",invoices.filter(i=>i.status==="processing").length,"processing"],["已开票金额",currency(invoices.filter(i=>i.status==="issued").reduce((n,i)=>n+i.amount,0)),"issued"]]).map(([label,value,state])=><button key={label} onClick={()=>{setFilter(String(state));setPage(1);}}><span>{label}</span><strong>{value}</strong><ArrowUpRight size={18}/></button>)}</div>
          <section className="v3-account-panel">
            <div className="v3-account-toolbar" data-list-sticky><div className="v3-account-tabs" aria-label="状态筛选">{primaryTabs.map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>{setFilter(value);setPage(1);}}>{label}<span>{tabCount(value)}</span></button>)}{!!overflowTabs.length&&<div className="v3-account-tabs-more"><button type="button" className="v3-account-more-trigger" aria-haspopup="menu">更多<CaretDown size={12}/></button><div className="v3-account-more-menu" role="menu">{overflowTabs.map(([value,label])=><button key={value} role="menuitem" aria-pressed={filter===value} onClick={()=>{setFilter(value);setPage(1);}}>{label}<span>{tabCount(value)}</span></button>)}</div></div>}</div>
              <form className="v3-account-search" role="search" onSubmit={e=>{e.preventDefault();setSearch(draft.trim());setPage(1);}}><label><MagnifyingGlass size={17}/><input aria-label="搜索订单、服务或商家" placeholder="搜索编号、服务或商家" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={100}/></label></form>
            </div>
            {!count?<Missing title="暂无相关记录" description="您可以调整筛选条件，或查看其他状态的记录。"/>:section==="orders"?<div className="v3-order-list">{slice(filteredOrders).map(o=><article className="v3-order-card" key={o.id}>
              <header><span className="v3-order-provider"><Buildings size={16}/>{o.provider}<ArrowRight size={13}/></span><time>{o.createdAt}</time><span>订单编号：{o.id}</span><button aria-label={`复制订单编号 ${o.id}`} onClick={()=>void copy(o.id)}><Copy size={14}/></button><Status value={o.status} text={orderStatus[o.status]}/></header>
              <div className="v3-order-body"><Link to={`/services/${o.serviceId}`} className="v3-order-product"><ContentImage src={o.image} alt={o.name} placeholder="企业服务"/><div><h2>{o.name}</h2><span className="v3-order-fulfillment">{o.phases>1?"分期支付 · 阶段验收":"一次支付 · 一次验收"}</span><p>{o.category}</p><p>规格：{o.spec}</p><p>交付周期：{o.deliveryDays?`${o.deliveryDays} 个自然日`:"沟通确认"} · 共 {o.phases} 个阶段</p></div></Link><div className="v3-order-unit"><strong>{currency(o.total/o.quantity)}</strong><small>× {o.quantity}</small></div><div className="v3-order-price"><span>订单总价 {currency(o.total)}</span>{o.refunded>0&&<span>已退款 {currency(o.refunded)}</span>}<p>实付款 <strong>{currency(o.paid)}</strong></p></div><div className="v3-order-actions">{o.status==="accepting"?<button className="button primary" onClick={()=>open({type:"accept",order:o})}>确认验收</button>:o.status==="completed"&&invoiceFor(o)?.status==="available"?<button className="button secondary" onClick={()=>open({type:"invoice",order:o,invoice:invoiceFor(o)!})}>申请开票</button>:<button className="button secondary" onClick={()=>open({type:"order",order:o})}>{o.status==="serving"?"查看进度":o.status==="signing"?"签约信息":"查看订单"}</button>}{canRefund(o)&&<button onClick={()=>open({type:"refund",order:o})}>申请退款</button>}<button onClick={()=>open({type:"order",order:o})}>订单详情</button></div></div>
            </article>)}</div>:section==="refunds"?<div className="v3-refund-list">{slice(filteredRefunds).map(r=><article className="v3-refund-card" key={r.id}><div className="v3-refund-content"><div className="v3-refund-meta"><span>售后编号 <b>{r.id}</b></span><button aria-label={`复制售后编号 ${r.id}`} onClick={()=>void copy(r.id)}><Copy size={14}/></button><time><Clock size={14}/>{r.createdAt}</time></div><h2>{r.name}</h2><p>关联订单：{r.orderId}<span>服务商：{r.provider}</span></p><p>申请原因：{r.reason}</p>{r.status==="rejected"&&<div className="v3-refund-rejection">驳回原因：{r.note}</div>}</div><div className="v3-refund-amount"><small>退款金额</small><strong>{currency(r.amount)}</strong><Status value={r.status} text={refundStatus[r.status]}/></div><div className="v3-refund-actions">{r.status==="rejected"&&findOrder(r.orderId)&&<button className="button primary" onClick={()=>open({type:"refund",order:findOrder(r.orderId)!,refund:r})}>修改重提</button>}{["processing","rejected"].includes(r.status)&&<button className="button secondary" onClick={()=>open({type:"cancelRefund",refund:r})}>取消申请</button>}<button className="button secondary" onClick={()=>open({type:"refundDetail",refund:r})}>详情</button><Link to={`/account/orders/services?order=${r.orderId}`}>原订单 <ArrowUpRight size={14}/></Link></div></article>)}</div>:<>
              <div className="v3-invoice-selection"><label><input type="checkbox" aria-label="选择本页开票记录" checked={visibleInvoices.length>0&&visibleInvoices.every(i=>selected.includes(i.id))} onChange={e=>setSelected(e.target.checked?[...new Set([...selected,...visibleInvoices.map(i=>i.id)])]:selected.filter(id=>!visibleInvoices.some(i=>i.id===id)))}/>全选本页</label><span>已选择 <b>{selected.length}</b> 笔记录</span><button className="button secondary" disabled={!selected.length} onClick={exportRecords}><DownloadSimple size={16}/>导出记录</button></div>
              <div className="table-scroll"><table className="v3-invoice-table"><thead><tr><th><span className="sr-only">选择</span></th><th>订单编号 / 下单时间</th><th>服务项目</th><th>服务机构</th><th>可开票金额</th><th>开票状态</th><th>操作</th></tr></thead><tbody>{visibleInvoices.map(i=>{const o=findOrder(i.orderId);return <tr key={i.id}><td><input type="checkbox" aria-label={`选择订单 ${i.orderId}`} checked={selected.includes(i.id)} onChange={e=>setSelected(e.target.checked?[...selected,i.id]:selected.filter(id=>id!==i.id))}/></td><td><Link to={`/account/orders/services?order=${i.orderId}`}>{i.orderId}</Link><small>{o?.createdAt}</small></td><td><strong>{o?.name}</strong><small>{o?.category} · {o?.spec}</small></td><td>{o?.provider}<small>{i.title||"企业服务"}</small></td><td><strong className="v3-invoice-amount">{currency(i.amount)}</strong>{!!o?.refunded&&<small>已扣除退款 {currency(o.refunded)}</small>}</td><td><Status value={i.status} text={invoiceStatus[i.status]}/></td><td>{o&&<button className={i.status==="available"?"button primary":"button secondary"} onClick={()=>open({type:i.status==="available"?"invoice":"invoiceDetail",invoice:i,order:o})}>{i.status==="available"?"申请开票":i.status==="issued"?"查看发票":"查看进度"}</button>}</td></tr>;})}</tbody></table></div>
            </>}
            {count>0&&<div className="v3-account-pagination"><span>共 {count} 条记录</span><button className="button secondary" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>上一页</button><span>{currentPage} / {pageCount}</span><button className="button secondary" disabled={currentPage===pageCount} onClick={()=>setPage(currentPage+1)}>下一页</button></div>}
          </section>
        </>}
      </div>
    </div>
    <Modal open={!!dialog} onOpenChange={value=>{if(!value)close();}} title={dialog?.type==="order"?"订单详情":dialog?.type==="accept"?"确认服务验收":dialog?.type==="refund"?"申请售后退款":dialog?.type==="refundDetail"?"售后详情":dialog?.type==="cancelRefund"?"取消售后申请":dialog?.type==="invoice"?"申请开票":"发票详情"}>
      <div className="v3-account-dialog">
      {dialog?.type==="order"&&<><div className="v3-dialog-lead"><h2>{dialog.order.name}</h2><Status value={dialog.order.status} text={orderStatus[dialog.order.status]}/></div><dl className="v3-dialog-facts"><div><dt>订单编号</dt><dd>{dialog.order.id}</dd></div><div><dt>服务商</dt><dd>{dialog.order.provider}</dd></div><div><dt>服务规格</dt><dd>{dialog.order.spec}</dd></div><div><dt>订单金额</dt><dd>{currency(dialog.order.total)}</dd></div><div><dt>实付金额</dt><dd>{currency(dialog.order.paid)}</dd></div></dl><h3>服务进度</h3><ol className="v3-order-timeline">{dialog.order.progress.map((p,i)=><li key={i}><CheckCircle size={19}/><div><strong>{p.title}</strong><time>{p.date}</time><p>{p.detail}</p></div></li>)}</ol>{dialog.order.status==="signing"&&<p className="notice">服务方案已确认，服务商将联系您完成合同签署。</p>}<Link className="button secondary" to={`/services/${dialog.order.serviceId}`}>查看服务 <ArrowUpRight size={16}/></Link></>}
      {dialog?.type==="accept"&&<><p>请确认「{dialog.order.name}」的交付成果符合约定。确认后订单将完成，您可以申请开票。</p><ErrorNotice error={error}/><div className="v3-dialog-actions"><button className="button secondary" disabled={pending} onClick={close}>返回检查</button><button className="button primary" disabled={pending} onClick={()=>void submit({type:"accept",orderId:dialog.order.id})}>{pending?"正在提交…":"确认验收通过"}</button></div></>}
      {dialog?.type==="refund"&&<RefundForm key={dialog.order.id+(dialog.refund?.id||"")} order={dialog.order} refund={dialog.refund} pending={pending} error={error} onSubmit={action=>void submit(action)}/>}
      {dialog?.type==="cancelRefund"&&<><p>取消后服务商将停止处理这笔申请。确认取消「{dialog.refund.name}」的售后申请？</p><ErrorNotice error={error}/><div className="v3-dialog-actions"><button className="button secondary" disabled={pending} onClick={close}>保留申请</button><button className="button primary" disabled={pending} onClick={()=>void submit({type:"cancelRefund",refundId:dialog.refund.id})}>{pending?"正在提交…":"确认取消"}</button></div></>}
      {dialog?.type==="refundDetail"&&<><div className="v3-dialog-lead"><h2>{dialog.refund.name}</h2><Status value={dialog.refund.status} text={refundStatus[dialog.refund.status]}/></div><dl className="v3-dialog-facts"><div><dt>售后编号</dt><dd>{dialog.refund.id}</dd></div><div><dt>退款金额</dt><dd>{currency(dialog.refund.amount)}</dd></div><div><dt>申请原因</dt><dd>{dialog.refund.reason}</dd></div><div><dt>处理反馈</dt><dd>{dialog.refund.note}</dd></div></dl><Link to={`/account/orders/services?order=${dialog.refund.orderId}`} className="button secondary" onClick={()=>setDialog(null)}>查看原订单 <ArrowRight size={15}/></Link></>}
      {dialog?.type==="invoice"&&<InvoiceForm key={dialog.invoice.id} invoice={dialog.invoice} enterprise={session?.enterprise||""} pending={pending} error={error} onSubmit={action=>void submit(action)}/>}
      {dialog?.type==="invoiceDetail"&&<><div className="v3-dialog-lead"><h2>{dialog.order.name}</h2><Status value={dialog.invoice.status} text={invoiceStatus[dialog.invoice.status]}/></div><dl className="v3-dialog-facts">{[["发票抬头",dialog.invoice.title],["纳税人识别号",dialog.invoice.taxId],["开票金额",currency(dialog.invoice.amount)],["发票号码",dialog.invoice.number],["开票日期",dialog.invoice.issuedAt],["接收邮箱",dialog.invoice.email]].filter(([,value])=>value).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>{dialog.invoice.fileUrl&&/^https?:\/\//.test(dialog.invoice.fileUrl)?<a href={dialog.invoice.fileUrl} className="button primary" target="_blank" rel="noreferrer">下载电子发票 <DownloadSimple size={16}/></a>:<p className="notice">{dialog.invoice.status==="processing"?"开票申请正在处理中，开具后将发送至接收邮箱。":"电子发票文件待同步，可通过接收邮箱查收或联系服务商补发。"}</p>}</>}
      </div>
    </Modal>
  </div>;
}
function RefundForm({order,refund,pending,error,onSubmit}:{order:Order;refund?:Refund;pending:boolean;error:unknown;onSubmit:(a:AccountAction)=>void}) {
  const [amount,setAmount]=useState(String(refund?.amount||order.paid-order.refunded));
  const [reason,setReason]=useState(refund?.reason||"");
  const [validation,setValidation]=useState("");
  const submit=(e:FormEvent)=>{e.preventDefault();const value=Number(amount);if(!Number.isFinite(value)||value<=0||value>order.paid-order.refunded){setValidation("退款金额须大于 0 且不超过可退金额");return;}if(reason.trim().length<5){setValidation("请至少填写 5 个字的退款原因");return;}setValidation("");onSubmit({type:"refund",orderId:order.id,refundId:refund?.id,amount:Math.round(value*100)/100,reason:reason.trim()});};
  return <form className="v3-account-form" onSubmit={submit}><p>{order.name}</p><Input label="退款金额（元）" type="number" min="0.01" max={order.paid-order.refunded} step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)} hint={`最多可退 ${currency(order.paid-order.refunded)}`}/><label>申请原因<textarea value={reason} onChange={e=>setReason(e.target.value)} minLength={5} maxLength={500} required rows={4} placeholder="请说明需要退款的原因及相关交付情况"/></label><ErrorNotice error={validation||error}/><button className="button primary" disabled={pending}>{pending?"正在提交…":refund?"重新提交申请":"提交售后申请"}</button></form>;
}
function InvoiceForm({invoice,enterprise,pending,error,onSubmit}:{invoice:Invoice;enterprise:string;pending:boolean;error:unknown;onSubmit:(a:AccountAction)=>void}) {
  const [title,setTitle]=useState(enterprise),[taxId,setTaxId]=useState(""),[email,setEmail]=useState("");
  const [validation,setValidation]=useState("");
  return <form className="v3-account-form" onSubmit={e=>{e.preventDefault();if(title.trim().length<4){setValidation("请填写完整的企业发票抬头");return;}if(!/^[0-9A-HJ-NPQRTUWXY]{18}$/.test(taxId.trim())){setValidation("请填写 18 位统一社会信用代码");return;}setValidation("");onSubmit({type:"invoice",invoiceId:invoice.id,title:title.trim(),taxId:taxId.trim(),email:email.trim()});}}><div className="v3-invoice-form-total"><Receipt size={24}/><span>电子普通发票<strong>{currency(invoice.amount)}</strong></span></div><Input label="发票抬头" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={100} placeholder="请输入企业全称"/><Input label="纳税人识别号" value={taxId} onChange={e=>setTaxId(e.target.value.toUpperCase())} required maxLength={18} placeholder="请输入统一社会信用代码"/><Input label="接收邮箱" type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={100} placeholder="用于接收电子发票"/><ErrorNotice error={validation||error}/><button className="button primary" disabled={pending}>{pending?"正在提交…":"确认申请开票"}</button></form>;
}
