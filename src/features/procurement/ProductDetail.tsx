import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Package,
  Minus,
  Plus,
  ShoppingCart,
} from "@phosphor-icons/react";
import { Breadcrumb } from "../../components/Shell";
import { asset } from "../../lib/config";
import { ContentImage } from "../../components/ContentImage";
import { EmptyState } from "../../components/ui";
import { useApp } from "../../app/AppProvider";
import { useCart } from "./cart";
import { validQuantity, type Product } from "./model";
import { useProducts } from "./catalogue";
import { MarketHeader } from "./MarketHeader";

import { useDelivery } from "./AddressPicker";
import { RegionSelect } from "./RegionSelect";
import { quote } from "./delivery";

export default function ProductDetail() {
  const { productId = "" } = useParams();
  const query = useProducts();
  const location = useLocation();
  const from =
    typeof location.state?.from === "string" &&
    /^\/procurement(?:[?#]|$)/.test(location.state.from)
      ? location.state.from
      : "/procurement";
  const product = query.data?.find((p) => p.id === productId);
  if (query.isPending)
    return (
      <>
        <MarketHeader />
        <div className="loading-page">正在加载商品详情…</div>
      </>
    );
  if (query.isError)
    return (
      <>
        <MarketHeader />
        <div className="commerce-container">
          <EmptyState
            error
            title="商品暂时无法加载"
            description={query.error.message}
            action="重新加载"
            onAction={() => void query.refetch()}
          />
          <Link to="/procurement" className="button secondary">
            返回商城
          </Link>
        </div>
      </>
    );
  if (!product)
    return (
      <>
        <MarketHeader />
        <div className="commerce-container">
          <EmptyState
            title="商品不存在或已下架"
            description="您可以返回商城查看其他商品。"
          />
          <Link to="/procurement" className="button secondary">
            返回商城
          </Link>
        </div>
      </>
    );
  return (
    <>
      <MarketHeader />
      <ProductContent key={product.id} product={product} returnTo={from} />
    </>
  );
}
function ProductContent({
  product: base,
  returnTo,
}: {
  product: Product;
  returnTo: string;
}) {
  const delivery = useDelivery();
  const [region, setRegion] = useState(delivery.active?.region || delivery.region || "");
  const product = quote(base, region);
  const media =
    product.detailMedia ||
    product.images?.map((src) => ({ type: "image" as const, src })) ||
    [];
  const images = [
    ...new Set(
      [product.image, ...(product.images || [])].filter(
        (s): s is string => !!s,
      ),
    ),
  ];
  const [photo, setPhoto] = useState(0);
  const [quantity, setQuantity] = useState(product.minimum);
  const [message, setMessage] = useState("");
  const cart = useCart();
  const { toast } = useApp();
  const navigate = useNavigate();
  function add(buyNow = false) {
    if (!validQuantity(product, quantity)) {
      setMessage(
        `请按 ${product.minimum} ${product.unit}起订、每次增加 ${product.increment} ${product.unit}选择，且不超过库存。`,
      );
      return;
    }
    if (buyNow) {
      navigate(
        `/procurement/checkout?product=${encodeURIComponent(product.id)}&quantity=${quantity}`,
      );
      return;
    }
    try {
      cart.add(product, quantity);
      setMessage("");
      toast("已加入购物车");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "暂时无法加入购物车");
    }
  }
  return (
    <div className="commerce-container product-detail-v2 product-detail-v3 procurement-detail">
      <Breadcrumb
        detail
        items={[
          { label: "集采商城", to: "/procurement" },
          {
            label: product.category,
            to: `/procurement?cat=${encodeURIComponent(product.categoryId)}`,
          },
          { label: product.name },
        ]}
      />
      <section className="procurement-detail-hero market-detail-hero">
        <div className="procurement-detail-gallery">
          <ContentImage
            src={images[photo]}
            alt={product.name + " · " + (photo + 1)}
            placeholder="暂无商品图片"
            placeholderIcon={<Package size={36} />}
            eager
          />
          {images.length > 1 && (
            <nav className="buyer-thumbs" aria-label="商品图片">
              {images.map((src, i) => (
                <button
                  key={src}
                  aria-label={"查看商品图 " + (i + 1)}
                  aria-pressed={i === photo}
                  onClick={() => setPhoto(i)}
                >
                  <ContentImage src={src} alt={""} />
                </button>
              ))}
            </nav>
          )}
        </div>
        <div className="procurement-detail-summary">
          <h1>{product.name}</h1>
          <p className="procurement-detail-lead">{product.description}</p>
          <div className="procurement-detail-price">
            <div>
              <span>销售价</span>
              <strong>¥ {product.price.toFixed(2)}</strong>
              <small> / {product.unit}</small>
              <em>含税</em>
            </div>
            <p>
              未税参考价 ¥
              {(product.price / (1 + product.taxRate / 100)).toFixed(2)}（税率{" "}
              {product.taxRate}%）
            </p>
          </div>
          <dl className="procurement-facts">
            <div>
              <dt>品牌名称</dt>
              <dd>{product.brand || "—"}</dd>
            </div>
            <div>
              <dt>规格型号</dt>
              <dd>{product.spec || "—"}</dd>
            </div>
            <div>
              <dt>商品编码</dt>
              <dd>
                {product.code || product.sku || "—"}
                {(product.code || product.sku) && (
                  <button
                    className="market-copy"
                    aria-label="复制商品编码"
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(product.code || product.sku)
                        .then(() => toast("商品编码已复制"))
                        .catch(() => toast("复制失败，请手动选择"))
                    }
                  >
                    <Copy size={14} />
                  </button>
                )}
              </dd>
            </div>
            <div>
              <dt>起订量</dt>
              <dd>
                {product.minimum} {product.unit} · 递增 {product.increment}{" "}
                {product.unit}
              </dd>
            </div>
            <div>
              <dt>销售单位</dt>
              <dd>{product.unit}</dd>
            </div>
            <div>
              <dt>供应商</dt>
              <dd>{product.supplierName}</dd>
            </div>
            <div>
              <dt>供货周期</dt>
              <dd>{product.leadDays} 天</dd>
            </div>
            <div>
              <dt>当前库存</dt>
              <dd>
                {product.stock} {product.unit}
              </dd>
            </div>
          </dl>
          <div className="buyer-detail-region"><span>配送至</span><RegionSelect compact value={region} onChange={setRegion}/></div>
          <div className="procurement-quantity">
            <span>购买数量</span>
            <div className="procurement-stepper">
              <button
                disabled={quantity <= product.minimum}
                onClick={() =>
                  setQuantity(
                    Math.max(product.minimum, quantity - product.increment),
                  )
                }
                aria-label="减少购买数量"
              >
                <Minus />
              </button>
              <input
                type="number"
                aria-label="购买数量"
                value={Number.isNaN(quantity) ? "" : quantity}
                onChange={(e) =>
                  setQuantity(e.target.value ? Number(e.target.value) : NaN)
                }
                min={product.minimum}
                max={product.stock}
                step={product.increment}
              />
              <button
                disabled={quantity + product.increment > product.stock}
                onClick={() =>
                  setQuantity(
                    (Number.isFinite(quantity) ? quantity : product.minimum) +
                      product.increment,
                  )
                }
                aria-label="增加购买数量"
              >
                <Plus />
              </button>
            </div>
            <small>{product.unit}</small>
          </div>
          {message && (
            <p className="procurement-inline-error" role="alert">
              {message}
            </p>
          )}
          <div className="procurement-detail-actions">
            <button
              className="button primary"
              disabled={product.stock < product.minimum}
              onClick={() => add()}
            >
              <ShoppingCart size={17} /> 加入购物车
            </button>
            <button
              className="button secondary"
              disabled={product.stock < product.minimum}
              onClick={() => add(true)}
            >
              立即购买
            </button>
          </div>
        </div>
      </section>
      <section className="procurement-description buyer-detail-info">
        <h2>商品信息</h2>
        <dl>
          <div>
            <dt>商品名称</dt>
            <dd>{product.name}</dd>
          </div>
          <div>
            <dt>品牌</dt>
            <dd>{product.brand || "—"}</dd>
          </div>
          <div>
            <dt>规格型号</dt>
            <dd>{product.spec || "—"}</dd>
          </div>
          {product.model && (
            <div>
              <dt>商品型号</dt>
              <dd>{product.model}</dd>
            </div>
          )}
          {product.freightMode && (
            <div>
              <dt>运费方式</dt>
              <dd>{product.freightMode}</dd>
            </div>
          )}
          {product.salesArea && (
            <div>
              <dt>销售区域</dt>
              <dd>{product.salesArea}</dd>
            </div>
          )}
          {product.attrs?.map((attr) => (
            <div key={attr.name}>
              <dt>{attr.name}</dt>
              <dd>{attr.value}</dd>
            </div>
          ))}
          <div>
            <dt>销售单位</dt>
            <dd>{product.unit}</dd>
          </div>
        </dl>
        {product.features && (
          <div className="buyer-features">
            <h3>商品特点</h3>
            <p>{product.features}</p>
          </div>
        )}
        {!!media.length && (
          <div className="buyer-detail-photos">
            {media.map((item, i) =>
              item.type === "image" ? (
                <ContentImage
                  key={i}
                  src={item.src}
                  alt={product.name + " · 详情图 " + (i + 1)}
                />
              ) : (
                /^(https?:\/\/|[^:/?#]+\/)/i.test(item.src) && (
                  <video
                    key={i}
                    controls
                    preload="metadata"
                    src={
                      /^https?:\/\//i.test(item.src)
                        ? item.src
                        : asset(item.src)
                    }
                    aria-label={product.name + "详情视频"}
                  />
                )
              ),
            )}
          </div>
        )}
      </section>
      <footer className="buyer-detail-back">
        <Link className="button secondary" to={returnTo}>
          <ArrowLeft size={15} />
          返回商品列表
        </Link>
      </footer>
    </div>
  );
}
