import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { UAT, uatRequest } from "../../uat/api";
import { useUat } from "../../uat/UatSessionProvider";
import { ArrowRight, Eye, EyeSlash, ShieldCheck } from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { gateway } from "../../lib/api";
import { DEMO, safeReturn } from "../../lib/config";
import { loginSchema, passwordSchema, phoneSchema } from "../../lib/models";
import { useValidation } from "../../lib/forms";
import { ErrorNotice, Field, Input, Modal } from "../../components/ui";
import { LegalContent, legalTitle } from "./LegalPage";
import { type AuthMode } from "../../app/AppProvider";
import { useDesignVersion } from "../../app/DesignVersion";
const ACCOUNT_LOGIN = UAT || __DEMO__;
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
  const uat = useUat();
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [current, setCurrent] = useState<AuthMode>(initialMode);
  const { commerceVersion: version } = useDesignVersion();
  const isV3 = version === "v3";
  useEffect(() => setCurrent(initialMode), [initialMode]);
  const reset = current === "reset",
    register = current === "register";
  const { session, setSession, toast, skipped } = useApp();
  const authUser = UAT ? uat.user : session ? {username: localStorage.getItem("park-preview-username") || "preview_buyer"} : null;
  const [mode, setMode] = useState<"sms" | "password">(ACCOUNT_LOGIN ? "password" : "sms");
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
    setCurrentPassword("");
    setConfirm("");
    setOtp("");
  }, [current]);
  async function sendOtp() {
    if (ACCOUNT_LOGIN) { setError("当前使用账号密码登录，未接通短信服务。"); return; }
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
    if (ACCOUNT_LOGIN) {
      if (reset && !authUser) { setError("当前未接通短信或邮箱找回。登录后可在个人资料修改密码；无法登录时请联系管理员处理。"); return; }
      const base = { password: z.string().min(12, "密码至少 12 位").max(128, "密码不能超过 128 位") };
      const authSchema = reset ? z.object({ ...base, currentPassword: z.string().min(1, "请输入当前密码"), confirm: z.string().min(1, "请再次输入密码") }).refine(v => v.password === v.confirm, { path: ["confirm"], message: "两次输入的密码不一致" }) : z.object({ ...base, phone: z.string().regex(/^[A-Za-z0-9_.-]{3,40}$/, "用户名为 3–40 位字母、数字、下划线、短横线或点"), agreed: z.literal(true, { error: "请阅读并确认已了解测试使用说明和测试数据说明" }), ...(register ? { displayName: z.string().trim().min(1, "请输入姓名").max(60), confirm: z.string().min(1, "请再次输入密码") } : {}) }).refine(v => !register || v.password === v.confirm, { path: ["confirm"], message: "两次输入的密码不一致" });
      if (!validate(authSchema, { phone: phone.trim(), password, currentPassword, confirm, agreed, displayName })) return;
      lock.current = true; setPending(true);
      try {
        if (reset) {
          await uatRequest("/auth/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword: password }) });
          if(UAT) await uat.refreshSession(); toast("密码已修改"); onDone?.(from);
        } else {
          if(UAT) await uat.authenticate(register ? "register" : "login", { username: phone.trim(), password, ...(register ? { displayName: displayName.trim() } : {}) });
          else if(__DEMO__) setSession(await (await import("../../dev/previewAuth")).authenticatePreview(phone.trim(),password,register ? displayName.trim() : undefined));
          toast(register ? "账号注册成功" : "登录成功");
          onDone?.(register && from === "/" ? "/onboarding?welcome=1" : from);
        }
        setPassword(""); setCurrentPassword(""); setConfirm("");
      } catch (e) { setError(e); } finally { lock.current = false; setPending(false); }
      return;
    }
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
            disabled={ACCOUNT_LOGIN}
            title={ACCOUNT_LOGIN ? "当前使用账号密码登录，未接通短信服务" : undefined}
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
        {__DEMO__ && <button type="button" className="text-button" onClick={() => {setPhone(register ? "preview_" + Date.now().toString(36) : "preview_buyer");setCurrentPassword("DemoPreview123!");setPassword("DemoPreview123!");setConfirm("DemoPreview123!");setDisplayName("演示采购员");setAgreed(true);}}>演示填入</button>}
        <Input
          id="phone"
          name="phone"
          label={ACCOUNT_LOGIN ? "用户名" : "手机号"}
          autoComplete={ACCOUNT_LOGIN ? "username" : "tel-national"}
          type={ACCOUNT_LOGIN ? "text" : "tel"}
          inputMode={ACCOUNT_LOGIN ? "text" : "numeric"}
          maxLength={ACCOUNT_LOGIN ? 40 : 11}
          placeholder={ACCOUNT_LOGIN ? "请输入用户名" : "请输入手机号"}
          value={ACCOUNT_LOGIN && reset ? authUser?.username || phone : phone}
          readOnly={ACCOUNT_LOGIN && reset && !!authUser}
          error={errors.phone}
          onChange={(e) => {
            setPhone(ACCOUNT_LOGIN ? e.target.value : e.target.value.replace(/\D/g, ""));
            clear("phone");
            setHint("");
          }}
        />
        {ACCOUNT_LOGIN && register && <Input id="display-name" label="姓名" autoComplete="name" value={displayName} maxLength={60} error={errors.displayName} onChange={e => { setDisplayName(e.target.value); clear("displayName"); }} placeholder="请输入姓名"/>}
        {ACCOUNT_LOGIN && reset && <><p className="notice">{authUser ? "验证当前密码后可设置新密码。" : "当前未接通短信或邮箱找回。登录后可在个人资料修改密码，无法登录时请联系管理员。"}</p>{authUser && <Input id="current-password" label="当前密码" type="password" autoComplete="current-password" value={currentPassword} maxLength={128} error={errors.currentPassword} onChange={e => { setCurrentPassword(e.target.value); clear("currentPassword"); }}/>}</>}
        {!ACCOUNT_LOGIN && (mode === "sms" || reset || register) && (
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
              hint={reset || register ? (ACCOUNT_LOGIN ? "12–128 位。" : "8–64 位，包含字母和数字。") : undefined}
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
                  maxLength={ACCOUNT_LOGIN ? 128 : 64}
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
                maxLength={ACCOUNT_LOGIN ? 128 : 64}
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
                <label htmlFor="agreed">{ACCOUNT_LOGIN ? "我已阅读并了解" : "我已阅读并同意"}</label>
                <button type="button" onClick={() => setLegal("service")}>
                  《{legalTitle("service")}》
                </button>
                和
                <button type="button" onClick={() => setLegal("privacy")}>
                  《{legalTitle("privacy")}》
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
          disabled={pending || (ACCOUNT_LOGIN && reset && !authUser)}
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
            {ACCOUNT_LOGIN ? "还没有账号？" : "希望设置密码？"}
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
          {ACCOUNT_LOGIN ? "学习测试 · 请使用虚构资料" : "安全连接 · 信息保护"}
        </p>
      )}
      <Modal
        open={!!legal}
        onOpenChange={(v) => {
          if (!v) setLegal(null);
        }}
        title={legalTitle(legal || "service")}
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
