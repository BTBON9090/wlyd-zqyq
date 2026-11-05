import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Package,
  Barcode,
  ShoppingCart,
  Trash,
  ListChecks,
  FileArrowDown,
} from "@phosphor-icons/react";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState } from "../../components/ui";
import { currency } from "../../lib/money";
import { useCart } from "./cart";
import { validQuantity } from "./model";
import { useProducts } from "./catalogue";
import { MarketHeader } from "./MarketHeader";
import { quote, totals, lineAmounts } from "./delivery";
import { useDelivery } from "./AddressPicker";

export default function CartPage() {
  const cart = useCart();
  const query = useProducts();
  const [sku, setSku] = useState("");
  const [message, setMessage] = useState("");
  const delivery = useDelivery();
  const products = query.data?.map((p) => quote(p, delivery.region));
  const rows = cart.items.map((item) => ({
    item,
    product: products?.find((p) => p.id === item.productId),
  }));
  const selected = rows.filter(({ item }) => item.selected);
  const valid =
    selected.length > 0 &&
    selected.every(
      ({ item, product }) => product && validQuantity(product, item.quantity),
    );
  const amount = totals(selected);
  const suppliers = [...new Set(rows.map((r) => r.product?.supplierId))];
  function addBySku() {
    const product = products?.find((p) =>
      [p.sku, p.code].some(
        (value) => value?.toLowerCase() === sku.trim().toLowerCase(),
      ),
    );
    if (!product) {
      setMessage("未找到该商品编码，请检查后重试。");
      return;
    }
    try {
      cart.add(product, product.minimum);
      setSku("");
      setMessage("已加入购物车。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "暂时无法加入购物车");
    }
  }
  function exportRows(quote: boolean) {
    const cell = (v: string | number) => {
      const s = String(v);
      return `"${(/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
    };
    const lines = [
      [
        "商品名称",
        "商品编码",
        "规格型号",
        "单位",
        "数量",
        "含税单价（元）",
        "含税小计（元）",
        "备注",
      ],
      ...selected
        .filter(({ product }) => !!product)
        .map(({ item, product }) => [
          product!.name,
          product!.sku,
          product!.spec,
          product!.unit,
          item.quantity,
          product!.price.toFixed(2),
          (product!.price * item.quantity).toFixed(2),
          item.remark,
        ]),
    ];
    if (quote) lines.push(["价格仅供参考，最终以实际确认为准"]);
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff" + lines.map((line) => line.map(cell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = quote ? "集采报价参考.csv" : "集采商品清单.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <MarketHeader />
      <div className="commerce-container procurement-cart-page">
        <Breadcrumb
          items={[
            { label: "集采商城", to: "/procurement" },
            { label: "购物车" },
          ]}
        />
        <header className="buyer-heading">
          <div>
            <ShoppingCart weight="duotone" />
            <h1>我的购物车</h1>
            <small>{rows.length} 种商品</small>
          </div>
          <Link to="/procurement?view=all">
            <ArrowLeft size={15} />
            继续选购
          </Link>
        </header>
        {query.isPending ? (
          <p>正在加载商品…</p>
        ) : query.isError ? (
          <EmptyState
            error
            title="购物车暂时无法加载"
            description={query.error.message}
            action="重新加载"
            onAction={() => void query.refetch()}
          />
        ) : !rows.length ? (
          <EmptyState
            title="购物车还是空的"
            description="浏览集采商品，或通过商品编码添加物资。"
          />
        ) : (
          <section className="buyer-cart-panel">
            <div className="buyer-cart-tools">
              <label>
                <input
                  type="checkbox"
                  checked={selected.length === rows.length}
                  onChange={(e) => cart.selectAll(e.target.checked)}
                />
                全选
              </label>
              <button
                disabled={!selected.length}
                onClick={() =>
                  cart.remove(selected.map((r) => r.item.productId))
                }
              >
                <Trash size={16} aria-hidden="true" /> 删除所选
              </button>
              <button disabled={!valid} onClick={() => exportRows(false)}>
                <ListChecks size={16} aria-hidden="true" /> 导出清单
              </button>
              <button disabled={!valid} onClick={() => exportRows(true)}>
                <FileArrowDown size={16} aria-hidden="true" /> 导出报价单
              </button>
            </div>
            {suppliers.map((id) => (
              <section className="buyer-supplier" key={id || "unavailable"}>
                {rows
                  .filter((r) => r.product?.supplierId === id)
                  .map(({ item, product: p }) => (
                    <article className="buyer-cart-row" key={item.productId}>
                      <input
                        type="checkbox"
                        aria-label={"选择" + (p?.name || "商品")}
                        checked={item.selected}
                        onChange={(e) =>
                          cart.select(item.productId, e.target.checked)
                        }
                      />
                      <ContentImage
                        src={p?.image}
                        alt={p?.name || "商品"}
                        placeholder=""
                        placeholderIcon={<Package size={24} />}
                      />
                      <div className="buyer-item-info">
                        {p ? (
                          <Link to={"/procurement/" + encodeURIComponent(p.id)}>
                            {p.name}
                          </Link>
                        ) : (
                          <strong>商品已下架</strong>
                        )}
                        <small>
                          {[p?.brand, p?.spec, p?.model]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                        <small>商品编码　{p?.code || p?.sku || "—"}</small>
                      </div>
                      <div className="buyer-line-price">
                        <small>含税单价</small>
                        <b>{p ? currency(p.price) : "—"}</b>
                        <small>
                          {p
                            ? "未税参考 " +
                              currency(p.price / (1 + p.taxRate / 100))
                            : ""}
                        </small>
                      </div>
                      <div>
                        {p && (
                          <>
                            <div className="procurement-stepper">
                              <button
                                aria-label="减少数量"
                                disabled={item.quantity <= p.minimum}
                                onClick={() =>
                                  cart.update(
                                    p.id,
                                    Math.max(
                                      p.minimum,
                                      item.quantity - p.increment,
                                    ),
                                  )
                                }
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                aria-label={p.name + "购买数量"}
                                value={item.quantity}
                                onChange={(e) => {
                                  const n = Number(e.target.value);
                                  if (Number.isSafeInteger(n) && n > 0)
                                    cart.update(p.id, n);
                                }}
                              />
                              <button
                                aria-label="增加数量"
                                disabled={item.quantity + p.increment > p.stock}
                                onClick={() =>
                                  cart.update(p.id, item.quantity + p.increment)
                                }
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <small>
                              {p.unit} · 库存 {p.stock}
                            </small>
                            {!validQuantity(p, item.quantity) && (
                              <small className="procurement-inline-error">
                                请按 {p.minimum} {p.unit}起订、{p.increment}{" "}
                                {p.unit}递增，不超过库存。
                              </small>
                            )}
                          </>
                        )}
                      </div>
                      <div className="buyer-line-price">
                        <small>含税小计</small>
                        <strong>
                          {p
                            ? currency(
                                lineAmounts(p, item.quantity).gross / 100,
                              )
                            : "—"}
                        </strong>
                      </div>
                      <button
                        className="buyer-remove"
                        aria-label={"移除" + (p?.name || "商品")}
                        onClick={() => cart.remove([item.productId])}
                      >
                        <Trash size={17} />
                      </button>
                    </article>
                  ))}
              </section>
            ))}
          </section>
        )}
        <form
          className="buyer-quick"
          onSubmit={(e) => {
            e.preventDefault();
            addBySku();
          }}
        >
          <label htmlFor="quick-sku">
            <Barcode size={20} />
            快速添加
          </label>
          <input
            id="quick-sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="输入商品编码或 SKU"
          />
          <button
            className="button secondary"
            disabled={!sku.trim() || !products}
            type="submit"
          >
            添加商品
          </button>
          <small>按起订量加入；已有商品会合并数量。</small>
          {message && <span role="status">{message}</span>}
        </form>
        {!!rows.length && (
          <footer className="buyer-cart-footer">
            <span>
              已选 <b>{selected.length}</b> 种商品
            </span>
            <div>
              <small>合计（含税）</small>
              <strong>{currency(amount.gross / 100)}</strong>
            </div>
            <Link
              className={"button primary" + (valid ? "" : " is-disabled")}
              aria-disabled={!valid}
              to={valid ? "/procurement/checkout" : "#"}
              onClick={(e) => {
                if (!valid) e.preventDefault();
              }}
            >
              去结算 <ArrowRight size={16} />
            </Link>
          </footer>
        )}
      </div>
    </>
  );
}
