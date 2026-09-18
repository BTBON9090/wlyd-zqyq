/** 人民币金额展示：订单、发票与服务订单预览共用同一格式（¥680.00，不带千分位）。 */
export const currency = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    useGrouping: false,
  }).format(value);
