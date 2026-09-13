/** 与原型顶部导航保持一致；空模块仅提供页面位置，不实现业务。 */
export const navigation = [
  { to: "/", label: "首页", empty: false },
  { to: "/services", label: "企业服务", empty: false },
  { to: "/finance", label: "数智金融", empty: true },
  { to: "/procurement", label: "商品交易", empty: true },
  { to: "/logistics", label: "智慧物流", empty: true },
  { to: "/news", label: "产业资讯", empty: true },
  { to: "/ai", label: "AI赋能", empty: true },
  { to: "/account", label: "个人中心", empty: false },
];
export const emptyModules = [
  ...navigation.filter((item) => item.empty),
  { to: "/map", label: "产业地图", empty: true },
];
