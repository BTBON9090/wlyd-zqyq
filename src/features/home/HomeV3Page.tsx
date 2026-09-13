import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  Check,
  CheckCircle,
  Cube,
  Database,
  Handshake,
  Headset,
  Lightning,
  Minus,
  Newspaper,
  Plus,
  Quotes,
  ShieldCheck,
  Sparkle,
  Star,
  Truck,
} from "@phosphor-icons/react";
import { Modal } from "../../components/ui";
import { asset } from "../../lib/config";
import {
  v3Businesses,
  v3Metrics,
  v3Quality,
  v3Solutions,
  v3Stories,
} from "./homeV3Content";

const icons = {
  services: Handshake,
  finance: Buildings,
  trade: Cube,
  logistics: Truck,
  news: Newspaper,
};

function goToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}

const sectionIds = [
  "v3-hero-title",
  "v3-capabilities",
  "v3-solutions",
  "v3-stories",
  "v3-quality",
  "v3-partners-title",
] as const;

export default function HomeV3Page() {
  const root = useRef<HTMLDivElement>(null);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [qualityIndex, setQualityIndex] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [dialog, setDialog] = useState<{
    title: string;
    text: string;
    steps?: string[];
  } | null>(null);
  const solution = v3Solutions[solutionIndex];
  const story = v3Stories[storyIndex];

  // 追踪当前可见的 section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionIds.indexOf(entry.target.id as typeof sectionIds[number]);
            if (index !== -1) setActiveSection(index);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-20% 0px -50% 0px" },
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Update CSS coordinates directly, without React renders on pointer movement.
    // Delegation also covers the shared header while this V3 page is mounted.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const moveLight = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".v3-button, .header-enterprise")
          : null;
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      target.style.setProperty(
        "--v3-light-x",
        `${event.clientX - bounds.left}px`,
      );
      target.style.setProperty(
        "--v3-light-y",
        `${event.clientY - bounds.top}px`,
      );
    };

    // Architecture card "lift" effect: card tilts toward cursor (event delegation)
    const handleArchMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      const archCard =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".v3-architecture")
          : null;
      if (!archCard) return;
      const bounds = archCard.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      // Tilt: very subtle effect, center is neutral
      const rotateY = (x - 0.5) * 2;  // -1 to 1 deg
      const rotateX = (0.5 - y) * 1.5;  // -0.75 to 0.75 deg
      // Shadow shifts opposite to tilt
      const shadowX = -(x - 0.5) * 4;
      const shadowY = 8 - (y - 0.5) * 3;
      archCard.style.setProperty("--arch-rx", `${rotateX}deg`);
      archCard.style.setProperty("--arch-ry", `${rotateY}deg`);
      archCard.style.setProperty("--arch-shadow-x", `${shadowX}px`);
      archCard.style.setProperty("--arch-shadow-y", `${shadowY}px`);
    };
    const handleArchLeave = (event: PointerEvent) => {
      const archCard =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".v3-architecture")
          : null;
      if (!archCard) return;
      archCard.style.removeProperty("--arch-rx");
      archCard.style.removeProperty("--arch-ry");
      archCard.style.removeProperty("--arch-shadow-x");
      archCard.style.removeProperty("--arch-shadow-y");
    };

    document.addEventListener("pointermove", moveLight, { passive: true });
    document.addEventListener("pointermove", handleArchMove, { passive: true });
    document.addEventListener("pointerleave", handleArchLeave, true);
    return () => {
      document.removeEventListener("pointermove", moveLight);
      document.removeEventListener("pointermove", handleArchMove);
      document.removeEventListener("pointerleave", handleArchLeave, true);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("v3-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    root.current
      ?.querySelectorAll(".v3-reveal")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-v3" ref={root}>
      {/* 左侧栏目指示器 */}
      <nav className="v3-section-indicator" aria-label="页面栏目导航">
        {sectionIds.map((id, index) => (
          <button
            key={id}
            className={activeSection === index ? "is-active" : ""}
            onClick={() => goToSection(id)}
            aria-label={`跳转到第 ${index + 1} 栏目`}
          />
        ))}
      </nav>

      <section className="v3-hero" aria-labelledby="v3-hero-title">
        <div className="v3-hero-halo" aria-hidden="true" />
        <div className="v3-wide v3-hero-main">
          <div className="v3-hero-copy">
            <p className="v3-eyebrow">
              <Sparkle size={17} weight="fill" /> 政企协同 · 产业互联 · 智创未来
            </p>
            <h1 id="v3-hero-title">
              让企业的每一步
              <br />
              <span className="v3-gradient-text">都有向上的力量</span>
            </h1>
            <p className="v3-hero-description">
              连接服务、产业与科技，
              <br className="v3-mobile-break" />
              让好资源汇聚，让新增长发生。
            </p>
            <div className="v3-actions">
              <button
                className="v3-button"
                onClick={() => goToSection("v3-capabilities")}
              >
                发现平台能力 <ArrowUpRight size={19} />
              </button>
              <button
                className="v3-text-link"
                onClick={() => goToSection("v3-stories")}
              >
                看看企业的成长故事 <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="v3-hero-art">
            <img
              src={asset("media/v3/park-hero.webp")}
              alt="通透的科技园区建筑与环绕的蓝紫色连接纽带"
              width="1536"
              height="1024"
              fetchPriority="high"
            />
          </div>
        </div>
        <div className="v3-wide v3-highlights">
          {[
            {
              icon: Sparkle,
              title: "AI 能力，走进真实业务",
              text: "从企业知识库到业务智能体",
              target: "v3-solutions",
            },
            {
              icon: Handshake,
              title: "专业服务，陪伴企业成长",
              text: "覆盖经营全周期的服务支持",
              target: "v3-capabilities",
            },
            {
              icon: Cube,
              title: "产业互联，打开合作空间",
              text: "让采购、物流与金融更好协同",
              target: "v3-solutions",
            },
            {
              icon: ShieldCheck,
              title: "用心服务，让信任发生",
              text: "每一次响应，都值得被认真对待",
              target: "v3-quality",
            },
          ].map(({ icon: Icon, title, text, target }) => (
            <button key={title} onClick={() => goToSection(target)}>
              <Icon size={25} weight="duotone" />
              <strong>
                {title}
                <ArrowUpRight size={16} />
              </strong>
              <span>{text}</span>
            </button>
          ))}
        </div>
      </section>

      <section
        className="v3-impact v3-wide v3-reveal"
        aria-labelledby="v3-impact-title"
      >
        <div className="v3-impact-heading">
          <h2 id="v3-impact-title">
            每一个数字背后，
            <br />
            都是一份信任
          </h2>
        </div>
        <div className="v3-metrics">
          {v3Metrics.map((item) => (
            <div key={item.label}>
              <div className="v3-metric-number">
                {item.value}
                <span>{item.unit}</span>
              </div>
              <h3>{item.label}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="v3-capabilities v3-section"
        id="v3-capabilities"
        aria-labelledby="v3-capabilities-title"
      >
        <div className="v3-wide">
          <div className="v3-section-heading v3-reveal">
            <h2 id="v3-capabilities-title">
              企业的万千需求，
              <span className="v3-gradient-text">在这里相连</span>
            </h2>
            <p>六大业务协同，让每一个发展阶段，都有适合的支持。</p>
          </div>
          <div className="v3-business-layout">
            <article className="v3-ai-feature v3-reveal">
              <div>
                <span className="v3-feature-label">
                  <Sparkle size={18} weight="fill" /> AI 赋能
                </span>
                <h3>
                  把智能的可能，
                  <br />
                  变成增长的日常
                </h3>
                <p>
                  从一个问题的解答，到一段流程的优化。
                  <br />让 AI 真正融入企业的工作方式。
                </p>
                <button
                  className="v3-button"
                  onClick={() => {
                    setSolutionIndex(0);
                    goToSection("v3-solutions");
                  }}
                >
                  探索 AI 解决方案 <ArrowUpRight size={18} />
                </button>
              </div>
              <div className="v3-ai-symbol" aria-hidden="true">
                <img
                  src={asset("media/v3/ai-sculpture-transparent.png")}
                  alt=""
                  width="1536"
                  height="1024"
                  loading="lazy"
                />
              </div>
              <div className="v3-ai-bottom">
                <span>企业知识库</span>
                <span>业务智能体</span>
                <span>场景定制</span>
              </div>
            </article>
            <div className="v3-business-list">
              {v3Businesses.map((business) => {
                const Icon = icons[business.icon as keyof typeof icons];
                return (
                  <Link
                    to={business.to}
                    className="v3-business-row v3-reveal"
                    key={business.icon}
                  >
                    <div
                      className={`v3-business-icon v3-icon-${business.icon}`}
                    >
                      <Icon size={28} weight="duotone" />
                    </div>
                    <div>
                      <div className="v3-business-title">
                        <h3>{business.title}</h3>
                        <span>{business.brand}</span>
                      </div>
                      <p>{business.description}</p>
                    </div>
                    <ArrowUpRight size={21} className="v3-row-arrow" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        className="v3-solutions v3-section"
        id="v3-solutions"
        aria-labelledby="v3-solutions-title"
      >
        <div className="v3-wide">
          <div className="v3-section-heading v3-centered v3-reveal">
            <h2 id="v3-solutions-title">
              好技术，要解决<span className="v3-gradient-text">真问题</span>
            </h2>
            <p>围绕真实业务场景，构建适合企业的数字化方案。</p>
          </div>
          <div
            className="v3-solution-tabs"
            role="tablist"
            aria-label="技术方案"
            onKeyDown={(event) => {
              const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
              if (!keys.includes(event.key)) return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? v3Solutions.length - 1
                    : (solutionIndex +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        v3Solutions.length) %
                      v3Solutions.length;
              setSolutionIndex(next);
              document
                .getElementById(`v3-tab-${v3Solutions[next].id}`)
                ?.focus();
            }}
          >
            {v3Solutions.map((item, index) => (
              <button
                key={item.id}
                role="tab"
                id={`v3-tab-${item.id}`}
                aria-controls="v3-solution-panel"
                aria-selected={solutionIndex === index}
                tabIndex={solutionIndex === index ? 0 : -1}
                onClick={() => setSolutionIndex(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            className="v3-solution-panel"
            role="tabpanel"
            id="v3-solution-panel"
            aria-labelledby={`v3-tab-${solution.id}`}
            tabIndex={0}
          >
            <div className="v3-solution-copy" key={solution.id}>
              <span className="v3-feature-label">场景化解决方案</span>
              <h3>{solution.title}</h3>
              <p>{solution.description}</p>
              <div className="v3-chips">
                {solution.chips.map((chip) => (
                  <span key={chip}>
                    <Check size={18} />
                    {chip}
                  </span>
                ))}
              </div>
              <button
                className="v3-button"
                onClick={() =>
                  setDialog({
                    title: solution.detail,
                    text: solution.body,
                    steps: solution.steps,
                  })
                }
              >
                了解方案 <ArrowUpRight size={18} />
              </button>
            </div>
            <div
              className="v3-architecture"
              aria-label={`${solution.label}能力架构`}
              key={`${solution.id}-diagram`}
            >
              <div className="v3-architecture-top">
                <span>{solution.layers[0]}</span>
                <span>按需组合 · 灵活扩展</span>
              </div>
              <div className="v3-architecture-apps">
                {solution.nodes.map((node, index) => {
                  const Icon = [Headset, Newspaper, Lightning, Handshake][
                    index
                  ];
                  return (
                    <div key={node}>
                      <Icon size={25} weight="duotone" />
                      <span>{node}</span>
                    </div>
                  );
                })}
              </div>
              <div className="v3-connectors" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="v3-architecture-data">
                <Database size={24} weight="duotone" />
                <strong>{solution.layers[1]}</strong>
                <span>连接 · 治理 · 沉淀</span>
              </div>
              <div className="v3-architecture-engine">
                <Sparkle size={25} weight="fill" />
                <strong>{solution.layers[2]}</strong>
                <span>驱动业务创新</span>
              </div>
              <div className="v3-architecture-foot">
                <ShieldCheck size={16} /> 权限管理 <span /> 数据安全 <span />{" "}
                系统集成
              </div>
            </div>
          </div>
          <div className="v3-solution-notes">
            <span>
              <CheckCircle size={18} /> 从业务需求出发
            </span>
            <span>
              <CheckCircle size={18} /> 与现有系统协同
            </span>
            <span>
              <CheckCircle size={18} /> 支持持续演进
            </span>
          </div>
        </div>
      </section>

      <section
        className="v3-stories v3-section"
        id="v3-stories"
        aria-labelledby="v3-stories-title"
      >
        <div className="v3-wide">
          <div className="v3-section-heading v3-reveal">
            <h2 id="v3-stories-title">
              与企业一起，
              <span className="v3-gradient-text">把改变变成日常</span>
            </h2>
            <p>
              看见不同企业的成长，也看见平台服务的价值。
            </p>
          </div>
          <div className="v3-story-layout v3-reveal">
            <article className="v3-story-main">
              <img
                src={asset("media/v3/customer-campus.webp")}
                alt="先进制造园区场景示意，AI 生成"
                width="1536"
                height="1024"
                loading="lazy"
              />
              <div className="v3-story-copy">
                <span className="v3-feature-label">{story.category}</span>
                <h3>{story.title}</h3>
                <p>{story.description}</p>
                <button
                  className="v3-text-link"
                  onClick={() =>
                    setDialog({ title: story.title, text: story.detail })
                  }
                >
                  阅读成长故事 <ArrowUpRight size={18} />
                </button>
              </div>
            </article>
            <div className="v3-story-side">
              <div className="v3-story-results">
                <div className="v3-story-result">
                  <span>{story.company}</span>
                  <strong>{story.result}</strong>
                  <p>{story.resultLabel}</p>
                </div>
                <div className="v3-story-result">
                  <span>成效数据</span>
                  <strong>{story.result2}</strong>
                  <p>{story.result2Label}</p>
                </div>
              </div>
              <figure className="v3-quote">
                <Quotes size={33} weight="fill" />
                <blockquote>{story.quote}</blockquote>
                <figcaption>
                  <span className="v3-person-icon">
                    <Buildings size={22} />
                  </span>
                  <div>
                    <strong>{story.person}</strong>
                    <span>{story.company}</span>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>
          <div className="v3-story-controls" aria-label="选择客户故事">
            {v3Stories.map((item, index) => (
              <button
                key={item.company}
                onClick={() => setStoryIndex(index)}
                aria-pressed={index === storyIndex}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.category}
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section
        className="v3-quality v3-section"
        id="v3-quality"
        aria-labelledby="v3-quality-title"
      >
        <div className="v3-wide v3-quality-layout">
          <div className="v3-quality-intro v3-reveal">
            <span className="v3-quality-mark">
              <ShieldCheck size={48} weight="duotone" />
            </span>
            <h2 id="v3-quality-title">
              值得托付的服务，
              <br />
              从认真对待每件事开始
            </h2>
            <p>
              专业有标准，过程有回应，结果有回访。
              <br />
              让每一次合作，都成为下一次信任的开始。
            </p>
            <div className="v3-rating">
              <span>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} weight="fill" size={18} />
                ))}
              </span>
              用心回应每一份期待
            </div>
          </div>
          <div className="v3-quality-accordion">
            {v3Quality.map((item, index) => (
              <div
                className={qualityIndex === index ? "is-active" : ""}
                key={item.title}
              >
                <h3>
                  <button
                    onClick={() =>
                      setQualityIndex(qualityIndex === index ? -1 : index)
                    }
                    aria-expanded={qualityIndex === index}
                    aria-controls={`v3-quality-${index}`}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {item.title}
                    {qualityIndex === index ? (
                      <Minus size={20} />
                    ) : (
                      <Plus size={20} />
                    )}
                  </button>
                </h3>
                <div id={`v3-quality-${index}`}>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 生态合作伙伴 */}
      <section className="v3-partners v3-section v3-reveal" aria-labelledby="v3-partners-title">
        <div className="v3-section-heading">
          <h2 id="v3-partners-title">生态合作伙伴</h2>
          <p>携手 200+ 专业伙伴，连接产业资源，共建服务生态</p>
        </div>
        <div className="v3-partners-track">
          <div className="v3-partners-row" data-direction="left">
            {/* 两组相同的 logo 实现无缝滚动 */}
            {[0, 1].map((set) =>
              Array.from({ length: 10 }, (_, i) => (
                <div className="v3-partner-logo" key={`row1-${set}-${i}`}>
                  <span>Partner {i + 1}</span>
                </div>
              ))
            )}
          </div>
          <div className="v3-partners-row" data-direction="right">
            {[0, 1].map((set) =>
              Array.from({ length: 10 }, (_, i) => (
                <div className="v3-partner-logo" key={`row2-${set}-${i}`}>
                  <span>Partner {i + 11}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="v3-closing v3-wide v3-reveal">
        <div className="v3-closing-glow" aria-hidden="true" />
        <div>
          <p>连接现在，共创下一程</p>
          <h2>
            企业向上，<span className="v3-gradient-text">我们同行</span>
          </h2>
        </div>
        <Link to="/onboarding" className="v3-button">
          加入政企园区 <ArrowUpRight size={20} />
        </Link>
      </section>

      <Modal
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={dialog?.title || "方案详情"}
      >
        <div className="v3-detail">
          <p>{dialog?.text}</p>
          {dialog?.steps && (
            <ol>
              {dialog.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          <button className="button primary" onClick={() => setDialog(null)}>
            了解了 <Check size={17} />
          </button>
        </div>
      </Modal>
    </div>
  );
}
