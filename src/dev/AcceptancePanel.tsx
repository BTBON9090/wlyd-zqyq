import { useState } from "react";
import { Bug, CaretDown, Check, X } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "../app/AppProvider";
import { demoControls, setDemoSession } from "./mockGateway";
import { useDraggableTool } from "./useDraggableTool";
const fields = [
  ["phone", "手机号格式"],
  ["otp", "短信验证码"],
  ["password", "密码规则"],
  ["confirm", "重复密码"],
  ["agreed", "协议勾选"],
  ["enterprise", "企业名称"],
  ["creditCode", "信用代码"],
  ["file", "营业执照"],
  ["contactName", "联系人"],
  ["title", "需求标题"],
  ["requirement", "需求描述"],
  ["inviteCode", "邀请码"],
  ["enterpriseId", "企业选择"],
];
export default function AcceptancePanel() {
  const draggable = useDraggableTool();
  const [open, setOpen] = useState(false);
  const { skipped, setSkipped, setSession, theme, setTheme, toast } = useApp();
  const client = useQueryClient();
  const navigate = useNavigate();
  const toggle = (key: string) => {
    const next = skipped.includes(key)
      ? skipped.filter((x) => x !== key)
      : [...skipped, key];
    setSkipped(next);
    demoControls.skipped = next;
  };
  return (
    <aside ref={draggable.ref} style={draggable.style} className="acceptance-panel" aria-label="验收工具">
      {open && (
        <div className="acceptance-content" style={draggable.panelStyle}>
          <header>
            <strong>测试验收</strong>
            <button
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="收起验收面板"
            >
              <X />
            </button>
          </header>
          <p>仅本地演示生效，不发送真实短信或订单。</p>
          <details open>
            <summary>
              逐项跳过校验 <CaretDown />
            </summary>
            <div className="skip-grid">
              {fields.map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={skipped.includes(key)}
                    onChange={() => toggle(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </details>
          <button
            className="text-button"
            onClick={() => {
              setSkipped([]);
              demoControls.skipped = [];
            }}
          >
            恢复全部校验
          </button>
          <div className="panel-divider" />
          <label className="panel-label">
            主题预览
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="blue">政企蓝</option>
              <option value="teal">生态青</option>
              <option value="navy">沉稳靛</option>
            </select>
          </label>
          <div className="test-actions">
            <button
              onClick={() => {
                const user = {
                  id: "demo-enterprise-user",
                  phone: "13800000000",
                  name: "丁野",
                  enterprise: "临港精密制造有限公司",
                  enterpriseStatus: "approved" as const,
                };
                setDemoSession(user);
                setSession(user);
                toast("已切换为已认证企业账号");
              }}
            >
              已认证企业
            </button>
            <button
              onClick={() => {
                const user = {
                  id: "demo-personal-user",
                  phone: "13900000000",
                  name: "园区用户",
                  enterpriseStatus: "none" as const,
                };
                setDemoSession(user);
                setSession(user);
                navigate("/onboarding");
              }}
            >
              个人账号
            </button>
            <button
              onClick={() => {
                setDemoSession(null);
                setSession(null);
                navigate("/");
              }}
            >
              游客状态
            </button>
            <button
              onClick={() => {
                demoControls.failNext = true;
                toast("下一次接口操作将模拟失败");
              }}
            >
              下一次操作失败
            </button>
            <button
              onClick={() => {
                demoControls.fault =
                  demoControls.fault === "empty" ? "none" : "empty";
                void client.invalidateQueries({ queryKey: ["services"] });
              }}
            >
              切换空列表
            </button>
            <button
              onClick={() => {
                demoControls.fault =
                  demoControls.fault === "error" ? "none" : "error";
                void client.invalidateQueries({ queryKey: ["services"] });
              }}
            >
              切换加载失败
            </button>
          </div>
          <button
            className="text-button"
            onClick={() => {
              demoControls.fault = "none";
              demoControls.failNext = false;
              void client.invalidateQueries({ queryKey: ["services"] });
              toast("异常模拟已恢复");
            }}
          >
            <Check />
            恢复正常请求
          </button>
          <p className="panel-footnote">
            验证码 123456 · 邀请码 PARK2026
            <br />
            跳过只作用于勾选项；文件安全限制仍然保留。
          </p>
        </div>
      )}
      <button
        className="acceptance-trigger"
        aria-expanded={open}
        {...draggable.triggerProps}
        onClick={() => { if (draggable.allowClick()) setOpen(!open); }}
      >
        <Bug size={19} />
        验收工具{skipped.length > 0 && <span>{skipped.length}</span>}
      </button>
    </aside>
  );
}
