import { Link, useParams } from "react-router-dom";
import { DEMO } from "../../lib/config";
export function LegalContent({ type }: { type: string }) {
  return (
    <div className="legal-content">
      {DEMO && (
        <p className="notice">
          以下沿用原型协议用于验收，正式运营文本需由平台确认后替换。
        </p>
      )}
      {type === "privacy" ? (
        <>
          <h3>第一条 信息收集</h3>
          <p>
            为完成注册登录与企业入驻审核，平台可能收集手机号、短信验证码、企业资质及经办人身份信息。
          </p>
          <h3>第二条 使用目的</h3>
          <p>
            上述信息仅用于账号认证、入驻审核、交易履约、风控合规与客户通知。
          </p>
          <h3>第三条 信息保护</h3>
          <p>
            平台按最小必要原则处理个人信息，采取合理安全措施防止泄露、篡改或丢失。
          </p>
          <h3>第四条 您的权利</h3>
          <p>
            您可查询、更正相关个人信息；如拒绝提供必要信息，可能无法完成注册或入驻。
          </p>
        </>
      ) : (
        <>
          <h3>第一条 服务说明</h3>
          <p>
            政企园区 AI
            产服平台（客户端）为园区企业用户提供账号注册、企业入驻、产业服务及相关数字化能力。
          </p>
          <h3>第二条 账号使用</h3>
          <p>
            用户应使用本人真实手机号注册，妥善保管账号与验证码，不得出借、转让或用于违法用途。
          </p>
          <h3>第三条 规范使用</h3>
          <p>用户应保证提交资料真实有效，遵守平台使用规范与园区管理要求。</p>
          <h3>第四条 协议生效</h3>
          <p>用户勾选「我已阅读并同意」即视为接受本协议全部条款。</p>
        </>
      )}
    </div>
  );
}
export default function LegalPage() {
  const { type } = useParams();
  return (
    <div className="container legal-page">
      <Link className="text-link" to="/">
        返回首页
      </Link>
      <h1>{type === "privacy" ? "隐私政策" : "服务协议"}</h1>
      <LegalContent type={type || "service"} />
    </div>
  );
}
