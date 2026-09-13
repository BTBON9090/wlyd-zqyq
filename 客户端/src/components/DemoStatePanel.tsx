import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { DemoPersona } from "../types/auth";

const items: { id: DemoPersona; label: string; hint: string }[] = [
  { id: "personal", label: "个人用户", hint: "无企业 · 入驻引导" },
  { id: "create", label: "创建企业", hint: "选园区填资料" },
  { id: "invite", label: "邀请码入驻", hint: "定位园区后走四步向导" },
  { id: "join", label: "加入企业", hint: "管理员审批" },
  { id: "pending", label: "审核中", hint: "无平台权限" },
  { id: "rejected", label: "审核驳回", hint: "需重新提交" },
  { id: "approved", label: "已入驻", hint: "可交易" },
  { id: "multi", label: "多企业", hint: "顶部切换" },
];

export function DemoStatePanel({ compact = false }: { compact?: boolean }) {
  const { applyDemoState, demoPersona } = useAuth();
  const navigate = useNavigate();

  const run = (id: DemoPersona) => {
    const path = applyDemoState(id);
    navigate(path);
  };

  return (
    <section className={`demo-panel ${compact ? "is-compact" : ""}`}>
      <div className="demo-panel__head">
        <strong>状态演示</strong>
        <span>点击后自动登录并进入对应状态</span>
      </div>
      <div className="demo-panel__actions">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`demo-chip ${demoPersona === item.id ? "on" : ""}`}
            onClick={() => run(item.id)}
            title={item.hint}
          >
            <b>{item.label}</b>
            <em>{item.hint}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
