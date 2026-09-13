export type PasswordStrength = "empty" | "weak" | "medium" | "strong";

export function passwordStrength(pwd: string): PasswordStrength {
  if (!pwd) return "empty";
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[a-zA-Z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

export function passwordIssues(pwd: string): string[] {
  const issues: string[] = [];
  if (pwd.length < 8) issues.push("至少 8 位");
  if (!/[a-zA-Z]/.test(pwd)) issues.push("需包含字母");
  if (!/\d/.test(pwd)) issues.push("需包含数字");
  return issues;
}

export function isPasswordValid(pwd: string) {
  return passwordIssues(pwd).length === 0;
}

export const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  empty: "",
  weak: "弱",
  medium: "中",
  strong: "强",
};

/** 与供应商端一致的演示密码 */
export const DEMO_PASSWORD = "Demo8888";
