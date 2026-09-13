import type { AuthMode } from "../../app/AppProvider";

/** 登录弹窗外壳的标题与说明，与面板内容一一对应。 */
export function authCopy(mode: AuthMode, onboarding: boolean) {
  if (mode === "reset")
    return {
      title: "重置登录密码",
      description: "验证手机号后，设置一个新的密码。",
    };
  if (mode === "register")
    return {
      title: "创建您的账号",
      description: "创建您的账号，开启园区企业服务。",
    };
  if (onboarding)
    return {
      title: "登录后继续入驻",
      description: "验证完成后，将自动进入企业入驻页面。",
    };
  return {
    title: "登录 / 注册",
    description: "一个账号，连接园区的专业服务与产业资源。",
  };
}
