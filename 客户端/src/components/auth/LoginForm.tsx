import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NewPasswordFields } from "../PasswordFields";
import { isPasswordValid } from "../../data/password";
import { DEMO_PASSWORD, MOCK_OTP } from "../../data/enterprises";

type Mode = "sms" | "password";
type AgreeDoc = "service" | "privacy";

const LOGIN_AGREEMENTS = {
  service: {
    title: "服务协议",
    body: `第一条 服务说明
政企园区 AI 产服平台（客户端）为园区企业用户提供账号注册、企业入驻、产业服务及相关数字化能力。

第二条 账号使用
用户应使用本人真实手机号注册，妥善保管账号与验证码，不得出借、转让或用于违法用途。

第三条 规范使用
用户应保证提交资料真实有效，遵守平台使用规范与园区管理要求。

第四条 协议生效
用户勾选「我已阅读并同意」即视为接受本协议全部条款。`,
  },
  privacy: {
    title: "隐私政策",
    body: `第一条 信息收集
为完成注册登录与企业入驻审核，平台可能收集手机号、短信验证码、企业资质及经办人身份信息。

第二条 使用目的
上述信息仅用于账号认证、入驻审核、交易履约、风控合规与客户通知。

第三条 信息保护
平台按最小必要原则处理个人信息，采取合理安全措施防止泄露、篡改或丢失。

第四条 您的权利
您可查询、更正相关个人信息；如拒绝提供必要信息，可能无法完成注册或入驻。`,
  },
} as const;

type LoginSuccess = {
  hasActiveEnterprise?: boolean;
  hasPendingApplications?: boolean;
};

type Props = {
  onSuccess?: (result: LoginSuccess) => void;
  compact?: boolean;
};

export function LoginForm({ onSuccess, compact = false }: Props) {
  const { login, passwordLogin, resetPassword, sendOtp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sms");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<AgreeDoc | null>(null);

  const handleSendOtp = () => {
    setError("");
    const result = sendOtp(phone);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
    setOtp(MOCK_OTP);
    setHint(`验证码已发送至 ${phone}`);
    setCountdown(60);
    const timer = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const ensureAgreed = () => {
    if (!agreed) {
      setError("请先阅读并同意《服务协议》和《隐私政策》");
      return false;
    }
    return true;
  };

  const finishLogin = (result: LoginSuccess) => {
    if (onSuccess) {
      onSuccess(result);
      return;
    }
    navigate("/", { replace: true });
  };

  const handleSmsLogin = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!ensureAgreed()) return;
    setLoading(true);
    const result = login(phone, otp);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    finishLogin(result);
  };

  const handlePasswordLogin = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!ensureAgreed()) return;
    setLoading(true);
    const result = passwordLogin(phone, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    finishLogin(result);
  };

  return (
    <>
      <div className={compact ? "auth-card auth-card--modal" : "auth-card"}>
        <h2>注册 / 登录</h2>
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={mode === "sms" ? "on" : undefined}
            onClick={() => {
              setMode("sms");
              setError("");
              setHint("");
            }}
          >
            验证码登录
          </button>
          <button
            type="button"
            className={mode === "password" ? "on" : undefined}
            onClick={() => {
              setMode("password");
              setError("");
              setHint("");
            }}
          >
            密码登录
          </button>
        </div>
        <p className="auth-sub">
          {mode === "sms"
            ? `验证码登录，未注册自动开通。演示验证码：${MOCK_OTP}`
            : `设置密码后可用密码登录。演示密码：${DEMO_PASSWORD}`}
        </p>

        <form
          onSubmit={mode === "sms" ? handleSmsLogin : handlePasswordLogin}
          className="auth-form"
        >
          <label>
            <span>手机号</span>
            <input
              type="tel"
              maxLength={11}
              placeholder="请输入 11 位手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </label>

          {mode === "sms" ? (
            <label>
              <span>短信验证码</span>
              <div className="auth-otp-row">
                <input
                  type="text"
                  maxLength={6}
                  placeholder={`演示验证码 ${MOCK_OTP}`}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={countdown > 0 || phone.length !== 11}
                  onClick={handleSendOtp}
                >
                  {countdown > 0 ? `${countdown}s` : sent ? "重新发送" : "获取验证码"}
                </button>
              </div>
            </label>
          ) : (
            <>
              <label>
                <span>登录密码</span>
                <input
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
              <div className="auth-forgot-row">
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => {
                    setForgotOpen(true);
                    setError("");
                    setHint("");
                  }}
                >
                  忘记密码
                </button>
              </div>
            </>
          )}

          <label className="auth-agree">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (e.target.checked) setError("");
              }}
            />
            <span>
              我已阅读并同意
              <button
                type="button"
                className="auth-agree-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPreviewDoc("service");
                }}
              >
                《服务协议》
              </button>
              和
              <button
                type="button"
                className="auth-agree-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPreviewDoc("privacy");
                }}
              >
                《隐私政策》
              </button>
            </span>
          </label>

          {(error || hint) && (
            <div className={error ? "auth-error" : "auth-hint"}>{error || hint}</div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "登录中…" : mode === "sms" ? "注册 / 登录" : "登录"}
          </button>
        </form>
      </div>

      {forgotOpen && (
        <ForgotPasswordModal
          defaultPhone={phone}
          onClose={() => setForgotOpen(false)}
          onSubmit={(p, code, nextPwd) => {
            const res = resetPassword(p, code, nextPwd);
            if (!res.ok) return res.error;
            setForgotOpen(false);
            setMode("password");
            setPhone(p);
            setPassword("");
            setHint("密码已重置，请使用新密码登录");
            setError("");
            return null;
          }}
        />
      )}

      {previewDoc && (
        <div className="agreement-modal-backdrop" onClick={() => setPreviewDoc(null)}>
          <div
            className="agreement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-agree-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h4 id="login-agree-title">{LOGIN_AGREEMENTS[previewDoc].title}</h4>
              <button
                type="button"
                className="agreement-modal-close"
                aria-label="关闭"
                onClick={() => setPreviewDoc(null)}
              >
                ×
              </button>
            </header>
            <div className="agreement-modal-body">
              <pre>{LOGIN_AGREEMENTS[previewDoc].body}</pre>
            </div>
            <div className="agreement-modal-foot">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setAgreed(true);
                  setPreviewDoc(null);
                  setError("");
                }}
              >
                已阅读并同意
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ForgotPasswordModal({
  defaultPhone,
  onClose,
  onSubmit,
}: {
  defaultPhone: string;
  onClose: () => void;
  onSubmit: (phone: string, smsCode: string, nextPwd: string) => string | null;
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [smsCode, setSmsCode] = useState("");
  const [nextPwd, setNextPwd] = useState("");
  const [nextPwd2, setNextPwd2] = useState("");
  const [msg, setMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-head">
          <h3>忘记密码</h3>
          <button type="button" className="auth-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="auth-modal-desc">验证手机号后设置新密码，完成后返回登录。</p>
        <div className="auth-form">
          <label>
            <span>手机号</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              maxLength={11}
              placeholder="请输入手机号"
            />
          </label>
          <label>
            <span>短信验证码</span>
            <div className="auth-otp-row">
              <input
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                placeholder={`演示码 ${MOCK_OTP}`}
              />
              <button
                type="button"
                className="btn btn-outline"
                disabled={countdown > 0}
                onClick={() => {
                  if (!/^1\d{10}$/.test(phone)) {
                    setMsg("请先填写 11 位手机号");
                    return;
                  }
                  setSmsCode(MOCK_OTP);
                  setMsg(`验证码已发送至 ${phone}`);
                  setCountdown(60);
                  const timer = window.setInterval(() => {
                    setCountdown((c) => {
                      if (c <= 1) {
                        window.clearInterval(timer);
                        return 0;
                      }
                      return c - 1;
                    });
                  }, 1000);
                }}
              >
                {countdown > 0 ? `${countdown}s` : "获取验证码"}
              </button>
            </div>
          </label>
          <NewPasswordFields
            nextPwd={nextPwd}
            nextPwd2={nextPwd2}
            onNextPwd={setNextPwd}
            onNextPwd2={setNextPwd2}
          />
          {msg && <p className="auth-hint">{msg}</p>}
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              if (!isPasswordValid(nextPwd)) {
                setMsg("请按提示完善新密码");
                return;
              }
              if (nextPwd !== nextPwd2) {
                setMsg("两次输入的新密码不一致");
                return;
              }
              const err = onSubmit(phone, smsCode, nextPwd);
              if (err) setMsg(err);
            }}
          >
            确认重置
          </button>
        </div>
      </div>
    </div>
  );
}
