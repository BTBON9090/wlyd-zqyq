import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "../../app/AppProvider";
import { ordersGateway } from "./orders/gateway";
import type { NewOrder } from "./orders/types";
import {
  ArrowLeft,
  ClipboardText,
  Package,
} from "@phosphor-icons/react";
import { Breadcrumb } from "../../components/Shell";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState } from "../../components/ui";
import { currency } from "../../lib/money";
import { useCart } from "./cart";
import { validQuantity } from "./model";
import { useProducts } from "./catalogue";
import { MarketHeader } from "./MarketHeader";

import { AddressPicker, useDelivery } from "./AddressPicker";
import { quote, totals, lineAmounts } from "./delivery";

export default function CheckoutPage() {
  const cart = useCart();
  const query = useProducts();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { session, openAuth, toast } = useApp();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const delivery = useDelivery();
  const active = delivery.active;
  const [note, setNote] = useState("");
  const [remarks, setRemarks] = useState<Record<string,string>>({});
  const direct = params.get("product");
  const quantity = Number(params.get("quantity"));
  const checkoutItems = direct
    ? [{ productId: direct, quantity, selected: true, remark: "" }]
    : cart.items.filter((item) => item.selected);
  const products = query.data?.map((p) => quote(p, delivery.region));
  const rows = checkoutItems.map((item) => ({
    item,
    product: products?.find((p) => p.id === item.productId),
  }));
  const allValid =
    rows.length > 0 &&
    rows.every(
      ({ item, product }) => product && validQuantity(product, item.quantity),
    );
  const amount = totals(rows),
    free = rows.every((r) => r.product?.freightMode === "免运费");
  const suppliers = [...new Set(rows.map((r) => r.product?.supplierId))];
  async function submitOrder() {
    if (!__DEMO__ || pending || !allValid) return;
    if (!session) {
      openAuth({ returnTo: window.location.pathname + window.location.search });
      return;
    }
    if (!active) {
      setError("请选择收货地址。");
      return;
    }
    setPending(true);
    setError("");
    try {
      const groups = new Map<string, NewOrder>();
      for (const { item, product } of rows) {
        if (!product) continue;
        const supplier = product.supplierName;
        let group = groups.get(product.supplierId);
        if (!group) {
          group = {
            supplier,
            receiver: active.receiver,
            phone: active.phone,
            address: active.region + " " + active.street,
            note: note.trim(),
            items: [],
          };
          groups.set(product.supplierId, group);
        }
        group.items.push({
          id: product.id,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          model: product.model,
          spec: product.spec,
          unit: product.unit,
          quantity: item.quantity,
          price: product.price,
          shipped: 0,
          image: product.image,
          remark: remarks[item.productId] ?? item.remark,
        });
      }
      const ids = await ordersGateway.create(session.id, [...groups.values()]);
      if (!direct) cart.remove(checkoutItems.map((item) => item.productId));
      await client.invalidateQueries({
        queryKey: ["procurement-orders", session.id],
      });
      toast(ids.length > 1 ? "订单提交成功，已按供应商生成 "+ids.length+" 笔订单" : "订单提交成功");
      navigate(
        ids.length === 1
          ? `/account/orders/procurement?order=${encodeURIComponent(ids[0])}`
          : "/account/orders/procurement",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "订单暂时无法提交");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <MarketHeader />
      <div className="commerce-container procurement-checkout">
        <Breadcrumb
          items={[
            { label: "集采商城", to: "/procurement" },
            { label: "购物车", to: "/procurement/cart" },
            { label: "确认采购信息" },
          ]}
        />
        <header className="buyer-heading">
          <div>
            <ClipboardText weight="duotone" />
            <h1>确认采购信息</h1>
          </div>
          <Link to="/procurement/cart">
            <ArrowLeft size={15} />
            返回购物车
          </Link>
        </header>
        {query.isPending ? (
          <div className="loading-page">正在加载商品…</div>
        ) : query.isError ? (
          <EmptyState
            error
            title="采购信息暂时无法加载"
            description={query.error.message}
            action="重新加载"
            onAction={() => void query.refetch()}
          />
        ) : !allValid ? (
          <div className="procurement-empty">
            <h2>购物车中的商品需要调整</h2>
            <p>部分商品已不可用或数量不符合当前配送区域的供货要求。</p>
            <AddressPicker delivery={delivery} checkout />
            <Link className="button primary buyer-empty-back" to="/procurement/cart">
              <ArrowLeft size={16} aria-hidden="true" /> 返回购物车
            </Link>
          </div>
        ) : (
          <div className="procurement-checkout-layout">
            <div className="procurement-checkout-main">
              <section className="buyer-panel">
                <h2>收货信息</h2>
                <AddressPicker delivery={delivery} checkout />
              </section>
              <section className="buyer-panel">
                <div className="buyer-panel-title">
                  <h2>商品清单</h2>
                  <small>{rows.length} 种商品</small>
                </div>
                {suppliers.map((id) => (
                  <div className="buyer-check-group" key={id}>
                    {rows
                      .filter((r) => r.product?.supplierId === id)
                      .map(
                        ({ product: p, item }) =>
                          p && (
                            <article className="buyer-check-item" key={p.id}>
                              <ContentImage
                                src={p.image}
                                alt={p.name}
                                placeholder=""
                                placeholderIcon={<Package size={22} />}
                              />
                              <div>
                                <strong>{p.name}</strong>
                                <small>
                                  {[p.brand, p.spec, p.model]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </small>
                                <small>商品编码　{p.code || p.sku}</small>
                              </div>
                              <div className="buyer-check-price">
                                <small>
                                  {currency(p.price)} × {item.quantity} {p.unit}
                                </small>
                                <b>
                                  {currency(
                                    lineAmounts(p, item.quantity).gross / 100,
                                  )}
                                </b>
                              </div>
                              <label className="buyer-item-remark">
                                <textarea rows={1} aria-label={p.name + "采购备注"} maxLength={200}
                                  placeholder="填写此商品的采购要求（选填）"
                                  value={remarks[item.productId] ?? item.remark}
                                  onChange={(e)=>setRemarks({...remarks,[item.productId]:e.target.value})}/>
                              </label>
                            </article>
                          ),
                      )}
                  </div>
                ))}
                <label className="buyer-note">
                  采购备注
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="给供应商留言（选填）"
                    maxLength={200}
                  />
                </label>
              </section>
            </div>
            <aside className="buyer-panel buyer-bill">
              <h2>费用明细</h2>
              <dl>
                <div>
                  <dt>商品金额（未税）</dt>
                  <dd>{currency(amount.net / 100)}</dd>
                </div>
                <div>
                  <dt>税额</dt>
                  <dd>{currency(amount.tax / 100)}</dd>
                </div>
                <div>
                  <dt>运费</dt>
                  <dd>{free ? "免运费" : "待供应商确认"}</dd>
                </div>
              </dl>
              <div className="buyer-bill-total">
                <span>{free ? "应付总额" : "商品合计（含税），不含运费"}</span>
                <strong>{currency(amount.gross / 100)}</strong>
              </div>
              {error && <p role="alert">{error}</p>}
              <button
                className="button primary full-width"
                disabled={!__DEMO__ || pending}
                onClick={() => void submitOrder()}
              >
                {pending ? "提交中…" : "提交订单"}
              </button>
              {!__DEMO__ && <small>订单提交服务暂未开放</small>}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
