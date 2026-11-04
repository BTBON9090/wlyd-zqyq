import { Package } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import { ContentImage } from "../../components/ContentImage";
import type { Product } from "./model";
import "./product-card.css";

/** 客户端仅展示供应商公开商品字段，缺失信息不编造成真实数据。 */
export function ProductCard({ product }: { product: Product }) {
  const location = useLocation();
  const from = `${location.pathname}${location.search}${location.hash}`;
  const spec = [product.spec, product.model].filter(Boolean).join(" · ");
  return (
    <article className="jc-card">
      <Link className="jc-card-link" to={`/procurement/${encodeURIComponent(product.id)}`} state={{ from }}>
        <div className="jc-card-media">
          <ContentImage src={product.image} alt={product.name} placeholder="暂无商品图片" placeholderIcon={<Package size={36} weight="duotone"/>} />
          <span className="jc-card-minimum">{product.minimum} {product.unit}起订</span>
        </div>
        <div className="jc-card-body">
          <div className="jc-card-tags">
            {product.brand && <span className="jc-card-brand">{product.brand}</span>}
            <span className="jc-card-category" title={product.category}>{product.category}</span>
          </div>
          <h3 className="jc-card-title" title={product.name}>{product.name}</h3>
          <p className="jc-card-spec" title={spec || "规格以供应商发布为准"}>规格：{spec || "以供应商发布为准"}</p>
          <div className="jc-card-pricing">
            <span>销售价</span><strong>¥{product.price.toFixed(2)}</strong><small>/{product.unit}</small>
            {product.originalPrice > product.price && <del>¥{product.originalPrice.toFixed(2)}</del>}
          </div>
          <div className="jc-card-meta">
            <span>{product.sales === undefined ? "销量待提供" : `已采 ${product.sales} ${product.unit}`}</span>
            <span>{product.stock > 0 ? `库存 ${product.stock} ${product.unit}` : "暂时无货"}</span>
            <span>{product.leadDays} 天货期</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
