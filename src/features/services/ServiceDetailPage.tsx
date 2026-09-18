import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Buildings,
  CaretLeft,
  CaretRight,
  ImageSquare,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from "@phosphor-icons/react";
import { useStickyList } from "../../components/useStickyList";
import { Link, useParams } from "react-router-dom";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { ReviewImages } from "../../components/ReviewImages";
import { EmptyState, Modal } from "../../components/ui";
import { gateway } from "../../lib/api";
import { asset } from "../../lib/config";
import { useDesignVersion } from "../../app/DesignVersion";
import { money } from "../../lib/publishedService";
import type { Service } from "../../lib/models";
export default function ServiceDetailPage() {
  const { serviceId = "" } = useParams();
  const query = useQuery({
    queryKey: ["service", serviceId],
    queryFn: ({ signal }) => gateway.service(serviceId, signal),
    retry: false,
  });
  if (query.isPending)
    return <div className="loading-page">正在加载服务详情…</div>;
  if (query.isError)
    return (
      <div className="commerce-container">
        <EmptyState
          error
          title="暂时无法查看这项服务"
          description={query.error.message}
          action="重新加载"
          onAction={() => void query.refetch()}
        />
        <Link to="/services/hall" className="button secondary">
          返回服务大厅
        </Link>
      </div>
    );
  return <ServiceDetail key={serviceId} service={query.data} />;
}
function ServiceDetail({ service }: { service: Service }) {
  const { commerceVersion: designVersion } = useDesignVersion();
  const rootRef = useRef<HTMLDivElement>(null);
  useStickyList(rootRef, true);
  const [activeSection, setActiveSection] = useState("service-content");
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>(".product-detail-section[id]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const nav = root.querySelector<HTMLElement>(".product-detail-tabs");
      const offset = (document.querySelector(".site-header")?.getBoundingClientRect().height || 72) + (nav?.offsetHeight || 64) + 28;
      const current = sections.filter(section => section.getBoundingClientRect().top <= offset).at(-1) || sections[0];
      if (current) setActiveSection(current.id);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); cancelAnimationFrame(frame); };
  }, []);
  // 发布吸顶标签栏的真实高度，供右侧卡片计算吸顶位置。
  useEffect(() => {
    const root = rootRef.current;
    const nav = root?.querySelector<HTMLElement>(".product-detail-tabs");
    if (!root || !nav) return;
    const sync = () =>
      root.style.setProperty("--detail-tabs-height", `${nav.offsetHeight}px`);
    const observer = new ResizeObserver(sync);
    observer.observe(nav);
    window.addEventListener("resize", sync);
    sync();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);
  const pub = service.published;
  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1));
    const frame = requestAnimationFrame(() =>
      target?.scrollIntoView({ behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  const [versionId, setVersionId] = useState(pub?.versions[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [contact, setContact] = useState(false);
  const [reviewScope, setReviewScope] = useState("service");
  const version = pub?.versions.find((v) => v.id === versionId);
  const gallery = [
    { id: "cover", url: pub?.coverUrl || service.image, name: service.name },
    ...(pub?.media.filter((m) => m.kind === "image") || []),
  ];
  const selected = gallery[imageIndex] || gallery[0];
  const orderUrl = `/services/${service.id}/order${version ? `?version=${encodeURIComponent(version.id)}&quantity=${quantity}` : ""}`;
  const reviews = pub?.reviews.filter((r) => r.scope === reviewScope) || [];
  const all = useQuery({
    queryKey: ["services"],
    queryFn: ({ signal }) => gateway.services(signal),
  });
  const related =
    all.data
      ?.filter((s) => s.id !== service.id && s.provider === service.provider)
      .slice(0, 3) || [];
  return (
    <div ref={rootRef} className={`commerce-container product-detail-v2${designVersion === "v3" ? " product-detail-v3" : ""}`}>
      <Breadcrumb
        detail
        items={[
          { label: "企业服务", to: "/services" },
          {
            label: service.category,
            to: `/services/hall?cat=${service.categoryId}`,
          },
          { label: service.name },
        ]}
      />
      <section className="product-hero">
        <div className="product-gallery">
          <div className="product-gallery-stage">
          <ContentImage
            className="product-main-image"
            src={selected.url}
            alt={selected.name}
            placeholderIcon={<ImageSquare size={44} weight="duotone" />}
            eager
          />
          {gallery.length > 1 && <div className="product-gallery-controls">
            <button aria-label="上一张图片" onClick={() => setImageIndex((imageIndex - 1 + gallery.length) % gallery.length)}><CaretLeft /></button>
            <span aria-live="polite">{imageIndex + 1} / {gallery.length}</span>
            <button aria-label="下一张图片" onClick={() => setImageIndex((imageIndex + 1) % gallery.length)}><CaretRight /></button>
          </div>}
          </div>
          <div className="product-thumbnails">
            {gallery.map((m, i) => (
              <button
                key={m.id}
                aria-label={`查看宣传图 ${i + 1}`}
                aria-pressed={imageIndex === i}
                onClick={() => setImageIndex(i)}
              >
                <ContentImage
                  src={m.url}
                  alt={m.name}
                  placeholder={`宣传图 ${i + 1}`}
                />
              </button>
            ))}
          </div>
          <p className="muted">图片由服务商发布 · 具体服务以所选规格为准</p>
        </div>
        <div className="product-summary">
          <div className="product-category">
            {[
              pub?.categoryL1 || service.category,
              pub?.categoryL2,
              pub?.categoryL3,
            ]
              .filter(Boolean)
              .join(" / ")}
          </div>
          <h1>{service.name}</h1>
          {pub && (
            <div className="product-stats">
              <span>
                服务评分 <strong>{pub.rating.toFixed(1)}</strong>
              </span>
              <span>
                成交 <strong>{pub.salesCount}</strong>
              </span>
            </div>
          )}
          <div className="product-price">
            <span>服务价格</span>
            <strong>
              {version
                ? `¥ ${money(version.price)}`
                : service.price === "按项报价"
                  ? "按需报价"
                  : `¥ ${service.price}`}
            </strong>
            <small>{version ? ` / ${version.unit}` : "起"}</small>
            {pub && <em>税率 {pub.taxRate}%</em>}
          </div>
          <dl className="product-facts">
            <div>
              <dt>服务地区</dt>
              <dd>{pub?.serviceAreaLabel || "与商家确认"}</dd>
            </div>
            <div>
              <dt>交付周期</dt>
              <dd>
                {version ? `${version.deliveryCycleDays} 天` : service.delivery}
                <span>按确认的范围与材料齐备时间安排</span>
              </dd>
            </div>
          </dl>
          {!!pub?.versions.length && (
            <div className="product-specs">
              <span>服务规格</span>
              <div>
                {pub.versions.map((v) => (
                  <button
                    aria-pressed={v.id === versionId}
                    key={v.id}
                    onClick={() => setVersionId(v.id)}
                  >
                    <strong>{v.name}</strong>
                    <small>
                      ¥ {money(v.price)} / {v.unit}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          )}
          {version &&
            (version.sellingPoints || version.highlights.length > 0) && (
              <p className="product-version-hint">
                {version.sellingPoints || version.highlights.join(" · ")}
              </p>
            )}
          <div className="product-quantity">
            <span>购买数量</span>
            <div>
              <button
                aria-label="减少数量"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
              >
                <Minus size={14} />
              </button>
              <input
                aria-label="服务数量"
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(99, Math.floor(Number(e.target.value)) || 1),
                    ),
                  )
                }
              />
              <button
                aria-label="增加数量"
                disabled={quantity >= 99}
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
            <small>{version?.unit || "项"}</small>
            {version && quantity > 1 && (
              <strong>参考合计 ¥ {money(version.price * quantity)}</strong>
            )}
          </div>
          <div className="product-actions">
            <Link className="button primary" to={orderUrl}>
              <ShoppingCart size={17} />
              立即购买
            </Link>
            <button
              className="button secondary"
              onClick={() => setContact(true)}
            >
              咨询商家
            </button>
          </div>
          <p className="product-transaction-note">
            提交需求后沟通确认，当前步骤不产生付款。
          </p>
        </div>
      </section>
      <div className="product-detail-layout">
        <div className="product-detail-main">
          <nav className="product-detail-tabs" data-list-sticky aria-label="服务详情目录">
            {[
              ["service-content", "服务介绍"],
              ["delivery-process", "规格与交付"],
              ["service-cases", "服务案例"],
              ["service-reviews", "用户评价"],
              ["service-shop", "店铺介绍"],
              ["service-faq", "常见问题"],
            ].map(([id, name]) => (
              <a key={id} href={`#${id}`} className={activeSection === id ? "is-active" : ""} aria-current={activeSection === id ? "location" : undefined}>
                {name}
              </a>
            ))}
          </nav>
          <section id="service-content" className="product-detail-section">
            <div className="section-kicker">SERVICE</div>
            <h2>服务介绍</h2>
            <p className="preserve-lines">
              {pub?.detailContent || service.overview}
            </p>
            <div className="service-feature-list">
              {(version?.highlights || service.features).map((f, i) => (
                <div key={f}>
                  <span>0{i + 1}</span>
                  <strong>{f}</strong>
                </div>
              ))}
            </div>
            {pub?.detailImages.filter(m => m.url).map((m) => (
              <ContentImage
                key={m.id}
                className="detail-content-image"
                src={m.url}
                alt={m.name}
              />
            ))}
            {pub?.detailGuarantee && (
              <div className="delivery-guarantee">
                <h3>服务保障</h3>
                <p className="preserve-lines">{pub.detailGuarantee}</p>
              </div>
            )}
          </section>
          <section id="delivery-process" className="product-detail-section">
            <div className="section-title-row">
              <h2>规格与交付</h2>
              <span>{version?.name || "服务安排"}</span>
            </div>
            {version ? (
              <>
                <div className="delivery-overview">
                  <div>
                    <span>履约方式</span>
                    <strong>
                      {version.fulfillmentType === "once_pay_once_accept"
                        ? "一次支付 · 一次验收"
                        : "分期支付 · 分期验收"}
                    </strong>
                  </div>
                  <div>
                    <span>启动安排</span>
                    <strong>
                      付款后 {version.startAfterPayDays}{" "}
                      {version.startDayType === "工作日" ||
                      version.startDayType === "workday" ||
                      version.startDayType === "work"
                        ? "个工作日"
                        : "天"}
                      内
                    </strong>
                  </div>
                  <div>
                    <span>交付周期</span>
                    <strong>{version.deliveryCycleDays} 天</strong>
                  </div>
                </div>
                <p className="preserve-lines">{version.deliveryStandard}</p>
                {version.phases.length > 0 && (
                  <div className="table-scroll">
                    <table className="commerce-table">
                      <thead>
                        <tr>
                          <th>交付阶段</th>
                          <th>结算比例</th>
                          <th>参考金额</th>
                          <th>周期与验收标准</th>
                        </tr>
                      </thead>
                      <tbody>
                        {version.phases.map((p) => (
                          <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>{p.settleRatio}%</td>
                            <td>
                              ¥{" "}
                              {money(
                                (version.price * quantity * p.settleRatio) /
                                  100,
                              )}
                            </td>
                            <td>
                              {p.deliveryCycleDays} 天 · {p.deliveryStandard}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="muted">
                  付款与验收为商家发布的履约约定，具体以双方正式确认的合同为准。
                </p>
              </>
            ) : (
              <p>交付范围、周期及费用由双方沟通确认。</p>
            )}
          </section>
          <section id="service-cases" className="product-detail-section">
            <div className="section-title-row">
              <h2>服务案例</h2>
              <span>了解服务商的实践经验</span>
            </div>
            {pub?.relatedCases.length ? (
              <div className="service-case-grid">
                {pub.relatedCases.map((c) => (
                  <article key={c.id}>
                    <ContentImage src={c.coverUrl} alt={c.title} placeholderIcon={<ImageSquare size={36} weight="duotone" />} />
                    <span>{c.categoryPath}</span>
                    <h3>{c.title}</h3>
                    <p>{c.intro}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="section-empty">商家暂未发布服务案例</p>
            )}
          </section>
          <section id="service-reviews" className="product-detail-section">
            <div className="section-title-row">
              <h2>用户评价</h2>
              <div className="review-tabs">
                <button
                  aria-pressed={reviewScope === "service"}
                  onClick={() => setReviewScope("service")}
                >
                  本项服务
                </button>
                <button
                  aria-pressed={reviewScope === "shop"}
                  onClick={() => setReviewScope("shop")}
                >
                  店铺评价
                </button>
              </div>
            </div>
            {reviews.length ? (
              reviews.map((r) => (
                <article className="product-review" key={r.id}>
                  <span className="review-avatar" aria-hidden="true">
                    {(r.buyerName || "企").slice(0, 1)}
                  </span>
                  <div className="review-meta">
                    <strong>{r.buyerName}</strong>
                    <span
                      className="review-score"
                      aria-label={`${r.score.toFixed(1)} 分`}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={14}
                          weight={n <= r.score ? "fill" : "regular"}
                        />
                      ))}
                      <b>{r.score.toFixed(1)}</b>
                    </span>
                    <time>{r.createdAt.slice(0, 10)}</time>
                  </div>
                  <p>{r.content}</p>
                  <ReviewImages images={r.images} />
                  {r.tags?.length ? (
                    <div className="card-tags">
                      {r.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  ) : null}
                  {r.reply && <blockquote>商家回复：{r.reply}</blockquote>}
                </article>
              ))
            ) : (
              <p className="section-empty">
                暂无{reviewScope === "shop" ? "店铺" : "服务"}评价
              </p>
            )}
          </section>
          <section id="service-shop" className="product-detail-section">
            <h2>店铺介绍</h2>
            <div className="shop-identity">
              <span className="shop-avatar" aria-hidden="true">
                {pub?.shop.logoUrl ? (
                  <img src={asset(pub.shop.logoUrl)} alt="" />
                ) : (
                  <Buildings size={24} />
                )}
              </span>
              <h3>{pub?.shop.name || service.provider}</h3>
            </div>
            <p>{pub?.shop.intro || "商家暂未补充店铺介绍。"}</p>
            {pub && (
              <div className="shop-metrics">
                {[
                  ["综合评分", `${pub.shop.score.toFixed(1)} 分`],
                  ["半年成交", pub.shop.halfYearDeals],
                  ["服务雇主", pub.shop.employerCount],
                  ["完工率", `${pub.shop.completeRate}%`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
            {pub?.shop.introImages.filter(m => m.url).map((m) => (
              <ContentImage
                key={m.id}
                className="detail-content-image"
                src={m.url}
                alt={m.name}
              />
            ))}
            {!!pub?.shop.teamImages.some(m => m.url) && (
              <>
                <h3>服务团队</h3>
                <div className="service-case-grid">
                  {pub.shop.teamImages.filter(m => m.url).map((m) => (
                    <ContentImage key={m.id} src={m.url} alt={m.name} />
                  ))}
                </div>
              </>
            )}
          </section>
          <section id="service-faq" className="product-detail-section">
            <h2>常见问题</h2>
            {(pub?.faqs.length
              ? pub.faqs
              : [
                  {
                    id: "payment",
                    question: "提交需求后需要立即付款吗？",
                    answer:
                      "当前提交不产生付款，后续范围、价格与履约安排由双方正式确认。",
                  },
                ]
            ).map((f) => (
              <details className="faq" key={f.id}>
                <summary>
                  {f.question}
                  <span>+</span>
                </summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </section>
        </div>
        <aside className="product-detail-aside">
          <div className="merchant-card">
            <span className="section-kicker">服务商</span>
            <h3>{service.provider}</h3>
            <p>{pub?.shop.intro || service.category}</p>
            <button
              className="button secondary full-width"
              onClick={() => setContact(true)}
            >
              联系服务商
            </button>
          </div>
          <div className="merchant-card">
            <h3>同店服务</h3>
            {related.length ? (
              related.map((s) => (
                <Link
                  className="related-service"
                  to={`/services/${s.id}`}
                  key={s.id}
                >
                  <ContentImage src={s.image} alt={s.name} />
                  <div>
                    <strong>{s.name}</strong>
                    <span>
                      {s.price === "按项报价" ? "按需报价" : `¥ ${s.price.replace(/,/g, "")}`}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="muted">暂无其他在售服务</p>
            )}
            <Link className="text-link" to="/services/hall">
              探索更多服务 <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
      <Modal
        open={contact}
        onOpenChange={setContact}
        title="联系服务商"
        description={service.provider}
      >
        <div className="contact-merchant">
          <p>说明您的业务背景、服务范围与预期时间，便于商家准备方案。</p>
          {pub?.shop.phone ? (
            <a
              className="merchant-phone"
              href={`tel:${pub.shop.phone.replace(/[^\d+\-]/g, "")}`}
            >
              {pub.shop.phone}
            </a>
          ) : (
            <p className="muted">商家暂未公开电话，请通过服务需求联系。</p>
          )}
          <Link className="button primary" to={orderUrl}>
            提交服务需求 <ArrowRight size={16} />
          </Link>
        </div>
      </Modal>
    </div>
  );
}
