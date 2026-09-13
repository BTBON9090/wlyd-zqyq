import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  Certificate,
  CheckCircle,
  ClipboardText,
  Compass,
  Headset,
  MagnifyingGlass,
  RocketLaunch,
  ShieldCheck,
  UserCircle,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { gateway } from "../../lib/api";
import { asset, site } from "../../lib/config";
import { categories } from "../../data/categories";
import { useApp } from "../../app/AppProvider";
import { EmptyState, Skeletons } from "../../components/ui";
import { ServiceCard } from "../services/ServiceCard";

const scenarios = [
  {
    title: "企业开办",
    subtitle: "从第一步，就走得更稳",
    icon: Buildings,
    tone: "start",
    links: [
      ["工商财税", "finance_tax"],
      ["商标注册", "ip"],
      ["法律咨询", "legal"],
    ],
  },
  {
    title: "日常经营",
    subtitle: "把精力留给核心业务",
    icon: ClipboardText,
    tone: "operate",
    links: [
      ["财税管理", "finance_tax"],
      ["人力资源", "hr"],
      ["检验检测", "inspection"],
    ],
  },
  {
    title: "业务增长",
    subtitle: "好产品，也值得被看见",
    icon: RocketLaunch,
    tone: "grow",
    links: [
      ["品牌设计", "brand"],
      ["营销推广", "marketing"],
      ["出海服务", "overseas"],
    ],
  },
  {
    title: "数字转型",
    subtitle: "用专业方案提升效率",
    icon: Compass,
    tone: "digital",
    links: [
      ["软件开发", "software"],
      ["管理咨询", "consulting"],
      ["企业综合", "general"],
    ],
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();
  const { session, openAuth } = useApp();
  const services = useQuery({
    queryKey: ["services"],
    queryFn: ({ signal }) => gateway.services(signal),
  });
  const list = [...(services.data || [])]
    .filter((s) => category === "all" || s.categoryId === category)
    .sort((a, b) => Number(b.hot || false) - Number(a.hot || false))
    .slice(0, 6);

  return (
    <div className="container portal-home">
      <section className="home-top-grid">
        <div className="portal-banner">
          {site.hero && (
            <img
              className="banner-photo"
              src={asset(site.hero)}
              alt="园区形象"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <div className="banner-copy">
            <div className="banner-eyebrow">
              <span>企业服务</span> 与园区同行 · 让经营更轻松
            </div>
            <h1>
              企业所需，<em>一站办好。</em>
            </h1>
            <p>从工商财税到数字转型，连接企业成长的每一份专业力量。</p>
            <form
              className="hero-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(
                  `/services/hall${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`,
                );
              }}
            >
              <MagnifyingGlass size={21} />
              <input
                aria-label="搜索企业服务"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索服务、需求或服务商"
                maxLength={100}
              />
              <button className="button primary" type="submit">
                找服务 <ArrowRight size={16} />
              </button>
            </form>
            <div className="hot-search">
              <span>热门</span>
              {["商标注册", "代理记账", "法律服务", "品牌设计"].map((t) => (
                <Link
                  key={t}
                  to={
                    t === "品牌设计"
                      ? "/services/hall?cat=brand"
                      : `/services/hall?q=${encodeURIComponent(t)}`
                  }
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <aside className="home-workspace">
          <div className="workspace-greeting">
            <span className="workspace-avatar">
              <UserCircle size={32} weight="duotone" />
            </span>
            <div>
              <h2>{session ? `您好，${session.name}` : "欢迎来到政企园区"}</h2>
              <p>
                {session
                  ? session.enterprise || "个人账号 · 可随时办理企业入驻"
                  : "登录后，服务办理更便捷"}
              </p>
            </div>
          </div>
          <div className="workspace-primary">
            {session ? (
              <Link
                className="button primary full-width"
                to="/services/requests"
              >
                查看我的申请 <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => openAuth()}
                >
                  立即登录
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => openAuth({ mode: "register" })}
                >
                  注册账号
                </button>
              </>
            )}
          </div>
          <div className="workspace-shortcuts">
            <Link to="/onboarding">
              <Certificate size={23} weight="duotone" />
              <span>
                {session?.enterpriseStatus === "approved"
                  ? "企业已认证"
                  : session?.enterpriseStatus === "pending"
                    ? "入驻审核中"
                    : "企业入驻"}
              </span>
            </Link>
            <Link to="/services/requests">
              <ClipboardText size={23} weight="duotone" />
              <span>我的申请</span>
            </Link>
            <Link to="/services">
              <Compass size={23} weight="duotone" />
              <span>服务大厅</span>
            </Link>
          </div>
          <div className="workspace-tip">
            <ShieldCheck size={17} />
            <span>先了解，再申请，需求提交无需付款</span>
          </div>
        </aside>
      </section>
      <section className="quick-services" aria-label="常用服务">
        {categories.slice(1, 7).map((c) => (
          <Link to={`/services/hall?cat=${c.id}`} key={c.id}>
            <span className={`category-icon tone-${c.id}`}>
              <c.icon size={26} weight="duotone" />
            </span>
            <div>
              <strong>{c.label}</strong>
              <span>{c.description}</span>
            </div>
            <ArrowUpRight className="quick-arrow" size={16} />
          </Link>
        ))}
      </section>
      <section className="home-services-section">
        <div className="home-section-heading">
          <div>
            <h2>
              精选企业服务<span>专业服务，为经营提效</span>
            </h2>
          </div>
          <Link className="text-link" to="/services">
            全部服务 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="home-service-toolbar">
          <div className="section-tabs" aria-label="推荐服务分类">
            {[
              categories[0],
              categories[1],
              categories[2],
              categories[3],
              categories[6],
            ].map((c) => (
              <button
                key={c.id}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.id === "all" ? "热门推荐" : c.label}
              </button>
            ))}
          </div>
          <span className="service-toolbar-note">
            <CheckCircle size={14} />
            看清价格 · 明确交付
          </span>
        </div>
        {services.isPending ? (
          <Skeletons />
        ) : services.isError ? (
          <EmptyState
            error
            title="服务暂时无法加载"
            description="请检查网络后重试。"
            action="重新加载"
            onAction={() => void services.refetch()}
          />
        ) : list.length ? (
          <div className="service-grid" key={category}>
            {list.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <EmptyState
            action="查看全部服务"
            onAction={() => navigate("/services")}
          />
        )}
      </section>
      <section className="scenario-section">
        <div className="home-section-heading">
          <h2>
            按经营场景找服务<span>不必懂分类，从您正在做的事出发</span>
          </h2>
        </div>
        <div className="scenario-grid">
          {scenarios.map((s) => (
            <article
              className={`scenario-card scenario-${s.tone}`}
              key={s.title}
            >
              <div className="scenario-title">
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.subtitle}</p>
                </div>
                <s.icon size={37} weight="duotone" />
              </div>
              <div className="scenario-links">
                {s.links.map(([label, cat]) => (
                  <Link key={cat} to={`/services/hall?cat=${cat}`}>
                    {label}
                    <ArrowUpRight size={13} />
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="home-bottom-grid">
        <div className="join-banner">
          <div>
            <span className="join-icon">
              <Buildings size={33} weight="duotone" />
            </span>
            <div>
              <h2>企业入驻，让服务离您更近</h2>
              <p>创建或加入企业，建立专属企业身份。</p>
            </div>
          </div>
          <Link className="button primary" to="/onboarding">
            办理入驻 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="compact-guide">
          <Headset size={28} weight="duotone" />
          <div>
            <h3>第一次申请服务？</h3>
            <p>浏览服务 → 提交需求 → 沟通方案</p>
          </div>
          <Link aria-label="查看服务并开始申请" to="/services">
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
