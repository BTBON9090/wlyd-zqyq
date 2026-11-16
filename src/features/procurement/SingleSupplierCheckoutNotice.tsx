import { Modal } from "../../components/ui";

export function SingleSupplierCheckoutNotice({ open, supplierCount, onClose }: {
  open: boolean;
  supplierCount: number;
  onClose: () => void;
}) {
  return <Modal open={open} onOpenChange={value => { if (!value) onClose(); }}
    title="一次仅允许结算一个供应商"
    description={`已选择 ${supplierCount} 家供应商的商品，请仅保留一家供应商的商品后再结算。`}
    footer={<div className="buyer-remove-confirm-actions"><button className="button primary" onClick={onClose}>返回购物车调整</button></div>}>
    {null}
  </Modal>;
}
