import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { validateInviteCode } from "../../data/enterprises";
import { getParkById } from "../../data/parks";
import { applicationResubmitPath } from "../../types/auth";

export function InviteEnterprisePage() {
  const { applications, selectPark } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const applicationId = params.get("applicationId");
  const editingApp = useMemo(
    () =>
      applicationId
        ? applications.find((a) => a.id === applicationId && a.status === "rejected" && a.type === "invite")
        : undefined,
    [applicationId, applications],
  );
  const [inviteCode, setInviteCode] = useState(editingApp?.inviteCode ?? "");
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    if (!editingApp) return;
    const path = applicationResubmitPath(editingApp);
    if (path) navigate(path, { replace: true });
  }, [editingApp, navigate]);

  const goWizard = (code: string, parkId: string) => {
    selectPark(parkId);
    const q = new URLSearchParams({ inviteCode: code });
    navigate(`/onboarding/create?${q.toString()}`);
  };

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    setCodeError("");
    const result = validateInviteCode(inviteCode);
    if (!result.ok) {
      setCodeError(result.error);
      return;
    }
    const park = getParkById(result.record.parkId);
    if (!park) {
      setCodeError("该邀请码未绑定园区，请联系园区运营");
      return;
    }
    goWizard(result.record.code, park.id);
  };

  if (applicationId && !editingApp) {
    return (
      <div className="onboard-page">
        <div className="container onboard-form-wrap">
          <div className="auth-notice auth-notice--warn">
            <h3>无法编辑该申请</h3>
            <p>申请不存在或当前状态不可修改。</p>
            <Link to="/onboarding/status" className="btn btn-primary">
              返回申请进度
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboard-page">
      <div className="container onboard-form-wrap">
        <div className="form-head">
          <Link to="/onboarding" className="form-back">
            ← 返回入驻引导
          </Link>
          <h1>邀请码入驻</h1>
          <p>验证邀请码后将自动定位园区，随后与创建企业相同，完成四步向导并提交园区运营审核。</p>
        </div>

        <form className="enterprise-form" onSubmit={handleVerify}>
          <section>
            <h3>验证邀请码</h3>
            <label>
              <span>园区邀请码 *</span>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="如 PARK2026-NEW01"
              />
            </label>
            <p className="form-hint">
              演示邀请码：PARK2026-NEW01（杭州未来科技城 · 新企业）· PARK2026-A4B2（临港智造园）
            </p>
            {codeError && <div className="auth-error">{codeError}</div>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                验证并进入入驻向导
              </button>
              <Link to="/onboarding" className="btn btn-ghost-dark">
                取消
              </Link>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
