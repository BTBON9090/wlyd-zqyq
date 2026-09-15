import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { ArrowRight, Eye, EyeSlash, ShieldCheck } from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { gateway } from "../../lib/api";
import { DEMO, safeReturn } from "../../lib/config";
import { loginSchema, passwordSchema, phoneSchema } from "../../lib/models";
import { useValidation } from "../../lib/forms";
import { ErrorNotice, Field, Input, Modal } from "../../components/ui";
import { LegalContent } from "./LegalPage";
import { type AuthMode } from "../../app/AppProvider";
import { useDesignVersion } from "../../app/DesignVersion";
const otpTimes = new Map<string, number>();

/**
 * 登录 / 注册 / 重置密码面板。
 * 直接放在弹窗里使用；成功或切换方式都在面板内完成，由 onDone 交给调用方跳转。
 */
export function AuthPanel({
  mode: initialMode = "login",
  returnTo,
  onDone,
}: {
  mode?: AuthMode;
  returnTo?: string;
  onDone?: (target: string) => void;
}) {
  const [current, setCurrent] = useState<AuthMode>(initialMode);
  const { version } = useDesignVersion();
  const isV3 = version === "v3";
  useEffect(() => setCurrent(initialMode), [initialMode]);
  const reset = current === "reset",
    register = current === "register";
  const { setSession, toast, skipped } = useApp();
  const [mode, setMode] = useState<"sms" | "password">("sms");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hint, setHint] = useState("");
  const [legal, setLegal] = useState<"service" | "privacy" | null>(null);
  const [now, setNow] = useState(Date.now());
  const lock = useRef(false);
  const { errors, validate, clear } = useValidation();
  const purpose = reset ? "reset" : register ? "register" : "login";
  const cooldown = Math.max(
    0,
    Math.ceil(((otpTimes.get(`${phone}:${purpose}`) || 0) - now) / 1000),
  );
  const from = safeReturn(returnTo ?? "/");
  const onboarding = from.startsWith("/onboarding");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setError(null);
    setHint("");
    setPassword("");
    setConfirm("");
    setOtp("");
  }, [current]);
  async function sendOtp() {
    if (sending || cooldown) return;
    if (!validate(z.object({ phone: phoneSchema }), { phone })) return;
    setSending(true);
    setError(null);
    try {
      await gateway.otp(phone || "13800000000", purpose);
      otpTimes.set(`${phone}:${purpose}`, Date.now() + 60000);
      setNow(Date.now());
      setHint(
        DEMO
          ? "演示短信已生成，验证码为 123456。未发送真实短信。"
          : `验证码已发送至 ${phone.slice(0, 3)}****${phone.slice(-4)}，5 分钟内有效。`,
      );
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    setError(null);
    const fields = { phone, otp, password, confirm, agreed };
    let schema: z.ZodType = loginSchema;
    if (reset || register) {
      schema = z
        .object({
          phone: phoneSchema,
          otp: z.string().regex(/^\d{6}$/, "请输入 6 位验证码"),
          password: passwordSchema,
          confirm: z.string().min(1, "请再次输入密码"),
          ...(register
            ? {
                agreed: z.literal(true, {
                  error: "请阅读并同意服务协议和隐私政策",
                }),
              }
            : {}),
        })
        .refine((v) => v.password === v.confirm, {
          path: ["confirm"],
          message: "两次输入的密码不一致",
        });
    } else if (mode === "password") {
      schema = z.object({
        phone: phoneSchema,
        password: z.string().min(1, "请输入密码"),
        agreed: z.literal(true, { error: "请阅读并同意服务协议和隐私政策" }),
      });
    }
    if (!validate(schema, fields)) return;
    lock.current = true;
    setPending(true);
    try {
      if (reset) {
        await gateway.reset({ phone, otp, password });
        setSession(null);
        toast("密码已重置，请使用新密码登录");
        setCurrent("login");
        setMode("password");
      } else {
        const user = await gateway.login({
          phone: phone || (skipped.includes("phone") ? "13800000000" : ""),
          otp,
          password,
          agreed,
          mode: register ? "register" : mode,
        });
        setSession(user);
        toast(register ? "账号注册成功" : "登录成功");
        onDone?.(register && from === "/" ? "/onboarding?welcome=1" : from);
      }
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <>
      {onboarding && !reset && (
        <div className="auth-onboarding-context">
          {!isV3 && <span>企业入驻 · 第一步</span>}
          <strong>{isV3 ? "入驻进度" : "先验证账号，再关联企业"}</strong>
          <ol>
            <li className="current">账号验证</li>
            <li>企业资料</li>
            <li>提交审核</li>
          </ol>
        </div>
      )}
      {!reset && !register && (
        <div className="auth-tabs" role="group" aria-label="登录方式">
          <button
            aria-pressed={mode === "sms"}
            onClick={() => {
              setMode("sms");
              setError(null);
            }}
          >
            验证码登录
          </button>
          <button
            aria-pressed={mode === "password"}
            onClick={() => {
              setMode("password");
              setError(null);
            }}
          >
            密码登录
          </button>
        </div>
      )}
      <form noValidate onSubmit={submit}>
        <Input
          id="phone"
          name="phone"
          label="手机号"
          autoComplete="tel-national"
          type="tel"
          inputMode="numeric"
          maxLength={11}
          placeholder="请输入手机号"
          value={phone}
          error={errors.phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, ""));
            clear("phone");
            setHint("");
          }}
        />
        {(mode === "sms" || reset || register) && (
          <Field id="otp" label="短信验证码" error={errors.otp}>
            <div className="input-action">
              <input
                id="otp"
                name="otp"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="请输入 6 位验证码"
                value={otp}
                aria-invalid={!!errors.otp}
                aria-describedby={errors.otp ? "otp-error" : undefined}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  clear("otp");
                }}
              />
              <button
                type="button"
                onClick={sendOtp}
                disabled={sending || cooldown > 0}
              >
                {sending
                  ? "发送中…"
                  : cooldown
                    ? `${cooldown} 秒后重发`
                    : "获取验证码"}
              </button>
            </div>
          </Field>
        )}
        {(mode === "password" || reset || register) && (
          <>
            <Field
              id="password"
              label={reset ? "新密码" : "密码"}
              error={errors.password}
              hint={reset || register ? "8–64 位，包含字母和数字。" : undefined}
            >
              <div className="input-action">
                <input
                  id="password"
                  name="password"
                  autoComplete={
                    reset || register ? "new-password" : "current-password"
                  }
                  type={showPassword ? "text" : "password"}
                  value={password}
                  maxLength={64}
                  placeholder={
                    reset || register ? "设置登录密码" : "请输入密码"
                  }
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password
                      ? "password-error"
                      : reset || register
                        ? "password-hint"
                        : undefined
                  }
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clear("password");
                  }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </Field>
            {(reset || register) && (
              <Input
                id="confirm"
                label="确认密码"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                maxLength={64}
                value={confirm}
                placeholder="请再次输入密码"
                error={errors.confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  clear("confirm");
                }}
              />
            )}
          </>
        )}
        {!reset && !register && mode === "password" && (
          <div className="forgot-password">
            <button
              type="button"
              className="text-link"
              onClick={() => setCurrent("reset")}
            >
              忘记密码？
            </button>
          </div>
        )}
        {!reset && (
          <div className="consent-field">
            <div className="consent">
              <input
                id="agreed"
                type="checkbox"
                checked={agreed}
                aria-invalid={!!errors.agreed}
                aria-describedby={errors.agreed ? "agreed-error" : undefined}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  clear("agreed");
                }}
              />
              <div>
                <label htmlFor="agreed">我已阅读并同意</label>
                <button type="button" onClick={() => setLegal("service")}>
                  《服务协议》
                </button>
                和
                <button type="button" onClick={() => setLegal("privacy")}>
                  《隐私政策》
                </button>
              </div>
            </div>
            {errors.agreed && (
              <p id="agreed-error" className="field-error" role="alert">
                {errors.agreed}
              </p>
            )}
          </div>
        )}
        <ErrorNotice error={error} />
        {hint && (
          <p className="notice success" role="status">
            {hint}
          </p>
        )}
        <button
          className="button primary full-width auth-submit"
          disabled={pending}
        >
          {pending
            ? "正在处理…"
            : reset
              ? "确认重置"
              : register
                ? "注册账号"
                : mode === "sms"
                  ? onboarding
                    ? "验证并继续入驻"
                    : "登录 / 注册"
                  : onboarding
                    ? "登录并继续入驻"
                    : "登录"}
          {!pending && <ArrowRight size={18} />}
        </button>
        {!reset && !register && mode === "sms" && (
          <p className="auth-caption">未注册的手机号，验证后将自动创建账号。</p>
        )}
      </form>
      <div className="auth-switch">
        {reset ? (
          <button
            type="button"
            className="text-link"
            onClick={() => setCurrent("login")}
          >
            返回登录
          </button>
        ) : register ? (
          <>
            已有账号？
            <button
              type="button"
              className="text-link"
              onClick={() => setCurrent("login")}
            >
              立即登录
            </button>
          </>
        ) : (
          <>
            希望设置密码？
            <button
              type="button"
              className="text-link"
              onClick={() => setCurrent("register")}
            >
              注册账号
            </button>
          </>
        )}
      </div>
      {!isV3 && (
        <p className="auth-safe">
          <ShieldCheck size={15} />
          安全连接 · 信息保护
        </p>
      )}
      <Modal
        open={!!legal}
        onOpenChange={(v) => {
          if (!v) setLegal(null);
        }}
        title={legal === "privacy" ? "隐私政策" : "服务协议"}
      >
        <LegalContent type={legal || "service"} />
        <button
          className="button primary full-width"
          onClick={() => setLegal(null)}
        >
          关闭并继续
        </button>
      </Modal>
    </>
  );
}
