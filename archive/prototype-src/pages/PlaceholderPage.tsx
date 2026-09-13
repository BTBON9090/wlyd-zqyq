import { Link } from "react-router-dom";

type Props = {
  title: string;
  brand?: string;
  desc: string;
  hints?: string[];
};

/** 一级模块占位页：智慧物流 / AI赋能 等尚未接入完整业务时使用 */
export function PlaceholderPage({ title, brand, desc, hints = [] }: Props) {
  return (
    <div className="portal-placeholder">
      <div className="portal-container">
        <div className="portal-placeholder-card">
          <div className="crumb">
            <Link to="/">首页</Link>
            <span>/</span>
            <em>{title}</em>
          </div>
          {brand && <span className="portal-placeholder-brand">{brand}</span>}
          <h1>{title}</h1>
          <p>{desc}</p>
          {hints.length > 0 && (
            <ul>
              {hints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          <div className="portal-placeholder-actions">
            <Link to="/" className="portal-console-btn">
              返回首页
            </Link>
            <button
              type="button"
              className="portal-login-link"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("portal-open-ai", { detail: { prompt: title } }))
              }
            >
              咨询 AI 助手 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
