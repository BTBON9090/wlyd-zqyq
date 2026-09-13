import { Phone } from "@phosphor-icons/react";
import { Modal } from "../../components/ui";
import { DEMO } from "../../lib/config";
import type { Service } from "../../lib/models";

/**
 * 电话咨询弹窗。
 * 只展示服务商自行发布的名称与号码：不出现「认证」「优选」等平台背书，
 * 也不承诺响应时间或成交结果。演示数据不提供外呼入口，避免拨到原型里的真实号码。
 */
export function ConsultDialog({
  service,
  open,
  onOpenChange,
}: {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const shop = service.published?.shop;
  const phone = shop?.phone?.trim() || "";
  const dialable = phone.replace(/[^\d+]/g, "");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="电话咨询"
      description="号码由服务商在平台发布。报价、交付与售后由您和服务商直接商定，平台不参与双方的交易承诺。"
    >
      <dl className="consult-card">
        <div>
          <dt>服务商</dt>
          <dd>{shop?.name || "未提供"}</dd>
        </div>
        <div>
          <dt>联系电话</dt>
          <dd className="consult-phone">
            {phone || "服务商暂未发布电话号码"}
            {DEMO && phone && (
              <span className="consult-demo-tag">演示号码</span>
            )}
          </dd>
        </div>
      </dl>
      <p className="consult-note">
        {DEMO
          ? "当前为原型示例数据：名称与号码均来自原型，不会真实接通，请勿据此外呼。"
          : "联系前请先核对服务商名称与业务范围，再说明需求；沟通内容与报价以双方确认为准。"}
      </p>
      <div className="consult-actions">
        {!DEMO && dialable && (
          <a className="button primary" href={`tel:${dialable}`}>
            <Phone size={16} weight="fill" />
            拨打该号码
          </a>
        )}
        <button
          type="button"
          className="button secondary"
          onClick={() => onOpenChange(false)}
        >
          {DEMO ? "知道了" : "关闭"}
        </button>
      </div>
    </Modal>
  );
}
