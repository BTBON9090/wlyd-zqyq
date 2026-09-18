import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import { asset } from "../lib/config";

/** 评价图片既可能是上传后的 data URL，也可能是演示数据里的站点资源路径。 */
function resolve(src: string) {
  return /^(?:data:|https?:)/i.test(src) ? src : asset(src);
}

/**
 * 评价配图：缩略图行 + 点击放大。
 * 用原生 img 而不是 ContentImage，因为上传图片是 data URL，后者只接受站点资源与 http(s)。
 */
export function ReviewImages({
  images,
  className = "",
}: {
  images?: string[];
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!active) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [active]);
  if (!images?.length) return null;
  return (
    <div className={`review-images${className ? ` ${className}` : ""}`}>
      {images.map((src, index) => (
        <button
          key={`${index}-${src.slice(-16)}`}
          type="button"
          className="review-image"
          aria-label={`查看第 ${index + 1} 张评价图片`}
          onClick={() => setActive(src)}
        >
          <img
            src={resolve(src)}
            alt={`评价图片 ${index + 1}`}
            loading="lazy"
          />
        </button>
      ))}
      {active && (
        <div
          className="review-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="评价图片预览"
          onClick={() => setActive(null)}
        >
          <img src={resolve(active)} alt="评价图片预览" />
          <button
            type="button"
            className="review-lightbox-close"
            aria-label="关闭图片预览"
            onClick={() => setActive(null)}
          >
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
