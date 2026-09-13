import {
  isPasswordValid,
  passwordIssues,
  passwordStrength,
  STRENGTH_LABEL,
} from "../data/password";

type HintProps = {
  password: string;
  confirm?: string;
};

export function PasswordStrengthHint({ password, confirm }: HintProps) {
  const level = passwordStrength(password);
  const issues = password ? passwordIssues(password) : [];
  const mismatch = Boolean(confirm) && confirm !== password;
  const bars = level === "empty" ? 0 : level === "weak" ? 1 : level === "medium" ? 2 : 3;

  if (!password && !confirm) return null;

  return (
    <div className="pwd-hint">
      {password && (
        <>
          <div className="pwd-strength">
            <div className="pwd-strength-bars">
              {[0, 1, 2].map((i) => (
                <i key={i} className={i < bars ? `on on--${level}` : undefined} />
              ))}
            </div>
            {level !== "empty" && (
              <span className={`pwd-strength-label pwd-strength-label--${level}`}>
                强度：{STRENGTH_LABEL[level]}
              </span>
            )}
          </div>
          {issues.length > 0 && <p className="pwd-hint-err">还需：{issues.join("、")}</p>}
          {issues.length === 0 && isPasswordValid(password) && (
            <p className="pwd-hint-ok">密码格式符合要求</p>
          )}
        </>
      )}
      {mismatch && <p className="pwd-hint-err">两次输入的密码不一致</p>}
    </div>
  );
}

type FieldsProps = {
  nextPwd: string;
  nextPwd2: string;
  onNextPwd: (v: string) => void;
  onNextPwd2: (v: string) => void;
};

export function NewPasswordFields({ nextPwd, nextPwd2, onNextPwd, onNextPwd2 }: FieldsProps) {
  return (
    <>
      <label>
        <span>新密码</span>
        <input
          type="password"
          value={nextPwd}
          onChange={(e) => onNextPwd(e.target.value)}
          placeholder="至少 8 位，含字母和数字"
          autoComplete="new-password"
        />
      </label>
      <label>
        <span>确认新密码</span>
        <input
          type="password"
          value={nextPwd2}
          onChange={(e) => onNextPwd2(e.target.value)}
          placeholder="再次输入新密码"
          autoComplete="new-password"
        />
      </label>
      <PasswordStrengthHint password={nextPwd} confirm={nextPwd2} />
    </>
  );
}
