import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IconBank,
  IconBrief,
  IconCart,
  IconMap,
  IconMegaphone,
  IconNews,
  IconSpark,
} from "../components/Icons";
import { platformName } from "../data";
import { useAuth } from "../context/AuthContext";
import { useLoginModal } from "../context/LoginModalContext";

type ServiceCard = {
  id: string;
  title: string;
  brand: string;
  desc: string;
  tone: string;
  to?: string;
  action?: "ai";
  icon: typeof IconNews;
};

const serviceCards: ServiceCard[] = [
  {
    id: "news",
    title: "产业资讯",
    brand: "产业政策",
    desc: "聚焦经开区政策解读、行业动态与产业宏观数据",
    tone: "blue",
    to: "/news",
    icon: IconNews,
  },
  {
    id: "demand",
    title: "智慧物流",
    brand: "万连通",
    desc: "网络货运平台，一键发运，智能调度，透明结算",
    tone: "indigo",
    to: "/logistics",
    icon: IconMegaphone,
  },
  {
    id: "ai",
    title: "AI赋能",
    brand: "AI智能体",
    desc: "企业数字化转型引擎，提供大模型定制与智能化方案",
    tone: "purple",
    to: "/ai",
    icon: IconSpark,
  },
  {
    id: "finance",
    title: "数智金融",
    brand: "科创助贷",
    desc: "基于大数据的供应链金融，解决企业融资难融资贵",
    tone: "emerald",
    to: "/finance",
    icon: IconBank,
  },
  {
    id: "proc",
    title: "商品交易",
    brand: "大宗物资",
    desc: "大宗商品集采与交易平台，实时价格，安全撮合",
    tone: "orange",
    to: "/procurement",
    icon: IconCart,
  },
  {
    id: "svc",
    title: "企业服务",
    brand: "万大圣",
    desc: "工商财税、知识产权、政策申报一站式管家服务",
    tone: "cyan",
    to: "/services",
    icon: IconBrief,
  },
];

const vouchers = [
  {
    id: "v1",
    amount: "500",
    unit: "元",
    title: "物流专项抵扣券",
    scope: "发货运费抵扣",
    tone: "red",
    claimed: true,
  },
  {
    id: "v2",
    amount: "5,000",
    unit: "元",
    title: "数字化转型补贴券",
    scope: "AI定制服务",
    tone: "orange",
    claimed: false,
  },
  {
    id: "v3",
    amount: "1",
    unit: "%",
    title: "融资贴息专项券",
    scope: "供应链贷款使用",
    tone: "gold",
    claimed: false,
  },
];

const demoEnterprise = {
  name: "x'x经开国控资产运营管理有限公司",
  scale: "微型企业",
  chain: "资本服务链",
  address: "x'x市经济开发区东环路196号东方国际商务中心",
  capital: "100000万人民币",
  type: "有限责任公司",
  industry: "租赁和商务服务业",
  supply: "国有资产运营、产业办公园区租赁",
  demand: "寻找优质项目进行投资或资产盘活合作",
};

const marketQuotes = [
  { name: "HRB400E 螺纹钢", price: "3,850", trend: "+20", up: true },
  { name: "Q235B 热轧卷板", price: "3,920", trend: "-10", up: false },
  { name: "炼焦煤 (主焦煤)", price: "2,150", trend: "持平", up: null },
  { name: "电解铜", price: "68,400", trend: "+350", up: true },
];

const dashStats = [
  { title: "入驻企业总数", amount: "1,286", unit: "家", tone: "blue" },
  { title: "累计撮合交易额", amount: "45.2", unit: "亿元", tone: "indigo" },
  { title: "本月物流运单", amount: "8,450", unit: "单", tone: "emerald" },
  { title: "发放融资金额", amount: "2.1", unit: "亿元", tone: "purple" },
];

const partners = [
  { mark: "服务商", label: "本地服务商" },
  { mark: "金融", label: "金融机构" },
  { mark: "科研", label: "科研院所" },
  { mark: "物流", label: "物流企业" },
  { mark: "科技", label: "科技公司" },
];

const mapTabs = [
  { key: "enterprise" as const, label: "企业地图" },
  { key: "industry" as const, label: "产业地图" },
  { key: "supply" as const, label: "供需地图" },
];

const MARKET_BRIEF =
  "今日钢材分化：螺纹钢偏强、热卷小幅回落；焦煤持稳、电解铜延续上行。建议园区制造企业关注螺纹与铜价波动，适时锁定原材料采购窗口；物流与贸易企业可优先布局高周转钢材品类。";

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useLoginModal();
  const [aiQuery, setAiQuery] = useState("");
  const [claimed, setClaimed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(vouchers.map((v) => [v.id, v.claimed])),
  );
  const [mapTab, setMapTab] = useState<"enterprise" | "industry" | "supply">("supply");
  const [marketBrief, setMarketBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);

  const openAi = (prompt?: string) => {
    window.dispatchEvent(
      new CustomEvent("portal-open-ai", { detail: { prompt: (prompt ?? aiQuery).trim() } }),
    );
  };

  const onAiSearch = (e: FormEvent) => {
    e.preventDefault();
    openAi(aiQuery || "我想查询今日钢材价格");
  };

  const claimVoucher = (id: string) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setClaimed((prev) => ({ ...prev, [id]: true }));
  };

  const onServiceClick = (card: ServiceCard) => {
    if (card.action === "ai") {
      openAi();
      return;
    }
    if (card.to) navigate(card.to);
  };

  const generateBrief = () => {
    if (briefLoading) return;
    setBriefLoading(true);
    window.setTimeout(() => {
      setMarketBrief(MARKET_BRIEF);
      setBriefLoading(false);
    }, 600);
  };

  return (
    <div className="portal-home">
      <section className="portal-hero">
        <div className="portal-hero-bg" aria-hidden />
        <div className="portal-hero-watermark" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i}>{platformName}</span>
          ))}
        </div>
        <div className="portal-hero-lines" aria-hidden>
          <span />
          <span />
          <span />
          <i className="node n1" />
          <i className="node n2" />
          <i className="node n3" />
          <i className="node n4" />
        </div>
        <div className="portal-hero-inner">
          <div className="portal-hero-badge">
            <span className="portal-hero-badge-icon" aria-hidden>
              ◎
            </span>
            政府引导 · 平台运营 · 生态共建 · 数据赋能
          </div>
          <h1>{platformName}</h1>
          <p>AI赋能 · 企业全生命周期 · 全要素服务</p>
          <form className="portal-hero-search" onSubmit={onAiSearch}>
            <IconSpark width={18} height={18} />
            <input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="您需要什么服务？试试问：我想查询今日钢材价格..."
              aria-label="AI 智能搜索"
            />
            <button type="submit">
              <IconSpark width={14} height={14} />
              AI 帮我找 &gt;
            </button>
          </form>
        </div>
      </section>

      <section className="portal-voucher-wrap">
        <div className="portal-container">
          <div className="portal-voucher-panel">
            <div className="portal-voucher-intro">
              <span className="portal-voucher-badge">经开区政府专项补贴</span>
              <h2>2026 中小企业服务券</h2>
              <p>政策引领，企业享惠。领取后可在{platformName}直接抵扣现金。</p>
            </div>
            <div className="portal-voucher-grid">
              {vouchers.map((v) => {
                const taken = claimed[v.id];
                return (
                  <div key={v.id} className={`portal-coupon tone-${v.tone}`}>
                    <div className="portal-coupon-head">
                      <div className="portal-coupon-amount">
                        <b>{v.amount}</b>
                        <span>{v.unit}</span>
                      </div>
                      <div className="portal-coupon-title">{v.title}</div>
                    </div>
                    <div className="portal-coupon-body">
                      <p>{v.scope}</p>
                      <button
                        type="button"
                        className={taken ? "is-claimed" : ""}
                        disabled={taken}
                        onClick={() => claimVoucher(v.id)}
                      >
                        {taken ? "✓ 已领取至卡包" : "🎫 立即领取"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="portal-section portal-map-section" id="digital-map">
        <div className="portal-container">
          <div className="portal-map-head">
            <div>
              <span className="portal-kicker">
                <IconMap width={14} height={14} />
                经开区数字孪生看板
              </span>
              <h2>产业全景地图</h2>
              <p>已接入经开区企信数据。一屏统管企业分布，一键探测本地合作商机</p>
            </div>
            <div className="portal-map-tabs">
              {mapTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={mapTab === tab.key ? "is-active" : ""}
                  onClick={() => setMapTab(tab.key)}
                >
                  <IconMap width={15} height={15} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="portal-map-split">
            <div className="portal-map-canvas is-dark">
              <div className="portal-map-legend">
                <strong>图例说明 (基于真实工商数据)</strong>
                {mapTab === "enterprise" && (
                  <>
                    <span><i className="dot d1" />大型企业</span>
                    <span><i className="dot d2" />中型企业</span>
                    <span><i className="dot d3" />小型/微型企业</span>
                  </>
                )}
                {mapTab === "industry" && (
                  <>
                    <span><i className="dot d1" />新能源与家电</span>
                    <span><i className="dot d4" />基建与装备制造</span>
                    <span><i className="dot d5" />交通物流与国资</span>
                  </>
                )}
                {mapTab === "supply" && (
                  <>
                    <span><i className="dot d6" />有优势供给/资产</span>
                    <span><i className="dot d7" />有服务/采购需求</span>
                  </>
                )}
              </div>
              <div className="portal-map-grid" aria-hidden />
              <div className="portal-map-nodes" aria-hidden>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <span
                    key={i}
                    className={i % 2 === 0 ? "supply" : "demand"}
                    style={{ ["--i" as string]: i }}
                  />
                ))}
              </div>
            </div>

            <aside className="portal-ent-panel">
              <div className="portal-ent-head">
                <span className="portal-ent-icon" aria-hidden>
                  企
                </span>
                <div>
                  <h3>{demoEnterprise.name}</h3>
                  <div className="portal-ent-tags">
                    <span>{demoEnterprise.scale}</span>
                    <em>{demoEnterprise.chain}</em>
                  </div>
                </div>
              </div>

              <ul className="portal-ent-meta">
                <li>
                  <span>注册地址</span>
                  <b>{demoEnterprise.address}</b>
                </li>
                <li>
                  <span>注册资本</span>
                  <b>{demoEnterprise.capital}</b>
                </li>
                <li>
                  <span>企业类型</span>
                  <b>{demoEnterprise.type}</b>
                </li>
                <li>
                  <span>行业门类</span>
                  <b>{demoEnterprise.industry}</b>
                </li>
              </ul>

              <div className="portal-ent-insight is-supply">
                <strong>✨ 企业公开供给侧能力</strong>
                <p>{demoEnterprise.supply}</p>
              </div>
              <div className="portal-ent-insight is-demand">
                <strong>🔍 平台捕捉的迫切需求</strong>
                <p>{demoEnterprise.demand}</p>
              </div>

              <Link to="/map" className="portal-ent-cta">
                ✨ AI 业务速配
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="portal-section" id="services">
        <div className="portal-container">
          <div className="portal-section-head center">
            <div>
              <h2>核心服务矩阵</h2>
              <p>依托万联易达集团生态，打造全链路产业赋能体系</p>
            </div>
          </div>
          <div className="portal-service-grid">
            {serviceCards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`portal-service-card tone-${card.tone}`}
                onClick={() => onServiceClick(card)}
              >
                <span className="portal-service-icon">
                  <card.icon width={28} height={28} />
                </span>
                <div className="portal-service-title-row">
                  <h3>{card.title}</h3>
                  <span className="portal-service-brand">{card.brand}</span>
                </div>
                <p>{card.desc}</p>
                <span className="portal-service-enter">进入服务 →</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="portal-section portal-market-section" id="market">
        <div className="portal-container portal-market-layout">
          <div className="portal-market-card">
            <div className="portal-market-head">
              <h3>
                <span className="portal-trend-icon" aria-hidden>
                  ↗
                </span>
                大宗商品行情趋势 (万贸达)
              </h3>
              <button
                type="button"
                className="portal-ai-brief"
                disabled={briefLoading}
                onClick={generateBrief}
              >
                <IconSpark width={14} height={14} />
                {briefLoading ? "正在生成..." : "✨ AI 行情简报"}
              </button>
            </div>
            <div className="portal-quote-list">
              {marketQuotes.map((q) => (
                <div key={q.name} className="portal-quote-row">
                  <span className="name">{q.name}</span>
                  <div className="vals">
                    <b>¥{q.price}</b>
                    <em className={q.up === true ? "up" : q.up === false ? "down" : ""}>
                      {q.trend}
                    </em>
                  </div>
                </div>
              ))}
            </div>
            {marketBrief && (
              <div className="portal-market-brief">
                <strong>
                  <IconSpark width={14} height={14} /> AI 行情解读
                </strong>
                <p>{marketBrief}</p>
              </div>
            )}
          </div>

          <div className="portal-dash-card">
            <div className="portal-market-head">
              <h3>
                <span className="portal-shield-icon" aria-hidden>
                  ✓
                </span>
                经开区数据赋能看板
              </h3>
            </div>
            <div className="portal-dash-grid">
              {dashStats.map((s) => (
                <div key={s.title} className={`portal-dash-tile tone-${s.tone}`}>
                  <span>{s.title}</span>
                  <b>
                    {s.amount} <em>{s.unit}</em>
                  </b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="portal-ecosystem" id="ecosystem">
        <div className="portal-container">
          <h3>N个生态伙伴 共建产业繁荣</h3>
          <div className="portal-partners">
            {partners.map((p) => (
              <div key={p.label} className="portal-partner">
                <span>{p.mark}</span>
                <em>{p.label}</em>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
