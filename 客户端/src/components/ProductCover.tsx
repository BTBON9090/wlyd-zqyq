import type { Product } from "../data";
import { publicUrl } from "../utils/publicUrl";

type Props = {
  product: Product;
  className?: string;
};

/** 商品主图：有真实图片则展示，否则回退到色块 + 品类字标 */
export function ProductCover({ product, className = "" }: Props) {
  const hasImage = Boolean(product.image);

  return (
    <div
      className={`product-cover ${hasImage ? "has-image" : `tone-${product.tone}`} ${className}`.trim()}
    >
      {hasImage ? (
        <img
          src={publicUrl(product.image!)}
          alt={product.name}
          className="product-cover-img"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="mark">{product.mark}</span>
      )}
      <span className="tag">{product.tag}</span>
    </div>
  );
}
