import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { publicUrl } from "../../utils/publicUrl";
import { useRequireLogin } from "../../hooks/useRequireLogin";
import {
  FULFILLMENT_LABEL,
  formatMoney,
  getPublishedService,
  getServiceReviewGroups,
  type PublishedMedia,
  type PublishedReview,
  type PublishedVersion,
} from "../../data/publishedServices";

const GALLERY_AUTO_MS = 4000;

type AnchorId = "detail" | "cases" | "reviews" | "shop";
type ReviewSubTab = "service" | "shop";

const ANCHORS: { id: AnchorId; label: string }[] = [
  { id: "detail", label: "服务详情" },
  { id: "cases", label: "成功案例" },
  { id: "reviews", label: "客户评价" },
  { id: "shop", label: "关于商家" },
];

const PARK_SLOGANS = [
  "园区严选服务商，资质与履约双重把关",
  "里程碑付款 · 节点验收 · 进度可查",
  "一站式对接，省心交付更可控",
];

function deliveryCycleDays(v: PublishedVersion): number {
  if (v.fulfillmentType === "installment_pay_installment_accept" && v.phases.length) {
    return v.phases.reduce((sum, p) => sum + p.deliveryCycleDays, 0);
  }
  return v.deliveryCycleDays;
}

function deliveryHint(v: PublishedVersion): { primary: string; secondary: string } {
  const days = deliveryCycleDays(v);
  const dayUnit = v.startDayType === "工作日" ? "个工作日" : "天";
  const primary = `${days}${dayUnit}交付`;

  const start =
    v.startAfterPayDays > 0
      ? `付款后 ${v.startAfterPayDays}${v.startDayType === "工作日" ? "个工作日" : "天"}内启动`
      : "付款后即启动";

  const eta = new Date();
  const add =
    v.startDayType === "工作日" ? Math.ceil(days * 1.4) + v.startAfterPayDays : days + v.startAfterPayDays;
  eta.setDate(eta.getDate() + add);
  const etaText = `${eta.getMonth() + 1}月${eta.getDate()}日`;

  if (v.fulfillmentType === "installment_pay_installment_accept" && v.phases.length) {
    const phaseHint = v.phases.map((p) => `${p.name}${p.deliveryCycleDays}天`).join(" + ");
    return {
      primary,
      secondary: `${start} · 分期 ${phaseHint} · 预计 ${etaText} 前完成`,
    };
  }

  return {
    primary,
    secondary: `${start} · 预计 ${etaText} 前可交付`,
  };
}

function scrollToAnchor(id: AnchorId) {
  const el = document.getElementById(`svd-sec-${id}`);
  if (!el) return;
  const topbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar")) || 64;
  const nav = document.querySelector(".svd-anchor-nav") as HTMLElement | null;
  const offset = topbar + (nav?.offsetHeight ?? 48) + 8;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}

export function ServiceDetailPage() {
  const { serviceId = "" } = useParams();
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();
  const service = getPublishedService(serviceId);

  const [versionId, setVersionId] = useState<string | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [galleryHover, setGalleryHover] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<AnchorId>("detail");
  const [reviewSub, setReviewSub] = useState<ReviewSubTab>("service");
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [preview, setPreview] = useState<PublishedMedia | null>(null);
  const [qty, setQty] = useState(1);
  const galleryVideoRef = useRef<HTMLVideoElement | null>(null);

  const selected = useMemo(() => {
    if (!service) return null;
    return service.versions.find((v) => v.id === versionId) ?? service.versions[0] ?? null;
  }, [service, versionId]);

  const gallery = useMemo(() => {
    if (!service) return [] as PublishedMedia[];
    const list: PublishedMedia[] = [];
    if (service.coverUrl) {
      list.push({ id: `${service.id}-main-cover`, name: "封面", kind: "image", url: service.coverUrl });
    }
    for (const m of service.media) list.push(m);
    const seen = new Set<string>();
    return list.filter((m) => {
      const key = m.url || m.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [service]);

  useEffect(() => {
    if (!service) return;
    const sections = ANCHORS.map((a) => document.getElementById(`svd-sec-${a.id}`)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top?.target?.id) return;
        const id = top.target.id.replace("svd-sec-", "") as AnchorId;
        if (ANCHORS.some((a) => a.id === id)) setActiveAnchor(id);
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [service]);

  useEffect(() => {
    setMediaIndex(0);
  }, [serviceId]);

  const activeMedia = gallery[Math.min(mediaIndex, Math.max(gallery.length - 1, 0))] ?? null;
  const isActiveVideo = activeMedia?.kind === "video";

  useEffect(() => {
    if (gallery.length <= 1 || galleryHover || isActiveVideo) return;
    const timer = window.setInterval(() => {
      setMediaIndex((i) => (i + 1) % gallery.length);
    }, GALLERY_AUTO_MS);
    return () => window.clearInterval(timer);
  }, [gallery.length, galleryHover, isActiveVideo, mediaIndex]);

  useEffect(() => {
    if (!isActiveVideo) return;
    const el = galleryVideoRef.current;
    if (!el) return;
    el.currentTime = 0;
    const play = el.play();
    if (play && typeof play.catch === "function") play.catch(() => undefined);
  }, [isActiveVideo, mediaIndex, activeMedia?.url]);

  if (!service) {
    return <Navigate to="/services" replace />;
  }
  const { serviceReviews, shopReviews } = getServiceReviewGroups(service);
  const multiVersion = service.versions.length > 1;
  const deliver = selected ? deliveryHint(selected) : null;
  const highlightText = selected?.sellingPoints?.replace(/\s*\n+\s*/g, " ").trim() || "";

  const buyNow = () => {
    if (!selected) return;
    requireLogin(() => {
      const q = new URLSearchParams({
        v: selected.id,
        qty: String(Math.max(1, qty)),
      });
      navigate(`/services/${service.id}/order?${q.toString()}`);
    });
  };

  const changeQty = (delta: number) => {
    setQty((n) => Math.min(999, Math.max(1, n + delta)));
  };

  return (
    <div className="svd-page">
      <div className="container svd-body">
        <div className="svd-crumb-row">
          <nav className="svd-crumb">
            <Link to="/">首页</Link>
            <span>/</span>
            <Link to="/services">企业服务</Link>
            <span>/</span>
            <span>{service.categoryL1}</span>
            <span>/</span>
            <em>{service.name}</em>
          </nav>
          <button type="button" className="btn btn-ghost-dark btn-sm" onClick={() => navigate("/services")}>
            返回列表
          </button>
        </div>

        <header className="svd-title-row">
          <h1>{service.name}</h1>
          <div className="svd-sales">
            <span>近半年销量 {service.salesCount}</span>
            <span>综合评分 {service.rating.toFixed(1)}</span>
          </div>
        </header>

        <div className="svd-layout">
          <div className="svd-main-col">
            <section className="svd-gallery">
              <div
                className="svd-gallery-main"
                onMouseEnter={() => {
                  setGalleryHover(true);
                  galleryVideoRef.current?.pause();
                }}
                onMouseLeave={() => {
                  setGalleryHover(false);
                  if (isActiveVideo) void galleryVideoRef.current?.play().catch(() => undefined);
                }}
              >
                {activeMedia?.url && activeMedia.kind === "video" ? (
                  <video
                    key={activeMedia.id}
                    ref={galleryVideoRef}
                    className="svd-gallery-video"
                    src={publicUrl(activeMedia.url)}
                    muted
                    playsInline
                    autoPlay
                    controls={false}
                    onEnded={() => {
                      if (gallery.length > 1) setMediaIndex((i) => (i + 1) % gallery.length);
                      else if (galleryVideoRef.current) {
                        galleryVideoRef.current.currentTime = 0;
                        void galleryVideoRef.current.play().catch(() => undefined);
                      }
                    }}
                    onClick={() => setPreview(activeMedia)}
                  />
                ) : activeMedia?.url ? (
                  <img
                    src={publicUrl(activeMedia.url)}
                    alt={activeMedia.name}
                    onClick={() => setPreview(activeMedia)}
                  />
                ) : (
                  <div className="svd-gallery-empty">{service.categoryL1.slice(0, 2)}</div>
                )}
                {activeMedia?.kind === "video" && <span className="svd-gallery-badge">视频</span>}
              </div>
              {gallery.length > 1 && (
                <div className="svd-thumbs" role="listbox" aria-label="服务素材">
                  {gallery.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      role="option"
                      aria-selected={i === mediaIndex}
                      className={`svd-thumb${i === mediaIndex ? " is-active" : ""}`}
                      onClick={() => setMediaIndex(i)}
                    >
                      {m.kind === "video" ? (
                        <span className="svd-thumb-video">
                          <em>▶</em>
                        </span>
                      ) : m.url ? (
                        <img src={publicUrl(m.url)} alt={m.name} />
                      ) : (
                        <span>{m.name}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="svd-tabs-panel">
              <nav className="svd-anchor-nav" aria-label="详情导航">
                {ANCHORS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={activeAnchor === id ? "is-active" : undefined}
                    onClick={() => {
                      setActiveAnchor(id);
                      scrollToAnchor(id);
                    }}
                  >
                    {label}
                    {id === "cases" && service.relatedCases.length > 0 && (
                      <em>{service.relatedCases.length}</em>
                    )}
                    {id === "reviews" && <em>{serviceReviews.length + shopReviews.length}</em>}
                  </button>
                ))}
              </nav>

              <div className="svd-anchor-stack">
                <div className="svd-section" id="svd-sec-detail">
                  <h2>
                    <i />
                    服务详情
                  </h2>
                  <div className="svd-block">
                    <h3>服务介绍</h3>
                    <pre className="svd-pre">{service.detailContent}</pre>
                  </div>
                  <div className="svd-block">
                    <h3>服务保障说明</h3>
                    <pre className="svd-pre">{service.detailGuarantee}</pre>
                  </div>
                  {service.detailImages.length > 0 && (
                    <div className="svd-block">
                      <div className="svd-detail-images">
                        {service.detailImages.map((m) => (
                          <button key={m.id} type="button" onClick={() => setPreview(m)}>
                            {m.url ? (
                              <img src={publicUrl(m.url)} alt={m.name} />
                            ) : (
                              <span>{m.name}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="svd-block">
                    <h3>常见问题</h3>
                    {service.faqs.length ? (
                      <ul className="svd-faq">
                        {service.faqs.map((f) => (
                          <li key={f.id}>
                            <strong>Q：{f.question}</strong>
                            <p>A：{f.answer}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="svd-empty">暂无常见问题</p>
                    )}
                  </div>
                </div>

                <div className="svd-section" id="svd-sec-cases">
                  <h2>
                    <i />
                    成功案例
                  </h2>
                  {service.relatedCases.length ? (
                    <div className="svd-case-stack">
                      {service.relatedCases.map((c) => (
                        <article key={c.id} className="svd-case-hero">
                          {c.coverUrl ? (
                            <img src={publicUrl(c.coverUrl)} alt="" />
                          ) : (
                            <div className="svd-case-hero-empty" />
                          )}
                          <div className="svd-case-overlay">
                            <strong>{c.title}</strong>
                            <p>{c.intro}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="svd-empty">暂无成功案例</p>
                  )}
                </div>

                <div className="svd-section" id="svd-sec-reviews">
                  <h2>
                    <i />
                    客户评价
                  </h2>
                  <div className="svd-score-board">
                    <div className="svd-score-num">{service.rating.toFixed(1)}</div>
                    <div>
                      <div className="svd-stars" aria-hidden>
                        {"★★★★★".slice(0, Math.round(service.rating))}
                        <span>{"★★★★★".slice(Math.round(service.rating))}</span>
                      </div>
                      <p>服务综合评分 · 近半年销量 {service.salesCount}</p>
                    </div>
                  </div>

                  <div className="svd-subtabs" role="tablist">
                    <button
                      type="button"
                      className={reviewSub === "service" ? "is-active" : undefined}
                      onClick={() => setReviewSub("service")}
                    >
                      本服务评价（{serviceReviews.length}）
                    </button>
                    <button
                      type="button"
                      className={reviewSub === "shop" ? "is-active" : undefined}
                      onClick={() => setReviewSub("shop")}
                    >
                      本店铺评价（{shopReviews.length}）
                    </button>
                  </div>
                  <ReviewList
                    items={reviewSub === "service" ? serviceReviews : shopReviews}
                    showServiceName={reviewSub === "shop"}
                  />
                </div>

                <div className="svd-section" id="svd-sec-shop">
                  <h2>
                    <i />
                    关于商家
                  </h2>
                  <div className="svd-shop-card">
                    <div className="svd-shop-head">
                      <div className="svd-shop-logo">
                        {service.shop.logoUrl ? (
                          <img src={publicUrl(service.shop.logoUrl)} alt="" />
                        ) : (
                          <span>{service.shop.name.slice(0, 1)}</span>
                        )}
                      </div>
                      <div className="svd-shop-meta">
                        <div className="svd-shop-name">{service.shop.name}</div>
                      </div>
                      <button
                        type="button"
                        className="svd-btn-buy svd-btn-buy--sm"
                        onClick={() => setPhoneOpen(true)}
                      >
                        电话咨询
                      </button>
                    </div>

                    <div className="svd-shop-stats svd-shop-stats--3">
                      <div>
                        <strong>{service.shop.score.toFixed(1)}</strong>
                        <span>服务质量评分</span>
                      </div>
                      <div>
                        <strong>{service.shop.halfYearDeals}</strong>
                        <span>近半年成交</span>
                      </div>
                      <div>
                        <strong>{service.shop.employerCount}</strong>
                        <span>服务客户数</span>
                      </div>
                    </div>

                    <p className="svd-shop-intro">{service.shop.intro}</p>

                    {service.shop.introImages.length > 0 && (
                      <div className="svd-shop-stack-images">
                        {service.shop.introImages.map((m) => (
                          <button key={m.id} type="button" onClick={() => setPreview(m)}>
                            {m.url ? <img src={publicUrl(m.url)} alt={m.name} /> : null}
                          </button>
                        ))}
                      </div>
                    )}

                    {service.shop.teamImages.length > 0 && (
                      <div className="svd-shop-team">
                        <h3>团队风采</h3>
                        <div className="svd-shop-stack-images">
                          {service.shop.teamImages.map((m) => (
                            <button key={m.id} type="button" onClick={() => setPreview(m)}>
                              {m.url ? <img src={publicUrl(m.url)} alt={m.name} /> : null}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="svd-side-col">
            <div className="svd-buybox">
              {multiVersion ? (
                <div className="svd-spec-tabs" role="tablist" aria-label="服务规格">
                  {service.versions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      aria-selected={(selected?.id ?? "") === v.id}
                      className={`svd-spec-tab${(selected?.id ?? "") === v.id ? " is-active" : ""}`}
                      onClick={() => setVersionId(v.id)}
                    >
                      <strong>{v.name}</strong>
                      <span>{formatMoney(v.price)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                selected && (
                  <div className="svd-spec-single">
                    <strong>{selected.name}</strong>
                    <span>{formatMoney(selected.price)}</span>
                  </div>
                )
              )}

              {selected && deliver && (
                <>
                  <div className="svd-price-line">
                    <em>{formatMoney(selected.price)}</em>
                    <span>/{selected.unit}</span>
                  </div>

                  <div className="svd-deliver-bar">
                    <strong>{deliver.primary}</strong>
                    <span>{deliver.secondary}</span>
                  </div>

                  <div className="svd-highlights">
                    <div className="svd-highlights-head">服务亮点</div>
                    <p className="svd-highlight-text">{highlightText || "暂无亮点说明"}</p>
                    <div className="svd-highlight-extra">
                      <span>履约：{FULFILLMENT_LABEL[selected.fulfillmentType]}</span>
                      <span>税率 {service.taxRate}%</span>
                    </div>
                    {selected.fulfillmentType === "installment_pay_installment_accept" &&
                      selected.phases[0] && (
                        <div className="svd-installment-tip">
                          分期支付需先付首笔款（{selected.phases[0].name} {selected.phases[0].settleRatio}%）
                        </div>
                      )}
                  </div>

                  <div className="svd-qty-row">
                    <span className="svd-qty-label">购买数量</span>
                    <div className="svd-qty-stepper" role="group" aria-label="购买数量">
                      <button
                        type="button"
                        className="svd-qty-btn"
                        onClick={() => changeQty(-1)}
                        disabled={qty <= 1}
                        aria-label="减少"
                      >
                        −
                      </button>
                      <input
                        className="svd-qty-input"
                        type="number"
                        min={1}
                        max={999}
                        value={qty}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isFinite(n)) return;
                          setQty(Math.min(999, Math.max(1, Math.floor(n))));
                        }}
                        aria-label="数量"
                      />
                      <button
                        type="button"
                        className="svd-qty-btn"
                        onClick={() => changeQty(1)}
                        disabled={qty >= 999}
                        aria-label="增加"
                      >
                        +
                      </button>
                      <em className="svd-qty-unit">/{selected.unit}</em>
                    </div>
                  </div>

                  <div className="svd-actions">
                    <button type="button" className="svd-btn-phone" onClick={() => setPhoneOpen(true)}>
                      电话咨询
                    </button>
                    <button type="button" className="svd-btn-buy" onClick={buyNow}>
                      立即购买
                    </button>
                  </div>

                  <div className="svd-park-pick">
                    <div className="svd-park-pick-head">
                      <strong>园区严选</strong>
                      <em>Park Select</em>
                    </div>
                    <ul className="svd-park-slogans">
                      {PARK_SLOGANS.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      {phoneOpen && (
        <div className="svd-modal-backdrop" onClick={() => setPhoneOpen(false)} role="presentation">
          <div
            className="svd-modal svd-modal--phone"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="svd-phone-title"
          >
            <button
              type="button"
              className="svd-modal-close svd-modal-close--float"
              onClick={() => setPhoneOpen(false)}
              aria-label="关闭"
            >
              ×
            </button>
            <div className="svd-phone-card">
              <div className="svd-phone-logo">
                {service.shop.logoUrl ? (
                  <img src={publicUrl(service.shop.logoUrl)} alt="" />
                ) : (
                  <span>{service.shop.name.slice(0, 1)}</span>
                )}
              </div>
              <div id="svd-phone-title" className="svd-phone-shop">
                {service.shop.name}
              </div>
              <p className="svd-phone-label">电话咨询</p>
              <a className="svd-phone-num" href={`tel:${service.shop.phone.replace(/-/g, "")}`}>
                {service.shop.phone}
              </a>
              <a className="svd-phone-call" href={`tel:${service.shop.phone.replace(/-/g, "")}`}>
                立即拨打
              </a>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="svd-modal-backdrop" onClick={() => setPreview(null)} role="presentation">
          <div className="svd-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <header>
              <h3>{preview.name}</h3>
              <button type="button" className="svd-modal-close" onClick={() => setPreview(null)}>
                ×
              </button>
            </header>
            <div className="svd-modal-body svd-modal-body--media">
              {preview.url && preview.kind === "video" ? (
                <video src={publicUrl(preview.url)} controls autoPlay muted playsInline />
              ) : preview.url ? (
                <img src={publicUrl(preview.url)} alt={preview.name} />
              ) : (
                <p>{preview.name}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewList({
  items,
  showServiceName,
}: {
  items: PublishedReview[];
  showServiceName?: boolean;
}) {
  if (!items.length) return <p className="svd-empty">暂无评价</p>;
  return (
    <ul className="svd-review-list">
      {items.map((r) => (
        <li key={r.id}>
          <div className="svd-review-head">
            <strong>{r.buyerName}</strong>
            <span className="svd-review-score">{"★".repeat(Math.round(r.score))}</span>
            <em>{r.createdAt}</em>
          </div>
          {showServiceName && r.serviceName && <div className="svd-review-svc">{r.serviceName}</div>}
          <p>{r.content}</p>
          {r.reply && <div className="svd-review-reply">商家回复：{r.reply}</div>}
        </li>
      ))}
    </ul>
  );
}
