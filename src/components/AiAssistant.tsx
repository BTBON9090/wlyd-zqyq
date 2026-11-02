import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Sparkle, X } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import "./AiAssistant.css";

const avatar = `${import.meta.env.BASE_URL}media/ai-assistant-avatar-3d.jpg`;

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <aside className="ai-assistant" aria-label="AI 智能助手">
      {open && <section className="ai-assistant-panel" id="ai-assistant-panel" aria-label="AI 智能助手面板">
        <div className="ai-assistant-panel-header">
          <img src={avatar} alt="" />
          <div><strong>AI 智能助手</strong><span><Sparkle size={13} weight="fill" /> 您的企业服务小助手</span></div>
          <button type="button" className="ai-assistant-close" aria-label="关闭智能助手" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={19} /></button>
        </div>
        <div className="ai-assistant-body">
          <span className="ai-assistant-eyebrow">为企业寻找更多可能</span>
          <h2>您好，有什么可以帮您？</h2>
          <p>从企业服务到智能解决方案，探索适合您的资源。</p>
          <div className="ai-assistant-links">
            <Link to="/services/hall" onClick={() => setOpen(false)}>寻找企业服务 <ArrowUpRight size={16} /></Link>
            <Link to="/ai" onClick={() => setOpen(false)}>了解 AI 解决方案 <ArrowUpRight size={16} /></Link>
          </div>
          <p className="ai-assistant-note">原型展示 · 智能对话功能正在准备中</p>
        </div>
      </section>}
      <button ref={trigger} className="ai-assistant-trigger" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="ai-assistant-panel" aria-label={open ? "收起 AI 智能助手" : "打开 AI 智能助手"}>
        <span className="ai-assistant-avatar"><img src={avatar} alt="" /><span className="ai-assistant-sparkle"><Sparkle size={12} weight="fill" /></span></span>
        <span className="ai-assistant-trigger-copy">有什么可以帮你？</span>
      </button>
    </aside>
  );
}
