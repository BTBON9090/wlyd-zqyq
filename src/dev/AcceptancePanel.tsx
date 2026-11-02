import {
  ArrowClockwise,
  ArrowSquareOut,
  Bug,
  Check,
  ClipboardText,
  Copy,
  ListChecks,
  Palette,
  Plus,
  SlidersHorizontal,
  Stack,
  Trash,
  UserCircle,
  Warning,
  Wrench,
  X,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../app/AppProvider";
import { demoControls, setDemoSession } from "./mockGateway";
import { useDraggableTool } from "./useDraggableTool";
import "./acceptance.css";

type Tab = "preview" | "onboarding" | "sandbox" | "issues";
type PageState = "ready" | "loading" | "empty" | "error";
type Level = "high" | "mid" | "low";
type Issue = {
  id: string;
  content: string;
  level: Level;
  page: string;
  version: string;
  createdAt: number;
};

const tabs = [
  { id: "preview", label: "页面预览" },
  { id: "onboarding", label: "入驻流程" },
  { id: "sandbox", label: "业务模拟" },
  { id: "issues", label: "问题记录" },
] as const;

const intros: Record<Tab, string> = {
  preview: "切换页面数据状态，仅用于查看演示效果。",
  onboarding: "模拟账号、入驻与表单校验，勾选后对应规则不再拦截提交。",
  sandbox: "直接进入常见业务页面，或制造一次失败请求验证异常路径。",
  issues: "记录验收中发现的问题，自动带上当前页面与版本。",
};

const currentVersion = {
  id: "v4",
  label: "V4 品牌首页",
  desc: "品牌化视觉与统一风格",
};

const pageStates = [
  { id: "ready", label: "有数据" },
  { id: "loading", label: "加载中" },
  { id: "empty", label: "空态" },
  { id: "error", label: "异常" },
] as const;

const roles = [
  { id: "guest", label: "游客" },
  { id: "personal", label: "个人账号" },
  { id: "approved", label: "已认证企业" },
] as const;

const themes = [
  { id: "blue", label: "政企蓝", color: "#2460d2" },
  { id: "teal", label: "生态青", color: "#087f7c" },
  { id: "navy", label: "沉稳靛", color: "#354d8b" },
] as const;

const fieldGroups = [
  {
    title: "登录与注册",
    items: [
      ["phone", "手机号格式"],
      ["otp", "短信验证码"],
      ["password", "密码规则"],
      ["confirm", "重复密码"],
      ["agreed", "协议勾选"],
    ],
  },
  {
    title: "企业入驻",
    items: [
      ["enterprise", "企业名称"],
      ["creditCode", "信用代码"],
      ["file", "营业执照"],
      ["inviteCode", "邀请码"],
      ["enterpriseId", "企业选择"],
    ],
  },
  {
    title: "服务申请",
    items: [
      ["contactName", "联系人"],
      ["title", "需求标题"],
      ["requirement", "需求描述"],
    ],
  },
] as const;

const accountLinks = [
  { label: "售后协商与退款", to: "/account/aftersales" },
  { label: "评价中心", to: "/account/reviews" },
  {
    label: "分期订单详情",
    to: "/account/orders/services?order=86400512891044",
  },
  {
    label: "部分退款订单详情",
    to: "/account/orders/services?order=86400512891050",
  },
] as const;

const errorLinks = [
  { kind: "404", label: "404 页面不存在" },
  { kind: "403", label: "403 无访问权限" },
  { kind: "500", label: "500 服务异常" },
  { kind: "offline", label: "网络异常" },
] as const;

const levelLabels: Record<Level, string> = { high: "高", mid: "中", low: "低" };
const issueKey = "park-acceptance-issues";

function readIssues(): Issue[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(issueKey) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is Issue => {
      if (!item || typeof item !== "object") return false;
      const issue = item as Partial<Issue>;
      return (
        typeof issue.id === "string" &&
        typeof issue.content === "string" &&
        typeof issue.createdAt === "number" &&
        (issue.level === "high" ||
          issue.level === "mid" ||
          issue.level === "low")
      );
    });
  } catch {
    return [];
  }
}

function formatTime(value: number) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const enterpriseUser = {
  id: "demo-enterprise-user",
  phone: "13800000000",
  name: "丁野",
  enterprise: "临港精密制造有限公司",
  enterpriseStatus: "approved" as const,
};
const personalUser = {
  id: "demo-personal-user",
  phone: "13900000000",
  name: "园区用户",
  enterpriseStatus: "none" as const,
};

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="acc-section">
      <div className="acc-section-head">
        <h3>
          {icon}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function AcceptancePanelView() {
  const draggable = useDraggableTool();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("preview");
  const [pageState, setPageState] = useState<PageState>(() =>
    demoControls.delay > 0
      ? "loading"
      : demoControls.fault === "empty"
        ? "empty"
        : demoControls.fault === "error"
          ? "error"
          : "ready",
  );
  const [issues, setIssues] = useState<Issue[]>(readIssues);
  const [draft, setDraft] = useState("");
  const [level, setLevel] = useState<Level>("mid");
  const closeRef = useRef<HTMLButtonElement>(null);
  const { session, skipped, setSkipped, setSession, theme, setTheme, toast } =
    useApp();
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const current = currentVersion;
  const role = !session
    ? "guest"
    : session.enterpriseStatus === "approved"
      ? "approved"
      : "personal";

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(issueKey, JSON.stringify(issues));
    } catch {
      /* 存储被禁用时仅保留内存记录 */
    }
  }, [issues]);

  const applySkipped = (next: string[]) => {
    setSkipped(next);
    demoControls.skipped = next;
  };
  const toggleSkip = (key: string) =>
    applySkipped(
      skipped.includes(key)
        ? skipped.filter((item) => item !== key)
        : [...skipped, key],
    );
  const setGroup = (keys: readonly string[], skip: boolean) =>
    applySkipped(
      skip
        ? Array.from(new Set([...skipped, ...keys]))
        : skipped.filter((key) => !keys.includes(key)),
    );

  const applyPageState = (next: PageState) => {
    demoControls.fault =
      next === "empty" ? "empty" : next === "error" ? "error" : "none";
    demoControls.delay = next === "loading" ? 6000 : 0;
    setPageState(next);
    void client.invalidateQueries();
    if (next === "loading") toast("接口已延迟 6 秒返回，可查看加载态");
  };

  const restoreFaults = () => {
    demoControls.fault = "none";
    demoControls.delay = 0;
    demoControls.failNext = false;
    setPageState("ready");
    void client.invalidateQueries();
    toast("已恢复正常请求");
  };

  const applyRole = (role: (typeof roles)[number]["id"]) => {
    if (role === "guest") {
      setDemoSession(null);
      setSession(null);
      toast("已切换为游客视角");
    } else {
      const user = role === "approved" ? enterpriseUser : personalUser;
      setDemoSession(user);
      setSession(user);
      toast(
        role === "approved" ? "已切换为已认证企业账号" : "已切换为个人账号",
      );
    }
    void client.invalidateQueries();
  };

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const openAccountPage = (path: string) => {
    setDemoSession(enterpriseUser);
    setSession(enterpriseUser);
    demoControls.fault = "none";
    void client.invalidateQueries({ queryKey: ["account-commerce"] });
    go(path);
  };

  const openEmptyPage = (path: string, account: boolean) => {
    demoControls.fault = "empty";
    demoControls.delay = 0;
    setPageState("empty");
    if (account) {
      setDemoSession(enterpriseUser);
      setSession(enterpriseUser);
      void client.invalidateQueries({ queryKey: ["account-commerce"] });
    } else {
      void client.invalidateQueries({ queryKey: ["services"] });
    }
    go(path);
  };

  const addIssue = () => {
    const content = draft.trim();
    if (!content) return;
    setIssues([
      {
        id: crypto.randomUUID(),
        content,
        level,
        page: `${location.pathname}${location.search}`,
        version: current.id.toUpperCase(),
        createdAt: Date.now(),
      },
      ...issues,
    ]);
    setDraft("");
    toast("已记录问题");
  };

  const copyIssues = async () => {
    const text = issues
      .map(
        (issue) =>
          `- [${levelLabels[issue.level]}] ${issue.content}（${issue.page || "/"} · ${issue.version} · ${formatTime(issue.createdAt)}）`,
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast(`已复制 ${issues.length} 条问题记录`);
    } catch {
      toast("复制失败，请手动选择文本");
    }
  };

  const resetAll = () => {
    applySkipped([]);
    demoControls.fault = "none";
    demoControls.delay = 0;
    demoControls.failNext = false;
    setPageState("ready");
    setDemoSession(null);
    setSession(null);
    setTheme("blue");
    void client.invalidateQueries();
    if (window.location.pathname.includes("/__preview/"))
      navigate("/services/hall");
    toast("已恢复默认演示状态");
  };

  return (
    <>
      <aside
        ref={draggable.ref}
        style={draggable.style}
        className="acceptance-panel"
        aria-label="验收工具"
      >
        {open && (
          <div className="acc-drawer" role="region" aria-label="验收工具面板">
            <header className="acc-head">
              <div className="acc-title">
                <span className="acc-title-icon">
                  <Wrench size={17} weight="bold" />
                </span>
                <div>
                  <strong>验收工具</strong>
                  <small>仅本地演示生效，不发送真实短信或订单</small>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="acc-icon"
                onClick={() => setOpen(false)}
                aria-label="关闭验收工具"
              >
                <X size={16} />
              </button>
            </header>

            <div className="acc-tabs" role="tablist" aria-label="验收工具分类">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`acc-tab-${item.id}`}
                  aria-selected={tab === item.id}
                  aria-controls={`acc-panel-${item.id}`}
                  className={`acc-tab${tab === item.id ? " is-active" : ""}`}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                  {item.id === "issues" && issues.length > 0 && (
                    <span className="acc-tab-badge">{issues.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div
              className="acc-body"
              role="tabpanel"
              id={`acc-panel-${tab}`}
              aria-labelledby={`acc-tab-${tab}`}
            >
              <p className="acc-intro">{intros[tab]}</p>

              {tab === "preview" && (
                <>
                  <Section icon={<Stack size={14} />} title="首页方案">
                    <div className="acc-version is-active is-static">
                      <span className="acc-version-dot" />
                      <span className="acc-version-text">
                        <strong>{current.label}</strong>
                        <small>{current.desc}，当前唯一方案</small>
                      </span>
                      <Check
                        size={15}
                        weight="bold"
                        className="acc-version-check"
                      />
                    </div>
                  </Section>

                  <Section
                    icon={<SlidersHorizontal size={14} />}
                    title="页面状态"
                  >
                    <div className="acc-seg" role="group" aria-label="页面状态">
                      {pageStates.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={pageState === item.id ? "is-active" : ""}
                          aria-pressed={pageState === item.id}
                          onClick={() => applyPageState(item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <p className="acc-hint">
                      切换后立即刷新列表请求；「加载中」会让接口延迟 6
                      秒返回，用来看骨架屏。
                    </p>
                  </Section>

                </>
              )}

              {tab === "onboarding" && (
                <>
                  <Section icon={<UserCircle size={14} />} title="账号视角">
                    <div className="acc-seg" role="group" aria-label="账号视角">
                      {roles.map((item) => {
                        const active = role === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={active ? "is-active" : ""}
                            aria-pressed={active}
                            onClick={() => applyRole(item.id)}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="acc-hint">
                      游客可浏览全部服务；已认证企业可查看订单、售后与评价；个人账号适合验证入驻流程。
                    </p>
                  </Section>

                  <Section
                    icon={<ListChecks size={14} />}
                    title="跳过表单校验"
                    action={
                      <span className="acc-section-action">
                        <span className="acc-count">
                          已跳过 {skipped.length} 项
                        </span>
                        {skipped.length > 0 && (
                          <button
                            type="button"
                            className="acc-text"
                            onClick={() => applySkipped([])}
                          >
                            恢复全部
                          </button>
                        )}
                      </span>
                    }
                  >
                    {fieldGroups.map((group) => {
                      const keys = group.items.map(([key]) => key);
                      const count = keys.filter((key) =>
                        skipped.includes(key),
                      ).length;
                      return (
                        <div className="acc-group" key={group.title}>
                          <div className="acc-group-head">
                            <strong>
                              {group.title}
                              <span className="acc-count">
                                {count}/{keys.length}
                              </span>
                            </strong>
                            <button
                              type="button"
                              className="acc-text"
                              onClick={() =>
                                setGroup(keys, count !== keys.length)
                              }
                            >
                              {count === keys.length ? "恢复本组" : "全部跳过"}
                            </button>
                          </div>
                          <div className="acc-chips">
                            {group.items.map(([key, label]) => (
                              <button
                                key={key}
                                type="button"
                                className={`acc-chip${skipped.includes(key) ? " is-on" : ""}`}
                                aria-pressed={skipped.includes(key)}
                                onClick={() => toggleSkip(key)}
                              >
                                {skipped.includes(key) && (
                                  <Check size={12} weight="bold" />
                                )}
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <p className="acc-hint">
                      跳过只影响必填与格式校验，文件类型、大小限制与接口错误提示仍然生效。
                    </p>
                  </Section>

                  <Section icon={<ArrowSquareOut size={14} />} title="快捷入口">
                    <div className="acc-links">
                      <button
                        type="button"
                        className="acc-link"
                        onClick={() => go("/onboarding")}
                      >
                        打开入驻向导
                        <ArrowSquareOut size={13} />
                      </button>
                      <button
                        type="button"
                        className="acc-link"
                        onClick={() => go("/services/hall")}
                      >
                        企业服务大厅
                        <ArrowSquareOut size={13} />
                      </button>
                    </div>
                    <p className="acc-hint">
                      演示验证码 123456 · 演示邀请码 PARK2026
                    </p>
                  </Section>
                </>
              )}

              {tab === "sandbox" && (
                <>
                  <Section icon={<Palette size={14} />} title="主题预览">
                    <div className="acc-themes">
                      {themes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`acc-theme${theme === item.id ? " is-active" : ""}`}
                          aria-pressed={theme === item.id}
                          onClick={() => setTheme(item.id)}
                        >
                          <i style={{ background: item.color }} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section icon={<ArrowSquareOut size={14} />} title="快捷场景">
                    <div className="acc-link-group">
                      <span>个人中心 · 已认证企业</span>
                      <div className="acc-links">
                        {accountLinks.map((item) => (
                          <button
                            key={item.to}
                            type="button"
                            className="acc-link"
                            onClick={() => openAccountPage(item.to)}
                          >
                            {item.label}
                            <ArrowSquareOut size={13} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="acc-link-group">
                      <span>服务与详情</span>
                      <div className="acc-links">
                        <button
                          type="button"
                          className="acc-link"
                          onClick={() => go("/services/x1-name")}
                        >
                          详情目录与图片切换
                          <ArrowSquareOut size={13} />
                        </button>
                        <button
                          type="button"
                          className="acc-link"
                          onClick={() => openEmptyPage("/services/hall", false)}
                        >
                          空态服务大厅
                          <ArrowSquareOut size={13} />
                        </button>
                        <button
                          type="button"
                          className="acc-link"
                          onClick={() =>
                            openEmptyPage("/account/orders/services", true)
                          }
                        >
                          空态订单列表
                          <ArrowSquareOut size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="acc-link-group">
                      <span>异常页面</span>
                      <div className="acc-links">
                        {errorLinks.map((item) => (
                          <button
                            key={item.kind}
                            type="button"
                            className="acc-link"
                            onClick={() => go(`/__preview/${item.kind}`)}
                          >
                            {item.label}
                            <ArrowSquareOut size={13} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </Section>

                  <Section
                    icon={<Warning size={14} />}
                    title="异常模拟"
                    action={
                      <button
                        type="button"
                        className="acc-text"
                        onClick={restoreFaults}
                      >
                        <ArrowClockwise size={12} />
                        恢复正常
                      </button>
                    }
                  >
                    <div className="acc-note-row">
                      <div>
                        <strong>下一次操作失败</strong>
                        <small>
                          只在下次提交时失败一次，已填写内容会保留，用于验证重试路径。
                        </small>
                      </div>
                      <button
                        type="button"
                        className="acc-mini"
                        onClick={() => {
                          demoControls.failNext = true;
                          toast("下一次接口操作将模拟失败");
                        }}
                      >
                        触发
                      </button>
                    </div>
                  </Section>
                </>
              )}

              {tab === "issues" && (
                <Section icon={<ClipboardText size={14} />} title="问题记录">
                  <div className="acc-issue-form">
                    <input
                      value={draft}
                      maxLength={120}
                      placeholder="例如：订单卡片金额与状态错位"
                      aria-label="问题内容"
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") addIssue();
                      }}
                    />
                    <select
                      value={level}
                      aria-label="问题等级"
                      onChange={(event) =>
                        setLevel(event.target.value as Level)
                      }
                    >
                      <option value="high">高</option>
                      <option value="mid">中</option>
                      <option value="low">低</option>
                    </select>
                    <button
                      type="button"
                      className="acc-mini acc-mini-primary"
                      disabled={!draft.trim()}
                      onClick={addIssue}
                    >
                      <Plus size={12} weight="bold" />
                      记录
                    </button>
                  </div>
                  <p className="acc-hint">
                    自动附带：{location.pathname}
                    {location.search} · {current.label}
                  </p>
                  {issues.length > 0 ? (
                    <>
                      <ul className="acc-issues">
                        {issues.map((issue) => (
                          <li className="acc-issue" key={issue.id}>
                            <div className="acc-issue-meta">
                              <span
                                className={`acc-level acc-level-${issue.level}`}
                              >
                                {levelLabels[issue.level]}
                              </span>
                              <span className="acc-issue-page">
                                {issue.page || "/"} · {issue.version}
                              </span>
                              <span className="acc-issue-time">
                                {formatTime(issue.createdAt)}
                              </span>
                              <button
                                type="button"
                                className="acc-icon acc-issue-del"
                                aria-label="删除这条记录"
                                onClick={() =>
                                  setIssues(
                                    issues.filter(
                                      (item) => item.id !== issue.id,
                                    ),
                                  )
                                }
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                            <p>{issue.content}</p>
                          </li>
                        ))}
                      </ul>
                      <div className="acc-issue-actions">
                        <button
                          type="button"
                          className="acc-mini"
                          onClick={copyIssues}
                        >
                          <Copy size={12} />
                          复制全部
                        </button>
                        <button
                          type="button"
                          className="acc-mini"
                          onClick={() => setIssues([])}
                        >
                          <Trash size={12} />
                          清空
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="acc-empty">
                      还没有记录。验收时随手记下问题，可一键复制给开发。
                    </p>
                  )}
                </Section>
              )}
            </div>

            <footer className="acc-foot">
              <span className="acc-foot-meta">
                {current.label} ·{" "}
                {pageStates.find((item) => item.id === pageState)?.label}
                {skipped.length > 0 ? ` · 跳过 ${skipped.length} 项` : ""}
              </span>
              <button type="button" className="acc-text" onClick={resetAll}>
                <ArrowClockwise size={12} />
                重置演示
              </button>
            </footer>
          </div>
        )}
        <button
          type="button"
          className={`acceptance-trigger${skipped.length > 0 || pageState !== "ready" ? " is-dirty" : ""}`}
          aria-expanded={open}
          aria-label="打开验收工具"
          {...draggable.triggerProps}
          onClick={() => {
            if (draggable.allowClick()) setOpen(!open);
          }}
        >
          <Bug size={16} weight="fill" />
          <span>验收工具</span>
          {skipped.length > 0 && <b>{skipped.length}</b>}
        </button>
      </aside>
    </>
  );
}

export default function AcceptancePanel() {
  return <AcceptancePanelView />;
}
