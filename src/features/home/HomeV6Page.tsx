import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  ChartLineUp,
  Cube,
  Handshake,
  Lightning,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react";
import { EmptyState, Skeletons } from "../../components/ui";
import { categories } from "../../data/categories";
import { gateway } from "../../lib/api";
import { asset } from "../../lib/config";
import { ServiceCard } from "../services/ServiceCard";

const scenes = [
  { label: "专业服务", note: "把复杂事项交给专业机构", to: "/services", icon: Handshake, className: "main" },
  { label: "智慧物流", note: "让每一次发运都有清晰路径", to: "/logistics", icon: Truck, className: "leaf" },
  { label: "数智金融", note: "匹配企业不同阶段的资金需求", to: "/finance", icon: ChartLineUp, className: "sand" },
  { label: "商品交易", note: "连接采购、供给与园区集采", to: "/procurement", icon: Cube, className: "ink" },
  { label: "AI 赋能", note: "让智能工具进入经营场景", to: "/ai", icon: Lightning, className: "mist" },
  { label: "产业资讯", note: "从政策变化中发现发展机会", to: "/news", icon: Buildings, className: "vermilion" },
];

const journey = [
  { title: "识需求", text: "从经营问题出发，快速找到对应服务与资源。", icon: MagnifyingGlass },
  { title: "定方案", text: "与服务商确认范围、周期、价格和交付标准。", icon: ShieldCheck },
  { title: "看进度", text: "订单、合同、交付与售后记录集中留痕。", icon: MapPin },
];

export default function HomeV6Page() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const services = useQuery({ queryKey: ["services"], queryFn: ({ signal }) => gateway.services(signal) });
  const visibleServices = useMemo(() => {
    const source = services.data ?? [];
    return source
      .filter((item) => category === "all" || item.categoryId === category)
      .sort((a, b) => Number(Boolean(b.hot)) - Number(Boolean(a.hot)))
      .slice(0, 6);
  }, [category, services.data]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = keyword.trim();
    navigate(query ? `/services/hall?q=${encodeURIComponent(query)}` : "/services/hall");
  };

  return (
    <div className="home-v6">
      <section className="v6-hero" aria-labelledby="v6-hero-title">
        <div className="v6-orbit v6-orbit-one" aria-hidden="true" />
        <div className="v6-orbit v6-orbit-two" aria-hidden="true" />
        <div className="v6-container v6-hero-stage">
          <div className="v6-hero-copy">
            <p className="v6-eyebrow">园区企业服务 · 顺势而为</p>
            <h1 id="v6-hero-title">企业向前<br /><em>服务相伴</em></h1>
            <p className="v6-hero-lead">汇聚园区内外的专业力量，让经营需求被听见、被承接，也让每次合作都有迹可循。</p>
            <div className="v6-hero-actions">
              <Link className="v6-button primary" to="/services">寻一项服务 <ArrowRight /></Link>
              <Link className="v6-text-link" to="/services/requests">说一说您的需求 <ArrowUpRight /></Link>
            </div>
            <form className="v6-search" onSubmit={submitSearch} role="search">
              <MagnifyingGlass aria-hidden="true" />
              <input aria-label="搜索企业服务" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索服务、事项或服务商" />
              <button type="submit" aria-label="提交搜索"><ArrowRight /></button>
            </form>
          </div>
          <div className="v6-hero-window">
            <div className="v6-hero-seal" aria-hidden="true"><small>V6</small><span>园企共生</span></div>
            <img src={asset("media/v3/park-hero.webp")} alt="园区产业建筑与公共空间" />
            <p>在园区找到资源，也找到同行者</p>
          </div>
        </div>
        <div className="v6-wave" aria-hidden="true" />
      </section>

      <section className="v6-journey" aria-labelledby="v6-journey-title">
        <div className="v6-container">
          <header className="v6-section-title centered">
            <p>一条清晰的服务路径</p>
            <h2 id="v6-journey-title">从经营难题，到安心交付</h2>
          </header>
          <ol className="v6-journey-flow">
            {journey.map(({ title, text, icon: Icon }, index) => (
              <li key={title}>
                <span className="v6-journey-icon"><Icon weight="light" /></span>
                <small>0{index + 1}</small>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="v6-scenes" aria-labelledby="v6-scenes-title">
        <div className="v6-container">
          <header className="v6-section-title">
            <p>园区经营六景</p>
            <h2 id="v6-scenes-title">资源各有来处，服务自然相连</h2>
            <span>围绕企业经营中的高频场景，把服务、资金、物流与产业信息组织成顺畅体验。</span>
          </header>
          <div className="v6-scene-mosaic">
            {scenes.map(({ label, note, to, icon: Icon, className }) => (
              <Link className={`v6-scene ${className}`} to={to} key={label}>
                <Icon weight="light" />
                <div><strong>{label}</strong><p>{note}</p></div>
                <ArrowUpRight />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v6-services" aria-labelledby="v6-services-title">
        <div className="v6-container">
          <header className="v6-section-title centered">
            <p>当季精选服务</p>
            <h2 id="v6-services-title">找到适合此刻的专业帮助</h2>
          </header>
          <div className="v6-category-ribbon" aria-label="服务分类">
            {categories.slice(0, 7).map((item) => (
              <button type="button" key={item.id} className={category === item.id ? "is-active" : ""} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>
            ))}
            <Link to="/services">更多服务 <ArrowRight /></Link>
          </div>
          {services.isPending ? <Skeletons /> : services.isError ? (
            <EmptyState error title="服务暂时未能抵达" description="请稍后重试，或前往服务大厅继续浏览。" action="重新加载" onAction={() => void services.refetch()} />
          ) : visibleServices.length ? (
            <div className="v6-service-cascade">{visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
          ) : (
            <EmptyState title="这一分类暂无服务" description="可以换个分类看看，或提交需求由平台帮助对接。" action="提交需求" onAction={() => navigate("/services/requests")} />
          )}
        </div>
      </section>

      <section className="v6-companion" aria-labelledby="v6-companion-title">
        <div className="v6-container v6-companion-stage">
          <div className="v6-companion-image"><img src={asset("media/banners/hero-park.webp")} alt="园区产业与城市环境" /></div>
          <div className="v6-companion-copy">
            <p>与企业并肩成长</p>
            <h2 id="v6-companion-title">服务如水，<br />在需要时抵达</h2>
            <span>从企业开办到经营升级，平台持续连接可信服务商与园区产业资源。</span>
            <Link className="v6-button light" to="/services/requests">发布服务需求 <ArrowUpRight /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
