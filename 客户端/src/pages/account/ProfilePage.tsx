import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewPasswordFields } from "../../components/PasswordFields";
import { useAuth } from "../../context/AuthContext";
import { MOCK_OTP } from "../../data/enterprises";
import { isPasswordValid } from "../../data/password";

type Modal = "phone" | "password" | "delete" | null;
type PhoneVia = "old_sms" | "password";

export function ProfilePage() {
  const {
    user,
    activeMembership,
    logout,
    changePhone,
    changePassword,
    deleteAccount,
    sendOtp,
  } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // password modal
  const [oldPwd, setOldPwd] = useState("");
  const [nextPwd, setNextPwd] = useState("");
  const [nextPwd2, setNextPwd2] = useState("");
  const [pwdDone, setPwdDone] = useState(false);

  // phone modal
  const [phoneVia, setPhoneVia] = useState<PhoneVia>("old_sms");
  const [oldSms, setOldSms] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSms, setNewSms] = useState("");

  const hasPassword = !!(user?.password || user?.hasPassword);
  const displayName =
    user?.name?.trim() ||
    activeMembership?.displayName?.trim() ||
    user?.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") ||
    "用户";

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2000);
  };

  const close = () => {
    setModal(null);
    setError("");
    setOldPwd("");
    setNextPwd("");
    setNextPwd2("");
    setPwdDone(false);
    setPhoneVia("old_sms");
    setOldSms("");
    setLoginPwd("");
    setNewPhone("");
    setNewSms("");
  };

  const onChangePassword = () => {
    if (hasPassword && !oldPwd) {
      setError("请输入旧密码");
      return;
    }
    if (!isPasswordValid(nextPwd)) {
      setError("请按提示完善新密码");
      return;
    }
    if (nextPwd !== nextPwd2) {
      setError("两次输入的新密码不一致");
      return;
    }
    const res = changePassword(
      hasPassword
        ? { via: "old", oldPwd, nextPwd, confirm: nextPwd2 }
        : { via: "set", nextPwd, confirm: nextPwd2 },
    );
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError("");
    setPwdDone(true);
  };

  const onChangePhone = () => {
    const res = changePhone({
      newPhone,
      via: phoneVia,
      oldSmsCode: phoneVia === "old_sms" ? oldSms : undefined,
      password: phoneVia === "password" ? loginPwd : undefined,
      newSmsCode: newSms,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    close();
    showToast("手机号已更换");
  };

  const onDelete = () => {
    deleteAccount();
    navigate("/login", { replace: true });
  };

  const fillSms = (target: "old" | "new") => {
    const phone = target === "old" ? user?.phone : newPhone;
    if (!phone || !/^1\d{10}$/.test(phone)) {
      setError(target === "old" ? "当前手机号无效" : "请先填写 11 位新手机号");
      return;
    }
    const sent = sendOtp(phone);
    if (!sent.ok) {
      setError(sent.error);
      return;
    }
    if (target === "old") setOldSms(MOCK_OTP);
    else setNewSms(MOCK_OTP);
    setError("");
  };

  return (
    <div className="account-panel">
      <div className="account-panel-head">
        <h1>个人信息</h1>
        <p>账号安全与登录凭证管理</p>
      </div>

      <div className="account-profile-card">
        <div className="account-profile-avatar">{displayName.slice(0, 1)}</div>
        <div className="account-profile-meta">
          <strong>{displayName}</strong>
          <span>绑定手机 {user?.phone ?? "—"}</span>
          <span>注册园区 {user?.registeredParkName ?? "—"}</span>
          <em>{hasPassword ? "已设置登录密码" : "未设置密码 · 当前使用验证码登录"}</em>
        </div>
      </div>

      <div className="account-action-grid">
        <button type="button" className="account-action" onClick={() => setModal("phone")}>
          <b>更换手机号</b>
          <span>原手机验证码或登录密码校验后换绑</span>
        </button>
        <button type="button" className="account-action" onClick={() => setModal("password")}>
          <b>{hasPassword ? "修改密码" : "设置密码"}</b>
          <span>至少 8 位，需包含字母和数字</span>
        </button>
        <button
          type="button"
          className="account-action"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          <b>退出登录</b>
          <span>保留本地账号数据，可用密码再次登录</span>
        </button>
      </div>

      <div className="account-danger-zone">
        <h3>危险操作</h3>
        <p>注销后将清除本地演示账号与企业关联，不可恢复。</p>
        <button type="button" className="btn btn-danger" onClick={() => setModal("delete")}>
          注销账号
        </button>
      </div>

      {modal === "password" && (
        <div className="account-modal" role="dialog">
          <div className="account-modal-card">
            <h3>{hasPassword ? "修改密码" : "设置密码"}</h3>
            {pwdDone ? (
              <>
                <p className="account-success">密码已{hasPassword ? "修改" : "设置"}成功</p>
                <p className="settings-muted">建议使用新密码重新登录，确保账号安全。</p>
                <div className="account-modal-actions">
                  <button type="button" className="btn btn-ghost-dark" onClick={close}>
                    稍后再说
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      close();
                      logout();
                      navigate("/login", { replace: true });
                    }}
                  >
                    重新登录
                  </button>
                </div>
              </>
            ) : (
              <>
                {hasPassword && (
                  <label>
                    旧密码
                    <input
                      type="password"
                      value={oldPwd}
                      onChange={(e) => setOldPwd(e.target.value)}
                      placeholder="请输入当前登录密码"
                    />
                  </label>
                )}
                <NewPasswordFields
                  nextPwd={nextPwd}
                  nextPwd2={nextPwd2}
                  onNextPwd={setNextPwd}
                  onNextPwd2={setNextPwd2}
                />
                {error && <p className="account-form-error">{error}</p>}
                <div className="account-modal-actions">
                  <button type="button" className="btn btn-ghost-dark" onClick={close}>
                    取消
                  </button>
                  <button type="button" className="btn btn-primary" onClick={onChangePassword}>
                    确认{hasPassword ? "修改" : "设置"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modal === "phone" && (
        <div className="account-modal" role="dialog">
          <div className="account-modal-card account-modal-card--wide">
            <h3>更换手机号</h3>
            <label>
              当前手机号
              <input value={user?.phone ?? ""} readOnly />
            </label>
            <div className="auth-mode-tabs auth-mode-tabs--sm">
              <button
                type="button"
                className={phoneVia === "old_sms" ? "on" : undefined}
                onClick={() => {
                  setPhoneVia("old_sms");
                  setError("");
                }}
              >
                原手机可用
              </button>
              <button
                type="button"
                className={phoneVia === "password" ? "on" : undefined}
                disabled={!hasPassword}
                onClick={() => {
                  setPhoneVia("password");
                  setError("");
                }}
              >
                原手机不可用
              </button>
            </div>
            {!hasPassword && (
              <p className="settings-muted">未设置密码时，请使用「原手机可用」方案。</p>
            )}

            {phoneVia === "old_sms" ? (
              <label>
                原手机验证码（{user?.phone}）
                <div className="auth-otp-row">
                  <input
                    value={oldSms}
                    onChange={(e) => setOldSms(e.target.value.replace(/\D/g, ""))}
                    placeholder={`演示码 ${MOCK_OTP}`}
                    maxLength={6}
                  />
                  <button type="button" className="btn btn-outline" onClick={() => fillSms("old")}>
                    获取验证码
                  </button>
                </div>
              </label>
            ) : (
              <label>
                登录密码
                <input
                  type="password"
                  value={loginPwd}
                  onChange={(e) => setLoginPwd(e.target.value)}
                  placeholder="请输入登录密码"
                />
              </label>
            )}

            <label>
              新手机号
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="11 位手机号"
                maxLength={11}
              />
            </label>
            <label>
              新手机验证码
              <div className="auth-otp-row">
                <input
                  value={newSms}
                  onChange={(e) => setNewSms(e.target.value.replace(/\D/g, ""))}
                  placeholder={`演示码 ${MOCK_OTP}`}
                  maxLength={6}
                />
                <button type="button" className="btn btn-outline" onClick={() => fillSms("new")}>
                  获取验证码
                </button>
              </div>
            </label>

            {error && <p className="account-form-error">{error}</p>}
            <div className="account-modal-actions">
              <button type="button" className="btn btn-ghost-dark" onClick={close}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={onChangePhone}>
                确认更换
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "delete" && (
        <div className="account-modal" role="dialog">
          <div className="account-modal-card">
            <h3>确认注销账号？</h3>
            <p>将清除本机演示会话与全部企业关联，此操作不可撤销。</p>
            <div className="account-modal-actions">
              <button type="button" className="btn btn-ghost-dark" onClick={close}>
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                确认注销
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="account-toast">{toast}</div>}
    </div>
  );
}
