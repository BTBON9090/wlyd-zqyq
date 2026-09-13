import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const paths = [
  {
    to: "/onboarding/create",
    title: "创建企业",
    desc: "基本信息、经营信息、协议签署后提交审核。支持证照 OCR、地图选址与电子签。",
    tag: "新企业入驻",
  },
  {
    to: "/onboarding/invite",
    title: "邀请码入驻",
    desc: "验证邀请码后进入四步向导，提交园区运营审核。",
    tag: "邀请码",
  },
  {
    to: "/onboarding/join",
    title: "加入已有企业",
    desc: "先选择省市及园区，再查询该园区企业，填写姓名与角色后提交企业管理员审批。",
    tag: "成员申请",
  },
];

export function OnboardingGuidePage() {
  const { user, hasActiveEnterprise, pendingApplications } = useAuth();

  return (
    <div className="onboard-page">
      <div className="onboard-header">
        <div className="container">
          <span className="onboard-eyebrow">企业入驻</span>
          <h1>您好，{user?.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}</h1>
          {hasActiveEnterprise ? (
            <p>
              您已完成企业入驻，可进入平台使用集采、金融、企服等能力；也可继续关联其他企业。
            </p>
          ) : pendingApplications.length > 0 ? (
            <p>
              您有待审核的入驻申请。通过前暂无平台经营权限，可继续办理其他入驻方式或查看进度。
            </p>
          ) : (
            <p>
              当前为个人账号，<strong>暂无平台功能权限</strong>
              。请选择入驻方式完成企业入驻，审核通过后开通集采、金融、企服等能力。
            </p>
          )}
          {hasActiveEnterprise && (
            <div className="auth-notice auth-notice--ok">
              您已有已入驻企业，可进入平台使用。
              <Link to="/">进入首页 →</Link>
            </div>
          )}
          {pendingApplications.length > 0 && (
            <div className="auth-notice">
              您有 {pendingApplications.length} 条待审核申请。
              <Link to="/onboarding/status">查看进度 →</Link>
            </div>
          )}
        </div>
      </div>

      <div className="container onboard-grid">
        {paths.map((p) => (
          <Link key={p.to} className="onboard-card" to={p.to}>
            <span className="onboard-card__tag">{p.tag}</span>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <span className="onboard-card__cta">开始办理 →</span>
          </Link>
        ))}
      </div>

      <div className="container onboard-footer-tip">
        一个账号可创建或关联<strong>多个企业</strong>
        ，入驻完成后可在顶部切换当前企业。
        {pendingApplications.length > 0 && <Link to="/onboarding/status">查看申请进度</Link>}
      </div>
    </div>
  );
}
