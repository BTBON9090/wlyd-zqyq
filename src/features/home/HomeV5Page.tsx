import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
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

const capabilities = [
  { label: "企业服务", note: "工商财税、知产与专业服务", to: "/services", icon: Handshake, code: "01" },
  { label: "智慧物流", note: "发运、调度与履约协同", to: "/logistics", icon: Truck, code: "02" },
  { label: "AI 赋能", note: "企业场景的智能化工具", to: "/ai", icon: Lightning, code: "03" },
  { label: "数智金融", note: "融资与经营资金服务", to: "/finance", icon: Buildings, code: "04" },
  { label: "商品交易", note: "集采、询价与供需连接", to: "/procurement", icon: Cube, code: "05" },
  { label: "产业资讯", note: "政策、园区与产业动态", to: "/news", icon: Newspaper, code: "06" },
];

const shortcuts = [
  { label: "提交服务需求", note: "讲清需求，快速对接", to: "/services/requests", icon: ClipboardText },
  { label: "我的服务订单", note: "查看履约与交付进度", to: "/account/orders/services", icon: FileText },
  { label: "企业档案资质", note: "维护认证与企业资料", to: "/account/profile", icon: ShieldCheck },
  { label: "需要人工协助", note: "由平台协助梳理需求", to: "/services/requests", icon: Headset },
];

export default function HomeV5Page() {
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
    <div className="home-v5">
      <section className="v5-hero" aria-labelledby="v5-hero-title">
        <div className="v5-container v5-hero-grid">
          <div className="v5-hero-copy">
            <p className="v5-kicker"><span>V5</span> 园区企业经营服务中枢</p>
            <h1 id="v5-hero-title">经营所需<br /><strong>一站抵达</strong></h1>
            <p className="v5-hero-lead">汇集专业服务、产业资源与园区协同能力，让企业从找到服务到完成交付都有清晰路径。</p>
            <div className="v5-hero-actions">
              <Link className="v5-button v5-button-primary" to="/services">浏览企业服务 <ArrowRight /></Link>
              <Link className="v5-button v5-button-quiet" to="/services/requests">发布需求 <ArrowUpRight /></Link>
            </div>
          </div>
          <div className="v5-hero-visual">
            <img src={asset("media/v3/customer-campus.webp")} alt="园区企业办公与产业环境" />
            <div className="v5-hero-index" aria-hidden="true"><span>企业经营</span><strong>06</strong><small>项平台能力</small></div>
          </div>
        </div>
        <form className="v5-search" onSubmit={submitSearch} role="search">
          <div className="v5-container v5-search-inner">
            <label htmlFor="v5-home-search">搜索平台服务</label>
            <div className="v5-search-field">
              <MagnifyingGlass aria-hidden="true" />
              <input id="v5-home-search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="输入服务名称、关键词或商家" />
              <button type="submit">搜索 <ArrowRight /></button>
            </div>
          </div>
        </form>
      </section>

      <section className="v5-shortcuts" aria-labelledby="v5-shortcuts-title">
        <div className="v5-container">
          <div className="v5-section-heading compact">
            <p>QUICK ACCESS</p>
            <h2 id="v5-shortcuts-title">今日办事入口</h2>
          </div>
          <div className="v5-shortcut-grid">
            {shortcuts.map(({ label, note, to, icon: Icon }) => (
              <Link to={to} key={label}>
                <Icon weight="regular" />
                <span><strong>{label}</strong><small>{note}</small></span>
                <ArrowUpRight className="v5-link-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v5-capabilities" aria-labelledby="v5-capabilities-title">
        <div className="v5-container">
          <div className="v5-section-heading inverse">
            <p>PLATFORM CAPABILITIES</p>
            <h2 id="v5-capabilities-title">六大业务，构成企业经营底座</h2>
            <span>从日常办事到产业协同，把分散资源组织成可到达的服务入口。</span>
          </div>
          <div className="v5-capability-list">
            {capabilities.map(({ label, note, to, icon: Icon, code }) => (
              <Link to={to} key={label}>
                <span className="v5-capability-code">{code}</span>
                <Icon />
                <span><strong>{label}</strong><small>{note}</small></span>
                <ArrowUpRight className="v5-link-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v5-services" aria-labelledby="v5-services-title">
        <div className="v5-container">
          <div className="v5-section-heading">
            <p>SELECTED SERVICES</p>
            <h2 id="v5-services-title">专业服务，按经营阶段筛选</h2>
            <span>从企业开办、日常经营到成长升级，找到与当前问题更接近的解决方案。</span>
          </div>
          <div className="v5-filter-row" aria-label="服务分类">
            {categories.slice(0, 8).map((item) => (
              <button type="button" key={item.id} className={category === item.id ? "is-active" : ""} onClick={() => setCategory(item.id)} aria-pressed={category === item.id}>{item.label}</button>
            ))}
            <Link to="/services">全部分类 <ArrowRight /></Link>
          </div>
          {services.isPending ? <Skeletons /> : services.isError ? (
            <EmptyState error title="服务暂时加载失败" description="请稍后重试，或前往服务大厅查看。" action="重新加载" onAction={() => void services.refetch()} />
          ) : visibleServices.length ? (
            <div className="v5-service-grid">{visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
          ) : (
            <EmptyState title="该分类暂无服务" description="可以切换其他分类，或发布需求让平台协助对接。" action="发布需求" onAction={() => navigate("/services/requests")} />
          )}
        </div>
      </section>

      <section className="v5-process" aria-labelledby="v5-process-title">
        <div className="v5-container">
          <div className="v5-process-intro">
            <p>DELIVERY PATH</p>
            <h2 id="v5-process-title">每一步都看得见</h2>
            <span>服务选择、需求沟通与交付进度集中在同一条路径中，减少反复确认。</span>
          </div>
          <ol className="v5-process-list">
            <li><span>01</span><strong>找到合适服务</strong><p>按行业、事项与预算筛选，先看清服务范围。</p></li>
            <li><span>02</span><strong>讲清企业需求</strong><p>补充目标、周期和附件，让服务商准确响应。</p></li>
            <li><span>03</span><strong>跟进履约交付</strong><p>在个人中心查看节点、材料、验收与售后记录。</p></li>
          </ol>
        </div>
      </section>

      <section className="v5-final-cta" aria-label="发布企业服务需求">
        <div className="v5-container">
          <div><p>未找到现成服务？</p><h2>把经营难题交给专业的人</h2></div>
          <Link className="v5-button v5-button-light" to="/services/requests">发布服务需求 <ArrowUpRight /></Link>
        </div>
      </section>
    </div>
  );
}
