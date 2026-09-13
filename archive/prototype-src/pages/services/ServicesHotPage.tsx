import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ServicesSidePanel } from "../../components/EmployerSideNav";
import { ServiceCard } from "../../components/ServiceCard";
import {
  getHotServices,
  serviceValueProps,
} from "../../data/enterpriseServices";
import { getHotDemands } from "../../data/demands";
import { useRequireLogin } from "../../hooks/useRequireLogin";

type ModalKind = "demand" | "toast" | null;

export function ServicesHotPage() {
  const requireLogin = useRequireLogin();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [toast, setToast] = useState("");
  const [bannerIdx, setBannerIdx] = useState(0);

  const hotServices = useMemo(() => getHotServices(8), []);
  const hotDemands = useMemo(() => getHotDemands(8), []);

  const banners = [
    {
      kicker: "商标转让服务正式上线",
      title: "签约当日授权经营",
      cta: "进入国内商标交易",
      tone: "b1",
    },
    {
      kicker: "园区企服严选",
      title: "160+ 细分服务 · 里程碑交付",
      cta: "发布我的需求",
      tone: "b2",
    },
  ];

  const showToast = (msg: string) => {
    setToast(msg);
    setModal("toast");
    window.setTimeout(() => {
      setModal((m) => (m === "toast" ? null : m));
      setToast("");
    }, 2000);
  };

  const submitSearch = () => {
    const q = query.trim();
    navigate(q ? `/services/hall?q=${encodeURIComponent(q)}` : "/services/hall");
  };

  return (
    <div className="svc-page svc-page--hot">
      <div className="container svc-layout">
        <ServicesSidePanel />

        <div className="svc-main">
          <div className="svc-search-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索服务名称、简介、概述…"
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={submitSearch}>
              搜索
            </button>
          </div>

          <div className="svc-banner">
            <div className={`svc-banner-slide tone-${banners[bannerIdx].tone}`}>
              <div className="svc-banner-kicker">{banners[bannerIdx].kicker}</div>
              <h2>{banners[bannerIdx].title}</h2>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  bannerIdx === 1
                    ? requireLogin(() => setModal("demand"))
                    : requireLogin(() => showToast("进入商标交易（演示）"))
                }
              >
                {banners[bannerIdx].cta}
              </button>
            </div>
            <div className="svc-banner-dots">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={i === bannerIdx ? "on" : ""}
                  onClick={() => setBannerIdx(i)}
                />
              ))}
            </div>
          </div>

          <div className="svc-value-row">
            {serviceValueProps.map((v, i) => (
              <div key={v.title} className={`svc-value-chip tone-${i + 1}`}>
                <span className="svc-value-mark" aria-hidden />
                <strong>{v.title}</strong>
                <span>{v.desc}</span>
              </div>
            ))}
          </div>

          <section className="svc-hot-section">
            <div className="svc-hot-head">
              <div>
                <h2>热门服务</h2>
                <p>严选高评分、高履约服务，快速匹配经营所需</p>
              </div>
              <Link to="/services/hall" className="link-more">
                查看更多 →
              </Link>
            </div>
            <div className="svc-grid svc-grid--hot">
              {hotServices.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </section>

          <section className="svc-hot-section svc-hot-section--demand">
            <div className="svc-hot-head">
              <div>
                <h2>热门需求</h2>
                <p>高活跃招标需求，服务商可快速报价接单</p>
              </div>
              <Link to="/demand" className="link-more">
                查看更多 →
              </Link>
            </div>
            <div className="svc-demand-list svc-demand-list--hot">
              {hotDemands.map((d) => (
                <article key={d.id} className="svc-demand-item">
                  <div>
                    <span className="chip">{d.tags[0]}</span>
                    <h4>{d.title}</h4>
                    <p>
                      {d.company} · {d.budgetLabel} · {d.quotes} 家报价 · {d.publishedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => requireLogin(() => showToast("已提交抢单（演示）"))}
                  >
                    立即抢单
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      {modal === "demand" && (
        <div className="svc-modal-backdrop" onClick={() => setModal(null)}>
          <div className="svc-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>发布需求</h3>
              <button type="button" className="svc-modal-close" onClick={() => setModal(null)}>
                ×
              </button>
            </header>
            <form
              className="svc-form"
              onSubmit={(e) => {
                e.preventDefault();
                setModal(null);
                showToast("需求已发布至需求大厅");
              }}
            >
              <label>
                <span>需求标题</span>
                <input required placeholder="简要描述您需要什么服务" />
              </label>
              <label>
                <span>预算范围</span>
                <input placeholder="如 5,000–10,000 元" />
              </label>
              <label>
                <span>详细要求</span>
                <textarea required rows={4} placeholder="交付周期、服务地区、资质要求等" />
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost-dark" onClick={() => setModal(null)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  发布需求
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "toast" && toast && <div className="svc-toast">{toast}</div>}
    </div>
  );
}
