import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IconSearch } from "../../components/Icons";
import { ProductCover } from "../../components/ProductCover";
import { products, type Product } from "../../data";
import {
  catalogProducts,
  hotSearches,
  orderTabs,
  procCategories,
  procValueProps,
} from "../../data/procurement";
import { publicUrl } from "../../utils/publicUrl";
import { useRequireLogin } from "../../hooks/useRequireLogin";

type CartLine = { product: Product; qty: number };

type ModalKind = "cart" | "rfq" | "batch" | "toast" | null;

export function ProcurementPage() {
  const requireLogin = useRequireLogin();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [toast, setToast] = useState("");
  const [orderTab, setOrderTab] = useState("contract");
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc">("default");

  const catalog = useMemo(() => [...products, ...catalogProducts], []);

  const filtered = useMemo(() => {
    let list = catalog;
    if (category !== "all") {
      list = list.filter((p) => p.categoryId === category);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.spec.toLowerCase().includes(q) ||
          p.supplier.toLowerCase().includes(q),
      );
    }
    if (sort === "price-asc" || sort === "price-desc") {
      list = [...list].sort((a, b) => {
        const pa = Number(a.price.replace(/,/g, ""));
        const pb = Number(b.price.replace(/,/g, ""));
        return sort === "price-asc" ? pa - pb : pb - pa;
      });
    }
    return list;
  }, [catalog, category, query, sort]);

  const cartCount = cart.reduce((n, line) => n + line.qty, 0);
  const cartTotal = cart.reduce(
    (sum, line) => sum + Number(line.product.price.replace(/,/g, "")) * line.qty,
    0,
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setModal("toast");
    window.setTimeout(() => {
      setModal((m) => (m === "toast" ? null : m));
      setToast("");
    }, 1800);
  };

  const addToCart = (product: Product, qty = 1) => {
    requireLogin(() => {
      setCart((prev) => {
        const idx = prev.findIndex((l) => l.product.id === product.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + qty };
          return next;
        }
        return [...prev, { product, qty }];
      });
      showToast(`「${product.name}」已加入购物车`);
    });
  };

  const openRfq = () => requireLogin(() => setModal("rfq"));
  const openBatch = () => requireLogin(() => setModal("batch"));
  const openCart = () => requireLogin(() => setModal("cart"));

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  };

  return (
    <div className="proc-page">
      <div className="proc-topbar">
        <div className="container proc-topbar-inner">
          <div className="proc-topbar-links">
            <Link to="/">首页</Link>
            <span className="proc-divider">|</span>
            <button type="button" className="proc-link-btn" onClick={openRfq}>
              发布询价
            </button>
            <button type="button" className="proc-link-btn" onClick={openBatch}>
              批量下单
            </button>
            <span className="proc-divider">|</span>
            <span className="proc-hotline">园区客服 400-636-1696</span>
          </div>
          <div className="proc-topbar-actions">
            <button type="button" className="proc-cart-btn" onClick={openCart}>
              购物车
              <em>{cartCount}</em>
            </button>
          </div>
        </div>
      </div>

      <div className="container proc-layout">
        <aside className="proc-sidebar">
          <div className="proc-sidebar-head">全部商品分类</div>
          <ul className="proc-cats">
            {procCategories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={category === c.id ? "on" : ""}
                  onClick={() => setCategory(c.id)}
                >
                  <span className="proc-cat-icon">{c.icon}</span>
                  {c.name}
                </button>
              </li>
            ))}
          </ul>

          <div className="proc-order-panel">
            <strong>
              我的订单
              <Link to="/account/orders/procurement" className="proc-order-more">
                全部
              </Link>
            </strong>
            <div className="proc-order-tabs">
              {orderTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={orderTab === t.id ? "on" : ""}
                  onClick={() => setOrderTab(t.id)}
                >
                  {t.label}
                  <em>{t.count}</em>
                </button>
              ))}
            </div>
            <p className="proc-order-hint">
              {orderTab === "mall" && "标准电商订单，支持在线支付与物流跟踪。"}
              {orderTab === "contract" && "园区协议价订单，对公结算与账期管理。"}
              {orderTab === "rfq" && "询价单待确认报价，支持多家供应商比价。"}
            </p>
            <Link className="btn btn-outline btn-sm" style={{ width: "100%" }} to="/account/orders/procurement">
              查看全部订单
            </Link>
          </div>
        </aside>

        <div className="proc-main">
          <div className="proc-search-row">
            <label className="proc-search">
              <IconSearch width={18} height={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索商品 / 规格 / 供应商"
              />
              <button type="button" className="proc-search-btn" onClick={() => undefined}>
                搜索
              </button>
            </label>
            <div className="proc-hot">
              <span>热门搜索：</span>
              {hotSearches.map((kw) => (
                <button key={kw} type="button" onClick={() => setQuery(kw)}>
                  {kw}
                </button>
              ))}
            </div>
          </div>

          <div className="proc-promo">
            <div className="proc-promo-main">
              <div className="proc-promo-kicker">一站式工业品集采 · 园区协议价</div>
              <h1>专业化产业采购服务</h1>
              <p>品类齐全 · 询价比价 · 协议履约 · 对账结算</p>
              <div className="proc-promo-actions">
                <button type="button" className="btn btn-primary" onClick={openRfq}>
                  发布询价
                </button>
                <button type="button" className="btn btn-outline" onClick={openBatch}>
                  批量导入下单
                </button>
              </div>
            </div>
            <div className="proc-value-grid">
              {procValueProps.map((v) => (
                <div key={v.title} className="proc-value-item">
                  <strong>{v.title}</strong>
                  <span>{v.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="proc-toolbar">
            <div>
              <strong>{procCategories.find((c) => c.id === category)?.name ?? "全部商品"}</strong>
              <span className="proc-count">共 {filtered.length} 件商品</span>
            </div>
            <label className="proc-sort">
              排序
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="default">综合推荐</option>
                <option value="price-asc">价格从低到高</option>
                <option value="price-desc">价格从高到低</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="proc-empty">
              <p>暂无匹配商品</p>
              <button type="button" className="btn btn-outline" onClick={() => { setQuery(""); setCategory("all"); }}>
                清除筛选
              </button>
            </div>
          ) : (
            <div className="product-grid proc-grid">
              {filtered.map((p) => (
                <article key={p.id} className="product proc-product">
                  <ProductCover product={p} />
                  <div className="product-body">
                    <h3>{p.name}</h3>
                    <div className="spec">{p.spec}</div>
                    <div className="product-foot">
                      <div>
                        <span className="price">
                          ¥{p.price}
                          <small> / {p.unit}</small>
                        </span>
                      </div>
                      <span className="supplier">{p.supplier}</span>
                    </div>
                    <div className="proc-product-actions">
                      <button type="button" className="btn btn-outline btn-sm" onClick={openRfq}>
                        询价
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => addToCart(p)}>
                        加入购物车
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal === "cart" && (
        <div className="proc-modal-backdrop" onClick={() => setModal(null)}>
          <div className="proc-modal proc-modal--cart" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>我的购物车</h3>
              <button type="button" className="proc-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            {cart.length === 0 ? (
              <div className="proc-empty">暂无商品，去挑选协议价物料吧</div>
            ) : (
              <>
                <ul className="proc-cart-list">
                  {cart.map((line) => (
                    <li key={line.product.id}>
                      {line.product.image ? (
                        <img
                          className="proc-cart-thumb"
                          src={publicUrl(line.product.image!)}
                          alt=""
                        />
                      ) : (
                        <span className="proc-cart-thumb proc-cart-thumb--fallback">
                          {line.product.mark}
                        </span>
                      )}
                      <div>
                        <strong>{line.product.name}</strong>
                        <span>{line.product.spec}</span>
                      </div>
                      <div className="proc-cart-qty">
                        <button type="button" onClick={() => updateQty(line.product.id, -1)}>−</button>
                        <span>{line.qty}</span>
                        <button type="button" onClick={() => updateQty(line.product.id, 1)}>+</button>
                      </div>
                      <b>¥{(Number(line.product.price.replace(/,/g, "")) * line.qty).toLocaleString()}</b>
                    </li>
                  ))}
                </ul>
                <footer className="proc-cart-foot">
                  <div>
                    共 <strong>{cartCount}</strong> 件 · 合计{" "}
                    <strong className="proc-cart-total">¥{cartTotal.toLocaleString()}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setModal(null);
                      showToast("已生成协议采购单（演示）");
                    }}
                  >
                    去结算
                  </button>
                </footer>
              </>
            )}
          </div>
        </div>
      )}

      {modal === "rfq" && (
        <div className="proc-modal-backdrop" onClick={() => setModal(null)}>
          <div className="proc-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>发布询价</h3>
              <button type="button" className="proc-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <form
              className="proc-form"
              onSubmit={(e) => {
                e.preventDefault();
                setModal(null);
                showToast("询价单已发布，等待供应商报价");
              }}
            >
              <label>
                <span>需求标题</span>
                <input required placeholder="如：厂区 MRO 耗材年度集采" />
              </label>
              <label>
                <span>品类 / 规格要求</span>
                <textarea required rows={3} placeholder="描述品牌、规格、数量、交付周期等" />
              </label>
              <label>
                <span>期望预算</span>
                <input placeholder="选填，如 5–10 万" />
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost-dark" onClick={() => setModal(null)}>取消</button>
                <button type="submit" className="btn btn-primary">发布询价</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "batch" && (
        <div className="proc-modal-backdrop" onClick={() => setModal(null)}>
          <div className="proc-modal proc-modal--wide" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>批量下单 · 商品导入</h3>
              <button type="button" className="proc-modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <div className="proc-batch">
              <p>下载模板填写 SKU 与数量，上传后批量加入购物车或直接生成协议订单。</p>
              <div className="proc-batch-actions">
                <button type="button" className="btn btn-outline" onClick={() => showToast("模板已下载（演示）")}>
                  模版下载
                </button>
                <button type="button" className="btn btn-outline" onClick={() => showToast("暂无导入记录")}>
                  查看导入结果
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setModal(null);
                    showToast("已模拟导入 12 条商品");
                  }}
                >
                  上传并导入
                </button>
              </div>
              <table className="table proc-import-table">
                <thead>
                  <tr>
                    <th>文件名称</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="proc-empty-cell">暂无数据</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modal === "toast" && toast && (
        <div className="proc-toast">{toast}</div>
      )}
    </div>
  );
}
