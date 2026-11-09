import { createElement, type ReactNode } from 'react';

/** Render only the supplier editor's formatting; never execute incoming HTML. */
export function ProductDescription({ html }: { html: string }) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const tags = new Set(['p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li']);
  function render(node: Node, key: number): ReactNode {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (!(node instanceof HTMLElement)) return null;
    const tag = node.tagName.toLowerCase();
    if (tag === 'img') {
      const src = node.getAttribute('src') || '';
      if (!/^(?:\/api\/shared\/media\/[0-9a-f-]{36}$|data:image\/(?:png|jpeg|webp);base64,)/i.test(src)) return null;
      return <img key={key} src={src} alt="商品详情图片" loading="lazy" style={{maxWidth:'100%',height:'auto'}} />;
    }
    if (!tags.has(tag)) return node.textContent;
    return createElement(tag, {key}, ...(tag === 'br' ? [] : Array.from(node.childNodes).map(render)));
  }
  return <div className="buyer-features">{Array.from(doc.body.childNodes).map(render)}</div>;
}
