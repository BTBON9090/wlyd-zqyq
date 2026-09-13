import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { categories } from "../../data/categories";
import { gateway } from "../../lib/api";
import { DEMO } from "../../lib/config";
import type { Receipt } from "../../lib/models";
import { EmptyState, ErrorNotice, Input, Modal } from "../../components/ui";
import { Breadcrumb } from "../../components/Shell";
const groups = [
  {
    label: "我的账号",
    items: [
      ["/account", "个人中心"],
      ["/account/enterprise", "企业档案"],
      ["/account/profile", "个人信息与安全"],
    ],
  },
  {
    label: "交易与服务",
    items: [
      ["/account/orders/procurement", "集采订单"],
      ["/account/orders/finance", "金融服务记录"],
      ["/account/orders/services", "企业服务订单"],
      ["/account/demands", "我的需求"],
      ["/account/orders/demand", "接单记录"],
    ],
  },
  {
    label: "企业管理",
    items: [
      ["/account/settings/members", "成员管理"],
      ["/account/settings/roles", "角色权限"],
    ],
  },
];
const statuses = {
  submitted: "待联系",
  contacting: "沟通中",
  closed: "已结束",
};
const identity = {
  none: "未入驻",
  pending: "审核中",
  approved: "已认证",
  rejected: "待补充资料",
};
const phoneMask = (v: string) => v.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
export default function AccountPage() {
  const { session, loading, authError, setSession, logout, toast, openAuth } =
    useApp();
  const location = useLocation();
  const path = location.pathname;
  const title =
    groups.flatMap((g) => g.items).find((i) => i[0] === path)?.[1] ||
    "个人中心";
  const receipts = useQuery({
    queryKey: ["receipts", session?.id],
    queryFn: gateway.receipts,
    enabled: !!session,
    retry: false,
  });
  const demands = useQuery({
    queryKey: ["demands", session?.id],
    queryFn: gateway.demands,
    enabled: !!session,
    retry: false,
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [record, setRecord] = useState<Receipt | null>(null);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const visible = (receipts.data || []).filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      [r.serviceName, r.id].join(" ").includes(search.trim()),
  );
  async function saveName(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (name.trim().length < 2 || name.trim().length > 30) {
      setError(new Error("姓名需为 2–30 个字"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      setSession(await gateway.updateProfile(name.trim()));
      setEdit(false);
      toast("个人信息已保存");
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  function receiptList(limit?: number) {
    return receipts.isPending ? (
      <p className="section-empty">正在加载服务记录…</p>
    ) : receipts.isError ? (
      <EmptyState
        error
        title="服务记录暂时无法加载"
        description={receipts.error.message}
        action="重试"
        onAction={() => void receipts.refetch()}
      />
    ) : !visible.length ? (
      <div className="account-empty">
        <span>暂无服务记录</span>
        <p>选择服务并提交需求后，可在这里查看办理状态。</p>
        <Link className="button secondary" to="/services/hall">
          去找服务 <ArrowRight size={14} />
        </Link>
      </div>
    ) : (
      <div className="table-scroll">
        <table className="commerce-table account-orders">
          <thead>
            <tr>
              <th>服务 / 申请编号</th>
              <th>规格</th>
              <th>提交时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {visible.slice(0, limit ?? visible.length).map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/services/${r.serviceId}`}>{r.serviceName}</Link>
                  <small>{r.id}</small>
                </td>
                <td>
                  {r.versionName || "需求沟通"}
                  <small>数量 {r.quantity || 1}</small>
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString("zh-CN")}</td>
                <td>
                  <span className="status-tag">{statuses[r.status]}</span>
                </td>
                <td>
                  <button className="text-link" onClick={() => setRecord(r)}>
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  const panelTitle = (name: string, link?: string) => (
    <div className="account-panel-title">
      <h2>{name}</h2>
      {link && (
        <Link to={link}>
          查看全部 <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
  return (
    <div className="commerce-container account-v2">
      <Breadcrumb
        items={[
          {
            label: "个人中心",
            to: path !== "/account" ? "/account" : undefined,
          },
          ...(path !== "/account" ? [{ label: title }] : []),
        ]}
      />
      <div className="account-layout">
        <aside className="account-sidebar">
          <div className="account-sidebar-brand">
            <span>ACCOUNT</span>
            <strong>我的园区</strong>
          </div>
          {groups.map((g) => (
            <nav key={g.label} aria-label={g.label}>
              <h2>{g.label}</h2>
              {g.items.map(([to, name]) => (
                <NavLink to={to} end key={to}>
                  {name}
                  <span>›</span>
                </NavLink>
              ))}
            </nav>
          ))}
        </aside>
        <main className="account-main">
          {loading ? (
            <div className="account-panel">
              <p className="section-empty">正在读取账号信息…</p>
            </div>
          ) : !session ? (
            <section className="account-panel account-guest">
              <span className="section-kicker">我的园区 · 服务随行</span>
              <h1>登录后，掌握每一项业务进展</h1>
              <p>统一查看企业身份、服务申请与需求记录，让企业事务井然有序。</p>
              <ErrorNotice error={authError} />
              <button
                type="button"
                className="button primary"
                onClick={() => openAuth({ returnTo: path })}
              >
                登录 / 注册 <ArrowRight size={16} />
              </button>
              <div className="account-guest-features">
                <span>企业资料集中管理</span>
                <span>申请进度随时查看</span>
                <span>账号安全便捷设置</span>
              </div>
            </section>
          ) : (
            <>
              <section className="account-identity">
                <div className="account-monogram">
                  {session.name.slice(0, 1)}
                </div>
                <div>
                  <span>欢迎回来</span>
                  <h1>{session.name}</h1>
                  <p>
                    {phoneMask(session.phone)}
                    <i /> {session.enterprise || "个人账号 · 尚未关联企业"}
                  </p>
                </div>
                <div className="account-identity-action">
                  <span className="status-tag">
                    {identity[session.enterpriseStatus]}
                  </span>
                  <Link
                    to={
                      session.enterpriseStatus === "none"
                        ? "/onboarding"
                        : "/account/enterprise"
                    }
                  >
                    {session.enterpriseStatus === "none"
                      ? "办理企业入驻"
                      : "查看企业档案"}{" "}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </section>
              {path === "/account" ? (
                <>
                  <div className="account-stat-grid">
                    {[
                      [
                        "服务申请",
                        receipts.data?.length,
                        "/account/orders/services",
                      ],
                      [
                        "待商家联系",
                        receipts.data?.filter((r) => r.status === "submitted")
                          .length,
                        "/account/orders/services",
                      ],
                      ["已发布需求", demands.data?.length, "/account/demands"],
                      [
                        "进行中",
                        receipts.data?.filter((r) => r.status === "contacting")
                          .length,
                        "/account/orders/services",
                      ],
                    ].map(([label, count, to]) => (
                      <Link key={label} to={String(to)}>
                        <span>{label}</span>
                        <strong>{count ?? "—"}</strong>
                        <ArrowRight size={16} />
                      </Link>
                    ))}
                  </div>
                  <section className="account-panel">
                    {panelTitle("常用功能")}
                    <div className="account-shortcuts">
                      {[
                        [
                          "发布服务需求",
                          "描述业务，寻找专业支持",
                          "/services?publish=1",
                        ],
                        [
                          "寻找企业服务",
                          "比较规格，选择合适方案",
                          "/services/hall",
                        ],
                        [
                          "完善企业档案",
                          "关联企业，查看审核进度",
                          "/account/enterprise",
                        ],
                        [
                          "账号安全设置",
                          "管理个人资料与登录密码",
                          "/account/profile",
                        ],
                      ].map(([name, desc, to], i) => (
                        <Link key={to} to={to}>
                          <span>0{i + 1}</span>
                          <div>
                            <strong>{name}</strong>
                            <p>{desc}</p>
                          </div>
                          <ArrowRight size={15} />
                        </Link>
                      ))}
                    </div>
                  </section>
                  <section className="account-panel">
                    {panelTitle("最近的服务申请", "/account/orders/services")}
                    {receiptList(4)}
                  </section>
                </>
              ) : path === "/account/profile" ? (
                <section className="account-panel">
                  {panelTitle("个人信息与安全")}
                  <div className="account-settings-row">
                    <div>
                      <strong>个人姓名</strong>
                      <p>{session.name}</p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setName(session.name);
                        setError(null);
                        setEdit(true);
                      }}
                    >
                      编辑资料
                    </button>
                  </div>
                  <div className="account-settings-row">
                    <div>
                      <strong>绑定手机号</strong>
                      <p>{phoneMask(session.phone)} · 用于登录验证与服务联系</p>
                    </div>
                    <span className="muted">更换手机号请联系平台</span>
                  </div>
                  <div className="account-settings-row">
                    <div>
                      <strong>登录密码</strong>
                      <p>通过手机验证，设置或重置登录密码</p>
                    </div>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() =>
                        openAuth({
                          mode: "reset",
                          returnTo: "/account/profile",
                        })
                      }
                    >
                      重置密码
                    </button>
                  </div>
                  <div className="account-settings-row">
                    <div>
                      <strong>退出当前账号</strong>
                      <p>退出后可重新登录或切换其他账号</p>
                    </div>
                    <button
                      disabled={pending}
                      className="button secondary"
                      onClick={async () => {
                        setPending(true);
                        setError(null);
                        try {
                          await logout();
                        } catch (e) {
                          setError(e);
                        } finally {
                          setPending(false);
                        }
                      }}
                    >
                      {pending ? "正在退出…" : "退出登录"}
                    </button>
                  </div>
                  <ErrorNotice error={error} />
                </section>
              ) : path === "/account/enterprise" ? (
                <section className="account-panel">
                  {panelTitle("企业档案")}
                  <div className="enterprise-profile">
                    <span className="section-kicker">企业身份</span>
                    <h2>{session.enterprise || "关联您的企业"}</h2>
                    <p>
                      {session.enterpriseStatus === "none"
                        ? "新建企业、申请加入已有企业，或通过邀请码快速关联。"
                        : session.enterpriseStatus === "pending"
                          ? "入驻申请已提交，审核结果将在此更新。"
                          : session.enterpriseStatus === "rejected"
                            ? session.reviewNote || "请完善资料后重新提交申请。"
                            : "企业已完成入驻，您可以继续办理企业服务。"}
                    </p>
                    <dl className="receipt-summary">
                      <div>
                        <dt>企业状态</dt>
                        <dd>{identity[session.enterpriseStatus]}</dd>
                      </div>
                      <div>
                        <dt>关联账号</dt>
                        <dd>{phoneMask(session.phone)}</dd>
                      </div>
                      {session.applicationId && (
                        <div>
                          <dt>申请编号</dt>
                          <dd>{session.applicationId}</dd>
                        </div>
                      )}
                    </dl>
                    <Link className="button primary" to="/onboarding">
                      {session.enterpriseStatus === "none"
                        ? "选择入驻方式"
                        : session.enterpriseStatus === "rejected"
                          ? "补充入驻资料"
                          : "查看入驻结果"}{" "}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </section>
              ) : path === "/account/orders/services" ? (
                <section className="account-panel">
                  {panelTitle("企业服务订单")}
                  <div className="account-order-note">
                    当前展示已提交的服务申请；付款订单将在交易能力接入后开放。
                  </div>
                  <div className="account-order-filters">
                    <div>
                      {[
                        ["all", "全部申请"],
                        ["submitted", "待联系"],
                        ["contacting", "沟通中"],
                        ["closed", "已结束"],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          aria-pressed={filter === id}
                          onClick={() => setFilter(id)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <input
                      aria-label="搜索服务申请"
                      placeholder="服务名称 / 申请编号"
                      value={search}
                      maxLength={100}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  {receiptList()}
                </section>
              ) : path === "/account/demands" ? (
                <section className="account-panel">
                  {panelTitle("我的需求")}
                  <div className="account-order-note">
                    查看您发布的需求，记录业务目标与交付要求。
                    <Link to="/services?publish=1">发布新需求 →</Link>
                  </div>
                  {demands.isPending ? (
                    <p className="section-empty">正在加载需求…</p>
                  ) : demands.isError ? (
                    <EmptyState
                      error
                      title="需求加载失败"
                      action="重试"
                      onAction={() => void demands.refetch()}
                    />
                  ) : demands.data?.length ? (
                    demands.data.map((d) => (
                      <article className="account-demand" key={d.id}>
                        <div>
                          <span>
                            {categories.find((c) => c.id === d.category)
                              ?.label || d.category}
                          </span>
                          <span className="status-tag">
                            {d.status === "published" ? "已发布" : "已关闭"}
                          </span>
                        </div>
                        <h3>{d.title}</h3>
                        <p className="preserve-lines">{d.requirement}</p>
                        <footer>
                          <span>预算：{d.budget || "沟通确认"}</span>
                          <span>
                            {new Date(d.createdAt).toLocaleDateString("zh-CN")}{" "}
                            · {d.id}
                          </span>
                        </footer>
                      </article>
                    ))
                  ) : (
                    <div className="account-empty">
                      <span>还没有发布需求</span>
                      <p>服务范围、预算与交付时间，是商家了解需求的起点。</p>
                      <Link
                        className="button secondary"
                        to="/services?publish=1"
                      >
                        发布第一条需求
                      </Link>
                    </div>
                  )}
                </section>
              ) : (
                <section className="account-panel">
                  {panelTitle(title)}
                  <div className="account-empty">
                    <span>
                      {path.includes("settings")
                        ? "企业管理功能待开放"
                        : "暂无可展示的记录"}
                    </span>
                    <p>
                      {path.includes("settings")
                        ? "成员与角色权限需要企业授权，由企业管理模块接入后提供。"
                        : "此业务模块尚未接入记录查询，后续将在这里集中展示。"}
                    </p>
                    <Link
                      className="button secondary"
                      to={
                        path.includes("procurement")
                          ? "/procurement"
                          : path.includes("finance")
                            ? "/finance"
                            : "/account"
                      }
                    >
                      {path.includes("settings") || path.includes("demand")
                        ? "返回个人中心"
                        : "前往业务专区"}{" "}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </section>
              )}
              {DEMO && (
                <p className="account-demo-note">
                  演示账号与记录仅保存在当前浏览器，不代表真实交易。
                </p>
              )}
            </>
          )}
        </main>
      </div>
      <Modal
        open={edit}
        onOpenChange={(v) => {
          if (!pending) setEdit(v);
        }}
        title="编辑个人资料"
      >
        <form onSubmit={saveName}>
          <Input
            id="profile-name"
            label="姓名"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
          />
          <ErrorNotice error={error} />
          <button disabled={pending} className="button primary full-width">
            {pending ? "正在保存…" : "保存资料"}
          </button>
        </form>
      </Modal>
      <Modal
        open={!!record}
        onOpenChange={(v) => {
          if (!v) setRecord(null);
        }}
        title="服务申请详情"
        description={record?.id}
      >
        {record && (
          <>
            <dl className="receipt-summary">
              <div>
                <dt>申请服务</dt>
                <dd>{record.serviceName}</dd>
              </div>
              <div>
                <dt>服务规格</dt>
                <dd>
                  {record.versionName || "沟通确认"} × {record.quantity || 1}
                </dd>
              </div>
              <div>
                <dt>当前进度</dt>
                <dd>{statuses[record.status]}</dd>
              </div>
              <div>
                <dt>联系人</dt>
                <dd>
                  {record.contactName} · {phoneMask(record.phone)}
                </dd>
              </div>
            </dl>
            <h3>需求描述</h3>
            <p className="preserve-lines">{record.requirement}</p>
            <Link
              className="button secondary"
              to={`/services/${record.serviceId}`}
            >
              查看服务详情 <ArrowRight size={14} />
            </Link>
          </>
        )}
      </Modal>
    </div>
  );
}
