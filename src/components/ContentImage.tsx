import { useState, type ReactNode } from "react";
import { asset } from "../lib/config";

/** 把配置里的相对路径解析为站点资源地址；仅接受本地路径与 HTTP(S)。 */
function resolveSource(value?: string) {
  if (value && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return asset(value);
  return /^https?:\/\//i.test(value || "") ? value : undefined;
}

/**
 * CMS/商家图片专用容器。
 * 缺图或加载失败时呈现缺省状态：`placeholderIcon` 与 `placeholder` 文字上下组合。
 * 禁止用图标或 CSS 装饰冒充宣传图；缺省状态是明确的空位，不是宣传图。
 */
export function ContentImage({
  src,
  mobileSrc,
  onUnavailable,
  alt,
  className = "",
  eager = false,
  placeholder = "暂无宣传图",
  placeholderIcon,
  children,
}: {
  src?: string;
  mobileSrc?: string;
  onUnavailable?: () => void;
  alt: string;
  className?: string;
  eager?: boolean;
  placeholder?: string;
  placeholderIcon?: ReactNode;
  children?: ReactNode;
}) {
  const valid = resolveSource(src);
  const mobileValid = resolveSource(mobileSrc);
  const [failedSource, setFailedSource] = useState<string>();
  const sourceKey = src || mobileSrc;
  const available = !!(valid || mobileValid) && failedSource !== sourceKey;
  return (
    <div className={`content-image ${className}`} data-empty={!available}>
      {available ? (
        <picture>
          {mobileValid && (
            <source media="(max-width: 639px)" srcSet={mobileValid} />
          )}
          <img
            key={sourceKey}
            src={valid || mobileValid}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onError={() => {
              setFailedSource(sourceKey);
              onUnavailable?.();
            }}
          />
        </picture>
      ) : (
        <span className="image-empty-label">
          {placeholderIcon}
          {placeholder}
        </span>
      )}
      {children}
    </div>
  );
}
