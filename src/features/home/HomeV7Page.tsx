import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  ChartLineUp,
  CheckCircle,
  ClipboardText,
  Cube,
  FileText,
  Handshake,
  Headset,
  Lightning,
  MagnifyingGlass,
  Newspaper,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react";
import { EmptyState, Skeletons } from "../../components/ui";
import { categories } from "../../data/categories";
import { gateway } from "../../lib/api";
import { asset } from "../../lib/config";
import { ServiceCard } from "../services/ServiceCard";

const taskEntries = [
  { label: "查找企业服务", note: "按事项和行业筛选", to: "/services", icon: MagnifyingGlass },
  { label: "提交服务需求", note: "由平台协助对接", to: "/services/requests", icon: ClipboardText },
  { label: "查看服务订单", note: "跟进合同与交付", to: "/account/orders/services", icon: FileText },
  { label: "办理企业入驻", note: "完善档案与资质", to: "/onboarding", icon: Buildings },
];

const businessEntries = [
  { label: "企业服务", note: "专业机构服务企业全生命周期", to: "/services", icon: Handshake },
  { label: "数智金融", note: "融资与经营资金服务", to: "/finance", icon: ChartLineUp },
  { label: "商品交易", note: "采购、询价与供需连接", to: "/procurement", icon: Cube },
  { label: "智慧物流", note: "发运、调度与履约协同", to: "/logistics", icon: Truck },
  { label: "产业资讯", note: "园区政策与产业动态", to: "/news", icon: Newspaper },
  { label: "AI 赋能", note: "企业经营智能化工具", to: "/ai", icon: Lightning },
];

const assurances = [
  { title: "服务信息清楚", note: "范围、周期和价格集中展示", icon: FileText },
  { title: "服务机构可查", note: "企业信息与服务案例可追溯", icon: ShieldCheck },
  { title: "交付进度可见", note: "合同、节点和验收统一留痕", icon: CheckCircle },
  { title: "平台服务响应", note: "遇到问题可申请平台协助", icon: Headset },
];

export default function HomeV7Page() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const services = useQuery({ queryKey: ["services"], queryFn: ({ signal }) => gateway.services(signal) });
  const visibleServices = useMemo(() => {
    const source = services.data ?? [];
    return source
      .filter((item) => category === "all" || item.categoryId === category)
      .sort((a, b) => Number(Boolean(b.hot)) - Number(Boolean(a.hot)))
      .slice(0, 8);
  }, [category, services.data]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = keyword.trim();
    navigate(query ? `/services/hall?q=${encodeURIComponent(query)}` : "/services/hall");
  };

  return (
    <div className="home-v7">
      <section className="v7-hero" aria-labelledby="v7-hero-title">
        <div className="v7-container">
          <div className="v7-hero-main">
            <div className="v7-hero-copy">
              <p className="v7-overline"><span>V7</span> 企业办事与经营服务平台</p>
              <h1 id="v7-hero-title">企业办事<br />更清楚，更高效</h1>
              <p>围绕企业经营中的实际事项，集中提供专业服务、产业资源和办事进度查询。</p>
              <form className="v7-search" onSubmit={submitSearch} role="search">
                <MagnifyingGlass aria-hidden="true" />
                <input aria-label="搜索平台服务" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入服务名称、事项或服务商" />
                <button type="submit">搜索服务</button>
              </form>
              <div className="v7-hotwords" aria-label="热门搜索">
                <span>热门：</span>
                <Link to="/services/hall?q=商标注册">商标注册</Link>
                <Link to="/services/hall?q=代理记账">代理记账</Link>
                <Link to="/services/hall?q=合同审查">合同审查</Link>
              </div>
            </div>
            <div className="v7-task-panel">
              <header><span>常用事项</span><Link to="/services">全部服务 <ArrowRight /></Link></header>
              <div>
                {taskEntries.map(({ label, note, to, icon: Icon }) => (
                  <Link to={to} key={label}>
                    <span className="v7-task-icon"><Icon /></span>
                    <span><strong>{label}</strong><small>{note}</small></span>
                    <ArrowUpRight className="v7-task-arrow" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="v7-hero-photo">
            <img src={asset("media/v3/customer-campus.webp")} alt="园区企业办公和产业环境" />
            <span>服务企业发展 · 连接园区资源</span>
          </div>
        </div>
      </section>

      <section className="v7-assurance" aria-label="平台服务保障">
        <div className="v7-container">
          {assurances.map(({ title, note, icon: Icon }) => (
            <div key={title}><Icon /><span><strong>{title}</strong><small>{note}</small></span></div>
          ))}
        </div>
      </section>

      <section className="v7-business" aria-labelledby="v7-business-title">
        <div className="v7-container">
          <header className="v7-section-heading">
            <div><p>平台业务</p><h2 id="v7-business-title">企业经营所需，一处连接</h2></div>
            <span>从日常办事到产业协同，为企业提供清晰、稳定的服务入口。</span>
          </header>
          <div className="v7-business-list">
            {businessEntries.map(({ label, note, to, icon: Icon }) => (
              <Link to={to} key={label}>
                <span className="v7-business-icon"><Icon /></span>
                <span><strong>{label}</strong><small>{note}</small></span>
                <ArrowRight />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v7-services" aria-labelledby="v7-services-title">
        <div className="v7-container">
          <header className="v7-section-heading">
            <div><p>热门服务</p><h2 id="v7-services-title">专业服务，信息透明</h2></div>
            <Link className="v7-more-link" to="/services">进入服务大厅 <ArrowRight /></Link>
          </header>
          <div className="v7-filter" aria-label="服务分类">
            {categories.slice(0, 8).map((item) => (
              <button type="button" key={item.id} className={category === item.id ? "is-active" : ""} onClick={() => setCategory(item.id)} aria-pressed={category === item.id}>{item.label}</button>
            ))}
          </div>
          {services.isPending ? <Skeletons /> : services.isError ? (
            <EmptyState error title="服务加载失败" description="请稍后重试，或前往服务大厅查看。" action="重新加载" onAction={() => void services.refetch()} />
          ) : visibleServices.length ? (
            <div className="v7-service-grid">{visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
          ) : (
            <EmptyState title="该分类暂无服务" description="可以切换分类，或提交需求由平台协助对接。" action="提交需求" onAction={() => navigate("/services/requests")} />
          )}
        </div>
      </section>

      <section className="v7-guide" aria-labelledby="v7-guide-title">
        <div className="v7-container v7-guide-inner">
          <div className="v7-guide-copy">
            <p>办事指南</p>
            <h2 id="v7-guide-title">三步完成服务对接</h2>
            <span>减少反复沟通，让需求、方案和交付节点保持一致。</span>
            <Link to="/services/requests">发布服务需求 <ArrowRight /></Link>
          </div>
          <ol>
            <li><span>1</span><div><strong>选择服务或提交需求</strong><p>明确事项、预算与期望完成时间。</p></div></li>
            <li><span>2</span><div><strong>确认方案与服务范围</strong><p>核对交付内容、服务周期和费用。</p></div></li>
            <li><span>3</span><div><strong>在线跟进与验收</strong><p>查看节点记录，完成验收或申请售后。</p></div></li>
          </ol>
        </div>
      </section>
    </div>
  );
}
