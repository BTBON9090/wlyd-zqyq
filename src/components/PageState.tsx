import { Compass, CloudSlash, LockKey, WifiSlash, ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
const states = {
  "404": { Icon: Compass, title: "这个页面走丢了", description: "页面可能已移动或不再提供。回到首页，继续寻找您需要的企业服务。" },
  "403": { Icon: LockKey, title: "暂时无法访问此页面", description: "当前账号没有访问权限，请确认登录账号，或联系企业管理员。" },
  "500": { Icon: CloudSlash, title: "服务暂时开了个小差", description: "当前页面暂时无法加载，请稍后重新尝试，或返回首页浏览其他服务。" },
  offline: { Icon: WifiSlash, title: "网络连接暂时中断", description: "请检查网络连接后重试，也可以先返回首页。" },
};
export function PageState({ kind = "404" }: { kind?: keyof typeof states }) {
  const { Icon, title, description } = states[kind];
  return <section className="commerce-container page-state" aria-labelledby="page-state-title">
    <div className="page-state-art" aria-hidden="true"><Icon size={80} weight="duotone" /><span>{kind === "offline" ? "OFFLINE" : kind}</span></div>
    <h1 id="page-state-title">{title}</h1><p>{description}</p>
    <div className="page-state-actions"><Link className="button primary" to="/">返回首页 <ArrowRight size={16}/></Link>
      {kind === "500" || kind === "offline" ? <button className="button secondary" onClick={() => window.location.reload()}>重新加载</button> : <Link className="button secondary" to="/services/hall">浏览企业服务</Link>}
    </div>
  </section>;
}
