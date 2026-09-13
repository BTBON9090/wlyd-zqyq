import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ParkPicker } from "../../components/ParkPicker";
import { useAuth } from "../../context/AuthContext";
import { findEnterpriseByName, getEnterpriseById, getEnterpriseParks } from "../../data/enterprises";
import { ROLE_LABELS, type EnterpriseRole } from "../../types/auth";

const roles: EnterpriseRole[] = ["purchaser", "finance", "legal", "viewer"];

function enterpriseBelongsToPark(
  enterprise: NonNullable<ReturnType<typeof getEnterpriseById>>,
  parkId: string,
) {
  return enterprise.parkId === parkId || getEnterpriseParks(enterprise).some((p) => p.id === parkId);
}

export function JoinEnterprisePage() {
  const { user, submitJoinEnterprise, resubmitApplication, applications, customEnterprises, selectPark } =
    useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const applicationId = params.get("applicationId");
  const editingApp = useMemo(
    () =>
      applicationId
        ? applications.find((a) => a.id === applicationId && a.status === "rejected" && a.type === "join")
        : undefined,
    [applicationId, applications],
  );
  const presetId = params.get("enterpriseId") ?? editingApp?.enterpriseId ?? "";
  const preset = presetId ? getEnterpriseById(presetId, customEnterprises) : undefined;
  const [parkId, setParkId] = useState(preset?.parkId ?? editingApp?.parkId ?? "");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(presetId ?? "");
  const [displayName, setDisplayName] = useState("");
  const [displayPhone, setDisplayPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<EnterpriseRole>(
    editingApp?.role && editingApp.role !== "admin" ? editingApp.role : "purchaser",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editingApp) return;
    if (editingApp.parkId) {
      setParkId(editingApp.parkId);
      selectPark(editingApp.parkId);
    }
    if (editingApp.enterpriseId) setSelectedId(editingApp.enterpriseId);
    setDisplayName(editingApp.displayName ?? "");
    setDisplayPhone(editingApp.displayPhone ?? user?.phone ?? "");
    if (editingApp.role && editingApp.role !== "admin") setRole(editingApp.role);
    if (editingApp.enterpriseName) {
      setQuery(editingApp.enterpriseName);
      setKeyword(editingApp.enterpriseName);
    }
    setSearched(!!editingApp.enterpriseId);
    // selectPark 仅在园区变化时写入，不作为依赖以免重复初始化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingApp, user?.phone]);

  useEffect(() => {
    if (preset) {
      setParkId(preset.parkId);
      setSelectedId(preset.id);
    }
  }, [preset]);

  useEffect(() => {
    if (user?.phone) setDisplayPhone(user.phone);
  }, [user?.phone]);

  const handleParkChange = (nextParkId: string) => {
    setParkId(nextParkId);
    if (nextParkId) selectPark(nextParkId);
    setSearched(false);
    setKeyword("");
    const current = selectedId ? getEnterpriseById(selectedId, customEnterprises) : undefined;
    if (current && !enterpriseBelongsToPark(current, nextParkId)) {
      setSelectedId("");
    }
  };

  const runSearch = () => {
    setKeyword(query.trim());
    setSearched(true);
    const current = selectedId ? getEnterpriseById(selectedId, customEnterprises) : undefined;
    if (current && parkId && !enterpriseBelongsToPark(current, parkId)) setSelectedId("");
  };

  const results = useMemo(() => {
    if (!parkId || !keyword) return [];
    return findEnterpriseByName(keyword, customEnterprises, parkId);
  }, [keyword, customEnterprises, parkId]);

  const selected = selectedId ? getEnterpriseById(selectedId, customEnterprises) : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!parkId) {
      setError("请先选择省市及园区");
      return;
    }
    if (!selectedId) {
      setError("请选择要加入的企业");
      return;
    }
    if (role === "admin") {
      setError("加入申请不可选择管理员角色");
      return;
    }
    const parkName =
      selected && enterpriseBelongsToPark(selected, parkId)
        ? getEnterpriseParks(selected).find((p) => p.id === parkId)?.name || selected.parkName
        : selected?.parkName;
    const result = editingApp
      ? resubmitApplication(editingApp.id, {
          enterpriseId: selectedId,
          enterpriseName: selected?.name ?? editingApp.enterpriseName,
          uscc: selected?.uscc,
          displayName,
          displayPhone,
          role,
          parkId,
          parkName,
        })
      : submitJoinEnterprise({
          enterpriseId: selectedId,
          displayName,
          displayPhone,
          role,
          parkId,
        });
    if (!result.ok) {
      setError(
        "error" in result && typeof result.error === "string"
          ? result.error
          : "您已提交过该企业的加入申请或已是成员",
      );
      return;
    }
    navigate("/onboarding/status");
  };

  if (applicationId && !editingApp) {
    return (
      <div className="onboard-page">
        <div className="container onboard-form-wrap">
          <div className="auth-notice auth-notice--warn">
            <h3>无法编辑该申请</h3>
            <p>申请不存在或当前状态不可修改。</p>
            <Link to="/onboarding/status" className="btn btn-primary">返回申请进度</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboard-page">
      <div className="container onboard-form-wrap">
        <div className="form-head">
          <Link to={editingApp ? "/onboarding/status" : "/onboarding"} className="form-back">
            ← {editingApp ? "返回申请进度" : "返回入驻引导"}
          </Link>
          <h1>{editingApp ? "修改并重新提交" : "加入已有企业"}</h1>
          <p>
            {editingApp
              ? "请根据驳回原因修改成员信息后重新提交。"
              : "请先选择省市及园区，再查询该园区已入驻企业。提交后由该企业管理员审批，通过后方可加入。"}
          </p>
        </div>

        {editingApp?.reviewNote && (
          <div className="auth-notice auth-notice--warn" style={{ marginBottom: 16 }}>
            <strong>驳回原因</strong>
            <p style={{ marginTop: 6 }}>{editingApp.reviewNote}</p>
          </div>
        )}

        <form className="enterprise-form" onSubmit={handleSubmit}>
          <ParkPicker value={parkId} onChange={handleParkChange} title="选择省市及园区" />
          {parkId && (
            <>
              <section>
                <h3>查询企业</h3>
                <div className="auth-otp-row">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runSearch();
                      }
                    }}
                    placeholder="输入企业名称或统一社会信用代码"
                  />
                  <button type="button" className="btn btn-outline" onClick={runSearch} disabled={!query.trim()}>
                    查询
                  </button>
                </div>

                <div className="enterprise-search-list">
                  {!searched && !selected && (
                    <div className="auth-notice">请输入关键词后点击查询，不会默认列出园区企业。</div>
                  )}
                  {searched && results.length === 0 && (
                    <div className="auth-notice">
                      未找到匹配企业，请更换关键词，或
                      <Link to="/onboarding/create"> 创建企业 </Link>
                    </div>
                  )}
                  {results.map((ent) => (
                    <button
                      key={ent.id}
                      type="button"
                      className={`enterprise-search-item ${selectedId === ent.id ? "on" : ""}`}
                      onClick={() => setSelectedId(ent.id)}
                    >
                      <b>{ent.name}</b>
                      <span>{ent.industry} · {ent.uscc}</span>
                    </button>
                  ))}
                </div>

                {selected && (
                  <div className="auth-notice auth-notice--ok">
                    已选择：{selected.name} · 管理员 {selected.contactName} {selected.contactPhone}
                  </div>
                )}
              </section>

              <section>
                <h3>成员信息</h3>
                <div className="form-grid">
                  <label>
                    <span>您的姓名 *</span>
                    <input
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="在企业中显示的名称"
                    />
                  </label>
                  <label>
                    <span>显示手机号 *</span>
                    <input
                      required
                      value={displayPhone}
                      onChange={(e) => setDisplayPhone(e.target.value)}
                    />
                  </label>
                  <label className="span-2">
                    <span>申请角色 *</span>
                    <select value={role} onChange={(e) => setRole(e.target.value as EnterpriseRole)}>
                      {roles.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <em className="field-hint">管理员仅能由企业现有管理员在成员管理中指定</em>
                  </label>
                </div>
              </section>

              {error && <div className="auth-error">{error}</div>}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={!selectedId}>
                  {editingApp ? "重新提交申请" : "提交申请"}
                </button>
                <Link to={editingApp ? "/onboarding/status" : "/onboarding"} className="btn btn-ghost-dark">
                  取消
                </Link>              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
