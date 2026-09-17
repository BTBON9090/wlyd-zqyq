import { BusinessSections } from "./BusinessSections";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { ContentImage } from "../../components/ContentImage";
import { useStickyList } from "../../components/useStickyList";
import { EmptyState, Modal, Skeletons } from "../../components/ui";
import { useApp } from "../../app/AppProvider";
import { categories } from "../../data/categories";
import { DEMO, site } from "../../lib/config";
import { gateway } from "../../lib/api";
import { ServiceCard } from "../services/ServiceCard";
import {
  capabilities,
  defaultHomeContent,
  loadHomeContent,
  resourceViews,
} from "./homeContent";

const campaigns = [
  {
    title: "物流专项抵扣券",
    amount: "500",
    unit: "元",
    scope: "助力企业物流发运",
    detail:
      "适用于物流运费抵扣活动。实际领取条件、可用范围、有效期与核销方式，应以运营发布的活动规则为准。",
  },
  {
    title: "数字化转型补贴券",
    amount: "5000",
    unit: "元",
    scope: "支持企业数字化升级",
    detail:
      "适用于 AI 定制服务活动。正式发布前需由运营确认补贴主体、参与条件、额度及核销方式。",
  },
  {
    title: "融资贴息专项券",
    amount: "1",
    unit: "%",
    scope: "对接企业融资服务",
    detail:
      "融资贴息按 1% 展示，不代表贷款利率或获批承诺。正式规则由活动主体与合作金融机构发布。",
  },
];
const partners = ["本地服务商", "金融机构", "科研院所", "物流企业", "科技公司"];

export default function HomeV2Page({ variant = "v2" }: { variant?: "v2" | "v4" }) {
  const navigate = useNavigate();
  const { session, openAuth } = useApp();
  const pageRef = useRef<HTMLDivElement>(null);
  useStickyList(pageRef, variant === "v4");
  const content = useQuery({
    queryKey: ["homepage-content"],
    queryFn: ({ signal }) => loadHomeContent(signal),
    retry: false,
  });
  const settings = content.data || defaultHomeContent;
  const [failedBanner, setFailedBanner] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [bannerHeld, setBannerHeld] = useState(false);
  const [pageHidden, setPageHidden] = useState(() => document.hidden);
  const [bannerCycle, setBannerCycle] = useState(0);
  const [capabilityIndex, setCapabilityIndex] = useState(0);
  const [resourceIndex, setResourceIndex] = useState(0);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ title: string; text: string } | null>(
    null,
  );
  const services = useQuery({
    queryKey: ["services"],
    queryFn: ({ signal }) => gateway.services(signal),
  });
  const slide = settings.banners[slideIndex % settings.banners.length];
  const capability = capabilities[capabilityIndex];
  const resource = resourceViews[resourceIndex];
  const list = (services.data || [])
    .filter((s) => category === "all" || s.categoryId === category)
    .slice(0, 12);
  const [activeSection, setActiveSection] = useState("capabilities");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActiveSection(entry.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    document
      .querySelectorAll(".showcase-home section[id]")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (services.isPending || !window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    const frame = requestAnimationFrame(() =>
      target?.scrollIntoView({ behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [services.isPending]);
  const bannerCount = settings.banners.length;
  /** 手动切换：立即生效，并重新开始自动轮换计时。 */
  function showSlide(index: number) {
    setSlideIndex(((index % bannerCount) + bannerCount) % bannerCount);
    setBannerCycle((n) => n + 1);
  }
  // Banner 自动轮换：悬停或键盘聚焦时暂停，页面切到后台时暂停，系统偏好减弱动态时不轮换。
  useEffect(() => {
    if (bannerCount < 2 || bannerHeld || pageHidden) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setSlideIndex((i) => (i + 1) % bannerCount),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [bannerCount, bannerHeld, pageHidden, bannerCycle]);
  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  function search(e: FormEvent) {
    e.preventDefault();
    navigate(
      `/services/hall${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`,
    );
  }
  const imageOnly =
    variant !== "v4" && slide.imageOnly &&
    !!(slide.image || slide.mobileImage) &&
    failedBanner !== `${slide.image}|${slide.mobileImage}`;
  const bannerTarget =
    slide.target === "capabilities"
      ? "#capabilities"
      : slide.target === "services"
        ? "/services"
        : "/onboarding";
  const showCapability = () => {
    const destinations: Record<string, string> = {
      services: "/services",
      logistics: "/logistics",
      ai: "/ai",
      finance: "/finance",
      trade: "/procurement",
      news: "/news",
    };
    navigate(destinations[capability.id]);
  };
  return (
    <div ref={pageRef} className={`showcase-home${variant === "v4" ? " home-v4" : ""}`}>
      {/* V4：Banner 区（hero + 搜索栏 + 优惠券栏）共用一块自上而下的渐变 */}
      <div className={variant === "v4" ? "v4-banner" : undefined}>
      <section
        className={`showcase-hero ${imageOnly ? "is-image-only" : ""}`}
        aria-label="平台宣传 Banner"
        onMouseEnter={() => setBannerHeld(true)}
        onMouseLeave={() => setBannerHeld(false)}
        onFocus={() => setBannerHeld(true)}
        onBlur={() => setBannerHeld(false)}
      >
        <div className="showcase-hero-media">
          <ContentImage
            key={`${slide.id}-${slide.image}`}
            src={variant === "v4" ? "media/v3/park-hero.webp" : slide.image}
            mobileSrc={variant === "v4" ? undefined : slide.mobileImage}
            alt={slide.label}
            eager
            onUnavailable={() =>
              setFailedBanner(`${slide.image}|${slide.mobileImage}`)
            }
            placeholder="园区形象宣传图 · 待上传"
          />
        </div>
        {imageOnly ? (
          <Link
            className="hero-image-link"
            onClick={(e) => {
              if (slide.target === "capabilities") {
                e.preventDefault();
                document
                  .getElementById("capabilities")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            to={bannerTarget}
            aria-label={slide.actionLabel}
          />
        ) : (
          <div className="showcase-container hero-inner" key={slide.id}>
            <div className="hero-editorial">
              <p className="hero-kicker">{slide.label}</p>
              <h1>
                {slide.title}
                <br />
                <em>{slide.emphasis}</em>
              </h1>
              <p className="hero-description">{slide.description}</p>
              <Link
                className="showcase-button hero-action"
                onClick={(e) => {
                  if (slide.target === "capabilities") {
                    e.preventDefault();
                    document
                      .getElementById("capabilities")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                to={bannerTarget}
              >
                {slide.actionLabel}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}
        <div className="showcase-container hero-bottom">
          <div className="hero-slides" aria-label="选择宣传专题">
            {settings.banners.map((banner, i) => (
              <button
                key={banner.id}
                aria-pressed={i === slideIndex % settings.banners.length}
                onClick={() => showSlide(i)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {banner.label.split(" · ")[0]}
              </button>
            ))}
          </div>
          <div className="hero-arrows">
            <button
              aria-label="上一张 Banner"
              onClick={() => showSlide(slideIndex - 1)}
            >
              <CaretLeft size={18} />
            </button>
            <button
              aria-label="下一张 Banner"
              onClick={() => showSlide(slideIndex + 1)}
            >
              <CaretRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <div className="showcase-container">
        <section className="showcase-entry" aria-label="服务搜索与快捷入口">
          <div className="entry-intro">
            <strong>企业所需，即刻找到</strong>
            <span>找服务 · 找商家 · 找合作</span>
          </div>
          <form className="showcase-search" onSubmit={search} role="search">
            <MagnifyingGlass size={19} />
            <input
              aria-label="搜索服务或商家"
              placeholder="搜索服务名称、关键词或商家"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={100}
            />
            <button type="submit">搜索</button>
          </form>
          <Link
            className="entry-account"
            to={session ? "/services/requests" : "/"}
            onClick={(event) => {
              if (session) return;
              event.preventDefault();
              openAuth({ returnTo: "/services/requests" });
            }}
          >
            <strong>{session ? "我的服务申请" : "登录 / 注册"}</strong>
            <span>
              {session ? "查看需求与办理进度" : "开启您的企业服务之旅"}
            </span>
            <ArrowRight size={17} />
          </Link>
        </section>

        <section className="showcase-campaigns" aria-label="园区活动专区">
          <div className="campaigns-heading">
            <span>园区企业专享</span>
            <h2>
              好服务
              <br />
              更有好礼
            </h2>
            <small>关注园区服务活动</small>
          </div>
          {campaigns.map((campaign, i) => (
            <button
              className="campaign-coupon"
              key={campaign.title}
              onClick={() =>
                setDialog({
                  title: campaign.title,
                  text: DEMO
                    ? `${campaign.detail} 当前为活动展示，尚未接入领取与核销，不会发放实际优惠。`
                    : "当前暂无已发布活动。活动开放后，可在此查看参与条件和使用规则。",
                })
              }
            >
              <div className="coupon-amount">
                {DEMO ? (
                  <>
                    <strong>{campaign.amount}</strong>
                    <span>{campaign.unit}</span>
                  </>
                ) : (
                  <strong className="coupon-text">
                    {["物流发运", "数字升级", "融资服务"][i]}
                  </strong>
                )}
              </div>
              <div className="coupon-content">
                <h3>{campaign.title}</h3>
                <p>{campaign.scope}</p>
                <span>
                  {variant === "v4" ? (DEMO ? "领取优惠券" : "查看领取规则") : "了解活动"} <ArrowRight size={variant === "v4" ? 16 : 13} />
                </span>
              </div>
            </button>
          ))}
        </section>
      </div>
      </div>

      <nav className="showcase-section-nav" data-list-sticky aria-label="首页专题导航">
        <div className="showcase-container">
          <span>发现平台价值</span>
          {[
            ["capabilities", "六大业务"],
            ["market-services", "精选服务"],
            ["finance-business", "数智金融"],
            ["trade-business", "商品交易"],
            ["logistics-business", "智慧物流"],
            ["industry-resources", "产业资源"],
            ["partner-ecosystem", "生态合作"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={activeSection === id ? "is-active" : ""}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section
        className="showcase-container showcase-section"
        id="capabilities"
      >
        <div className="showcase-heading">
          <h2>一个平台，连接企业发展的每一环</h2>
          <p>依托万联易达集团生态，汇聚六大业务服务与产业资源。</p>
        </div>
        <div className="capability-tabs" role="group" aria-label="平台业务介绍">
          {capabilities.map((item, i) => (
            <button
              key={item.id}
              aria-pressed={i === capabilityIndex}
              onClick={() => setCapabilityIndex(i)}
            >
              <strong>{item.title}</strong>
              <small>{item.brand}</small>
            </button>
          ))}
        </div>
        <div className="capability-feature" key={capability.id}>
          <ContentImage
            src={settings.capabilityImages[capability.id] || (variant === "v4" ? capability.id === "ai" ? "media/v3/ai-sculpture.webp" : "media/v3/customer-campus.webp" : undefined)}
            alt={`${capability.title}业务宣传图`}
            placeholder={`${capability.title}宣传图 · 待上传`}
            className="capability-image"
          />
          <div className="capability-copy">
            <span className="capability-brand">
              {capability.brand} · {capability.title}
            </span>
            <h3>{capability.subtitle}</h3>
            <p>{capability.description}</p>
            <div className="capability-tags">
              {capability.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="capability-points">
              {capability.features.map(([title, description]) => (
                <div key={title}>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              ))}
            </div>
            <button className="showcase-button" onClick={showCapability}>
              {`进入${capability.title}`}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="showcase-market" id="market-services">
        <div className="showcase-container">
          <div className="market-heading">
            <div>
              <h2>企业好服务，就在这里</h2>
              <p>按需求选服务，看清价格与交付，找到适合您的专业商家。</p>
            </div>
            <Link to="/services/hall">
              进入服务大厅 <ArrowRight size={16} />
            </Link>
          </div>
          <div
            className="market-categories"
            role="group"
            aria-label="精选服务分类"
          >
            {categories.map((c) => (
              <button
                key={c.id}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.id === "all" ? "为您推荐" : c.label}
              </button>
            ))}
          </div>
          {services.isPending ? (
            <Skeletons />
          ) : services.isError ? (
            <EmptyState
              error
              title="服务暂时无法加载"
              description="您可以重试，或稍后进入服务大厅。"
              action="重新加载"
              onAction={() => void services.refetch()}
            />
          ) : list.length ? (
            <div className={`market-service-grid${variant === "v4" ? " service-v3" : ""}`} key={category}>
              {list.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="这个分类暂无在售服务"
              description="试试其他分类，或查看全部服务。"
              action="查看全部"
              onAction={() => setCategory("all")}
            />
          )}
          <div className="market-caption">
            <span>服务内容及价格以商家发布与双方确认为准。</span>
            <Link to="/services/hall">
              浏览更多服务 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <BusinessSections
        variant={variant}
        images={variant === "v4" ? { ...settings.businessImages, finance: settings.businessImages.finance || "media/banners/hero-platform.webp", trade: settings.businessImages.trade || "media/banners/hero-services.webp", logistics: settings.businessImages.logistics || "media/banners/hero-park.webp" } : settings.businessImages}
        productImages={settings.productImages}
      />
      <section
        className="showcase-container growth-campaign"
        aria-label="企业服务推广"
      >
        <ContentImage
          src={settings.campaignImage || (variant === "v4" ? "media/banners/hero-services.webp" : undefined)}
          alt="企业成长服务专题广告"
          placeholder="专题广告图 · 待上传"
        />
        <div className="growth-copy">
          <span>陪伴企业成长</span>
          <h2>
            从起步到进阶
            <br />
            每一步，都有专业同行
          </h2>
          <Link className="showcase-button" to="/services">
            寻找适合的服务 <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section
        className="showcase-container showcase-section resource-section"
        id="industry-resources"
      >
        <div className="showcase-heading">
          <h2>立足园区，看见更广阔的产业机会</h2>
          <p>从企业分布到产业协同，把资源、供给和需求连接起来。</p>
        </div>
        <div className="resource-layout">
          <div className="resource-visual">
            <ContentImage
              key={resource.id}
              src={settings.resourceImages[resource.id] || (variant === "v4" ? "media/v3/customer-campus.webp" : undefined)}
              alt={`${resource.title}展示图片`}
              placeholder={`${resource.title}展示图 · 待上传`}
            />
            <div className="resource-image-note">产业全景 · {site.park}</div>
          </div>
          <div className="resource-copy">
            <div
              className="resource-tabs"
              role="group"
              aria-label="产业资源介绍"
            >
              {resourceViews.map((view, i) => (
                <button
                  key={view.id}
                  aria-pressed={resourceIndex === i}
                  onClick={() => setResourceIndex(i)}
                >
                  {view.title}
                </button>
              ))}
            </div>
            <div key={resource.id} className="resource-details">
              <h3>{resource.headline}</h3>
              <p>{resource.description}</p>
              <ul>
                {resource.points.map((point, i) => (
                  <li key={point}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {point}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate(`/map?view=${resource.id}`)}>
                了解产业资源 <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="ecosystem-section" id="partner-ecosystem">
        <div className="showcase-container">
          <div className="showcase-heading">
            <h2>携手生态伙伴，让企业发展更有力量</h2>
            <p>连接专业机构与产业伙伴，共建园区服务生态。</p>
          </div>
          <div className="ecosystem-partners">
            {partners.map((partner) => (
              <div key={partner}>
                <ContentImage
                  src={settings.partnerImages[partner]}
                  alt={`${partner}合作伙伴标识`}
                  placeholder="合作伙伴标识待上传"
                />
                <strong>{partner}</strong>
              </div>
            ))}
          </div>
          <div className="ecosystem-join">
            <div>
              <strong>让企业在这里连接，让生意从这里发生。</strong>
              <p>创建或加入企业，开启园区服务与合作之旅。</p>
            </div>
            <Link className="showcase-button" to="/onboarding">
              立即入驻园区 <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      {content.isError && (
        <div className="showcase-container content-retry" role="status">
          宣传内容暂时无法更新，已显示默认介绍。
          <button onClick={() => void content.refetch()}>重新加载</button>
        </div>
      )}
      <Modal
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={dialog?.title || "业务介绍"}
        description={dialog?.text}
      >
        <button className="button primary" onClick={() => setDialog(null)}>
          知道了
        </button>
      </Modal>
    </div>
  );
}
