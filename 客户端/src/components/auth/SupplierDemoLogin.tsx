import { MOCK_OTP } from "../../data/enterprises";
import { SUPPLIER_DEMO_ACCOUNTS } from "../../data/supplierDemoAccounts";
import { buildSupplierPortalUrl } from "../../utils/supplierPortal";

/** 登录弹窗内：两个演示账号一键跳转供应商端（已入驻 / 未入驻） */
export function SupplierDemoLogin() {
  return (
    <section className="supplier-demo-login">
      <div className="supplier-demo-login__head">
        <strong>供应商演示账号</strong>
        <span>验证码 {MOCK_OTP} · 点击直达腾讯云供应商端（已入驻 / 未入驻）</span>
      </div>
      <div className="supplier-demo-login__list">
        {SUPPLIER_DEMO_ACCOUNTS.map((item) => (
          <a
            key={item.phone}
            className="supplier-demo-chip supplier-demo-chip--link"
            href={buildSupplierPortalUrl(item.phone, { forceCloud: true })}
            target="_blank"
            rel="noreferrer"
          >
            <b>{item.label}</b>
            <em>{item.hint}</em>
            <span className="supplier-demo-chip__phone">{item.phone} · 打开供应商端</span>
          </a>
        ))}
      </div>
    </section>
  );
}
