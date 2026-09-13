import fs from "fs";

const rows = [
  ["五、工作台首页", "5.1 门户首屏", "E-001", "品牌展示与智能导流", "展示平台定位与价值主张，支持通过智能搜索进入 AI 助手咨询。", "P0", "是", "客户端", "对齐当前首页 Hero"],
  ["五、工作台首页", "5.2 惠企权益", "E-002", "服务券领取", "展示园区专项补贴券信息，支持登录后领取。", "P0", "是", "客户端", ""],
  ["五、工作台首页", "5.3 产业导览", "E-003", "产业全景导览", "提供企业/产业/供需视图预览，并可进入产业地图。", "P0", "是", "客户端", ""],
  ["五、工作台首页", "5.4 服务入口", "E-004", "核心业务入口矩阵", "汇总企业服务、商品交易、数智金融、物流、资讯、AI 等模块入口。", "P0", "是", "客户端", ""],
  ["五、工作台首页", "5.5 数据洞察", "E-005", "行情与运营数据展示", "展示大宗商品行情、AI 行情解读与经开区运营指标。", "P1", "否", "客户端", "行情为演示数据"],
  ["五、工作台首页", "5.6 生态展示", "E-006", "生态伙伴展示", "展示园区服务商、金融、科研、物流等合作生态。", "P2", "否", "客户端", ""],
  ["八、企业服务", "8.1 模块导航", "H-001", "企服侧栏导航", "在热门推荐、服务大厅、需求大厅及服务一级类目间切换，并预览服务订单。", "P0", "是", "客户端", ""],
  ["八、企业服务", "8.2 热门推荐", "H-002", "精选服务与需求推荐", "集中推荐热门服务与活跃需求，支持搜索进入大厅及需求互动（发布/抢单演示）。", "P0", "是", "客户端", "默认落地 /services"],
  ["八、企业服务", "8.2 热门推荐", "H-003", "运营推广位", "通过 Banner 承载商标交易、严选服务等运营活动入口。", "P0", "是", "客户端", ""],
  ["八、企业服务", "8.3 服务大厅", "H-004", "服务检索与筛选", "按关键词、三级类目、价格、发布时间、综合评分与排序条件筛选服务。", "P0", "是", "客户端", "/services/hall"],
  ["八、企业服务", "8.3 服务大厅", "H-005", "服务目录浏览", "网格浏览严选服务，并按类目路径定位。", "P0", "是", "客户端", ""],
  ["八、企业服务", "8.4 服务触达", "H-006", "服务展示与咨询", "展示服务关键信息，支持进入详情或电话咨询服务商。", "P0", "是", "客户端", ""],
  ["八、企业服务", "8.5 服务详情", "H-007", "服务内容与商家展示", "展示服务介绍、保障、FAQ、案例、客户评价及店铺信息。", "P0", "是", "客户端", ""],
  ["八、企业服务", "8.5 服务详情", "H-008", "规格选择与下单意图", "选择服务规格与购买数量，了解履约与交付规则后发起购买。", "P0", "是", "客户端", "单位：项/个/次；分期提示首笔"],
  ["八、企业服务", "8.6 交易下单", "H-009", "确认订单与待支付信息", "填写需求与联系人，确认规格、数量、履约类型、交付周期与应付金额（分期付首笔）。", "P0", "是", "客户端", "收银台未上线，去支付为演示"],
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function priStyle(p) {
  return p === "P0" ? "P0" : p === "P1" ? "P1" : "P2";
}
function mvpStyle(m) {
  return m === "是" ? "MVPYes" : "MVPNo";
}

let body = "";
rows.forEach((r, i) => {
  const [l1, l2, code, name, desc, pri, mvp, side, note] = r;
  body += `  <Row ss:Height="48">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${i + 1}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(l1)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(l2)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${esc(code)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(name)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(desc)}</Data></Cell>
    <Cell ss:StyleID="${priStyle(pri)}"><Data ss:Type="String">${esc(pri)}</Data></Cell>
    <Cell ss:StyleID="${mvpStyle(mvp)}"><Data ss:Type="String">${esc(mvp)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${esc(side)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${esc(note)}</Data></Cell>
  </Row>
`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>政企园区服务平台-客户端-产品功能清单（首页·企服）</Title>
  <Author>Cursor</Author>
  <Created>2026-09-08T00:00:00Z</Created>
  <Version>1.1</Version>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="16" ss:Bold="1"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E40AF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
   </Borders>
  </Style>
  <Style ss:ID="Cell">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="微软雅黑" ss:Size="10"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="P0">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="P1">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#B45309"/>
   <Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="P2">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#475569"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="MVPYes">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="MVPNo">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="微软雅黑" ss:Size="10" ss:Color="#94A3B8"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>

 <Worksheet ss:Name="产品功能清单">
  <Table ss:ExpandedColumnCount="10" ss:ExpandedRowCount="${rows.length + 3}" x:FullColumns="1" x:FullRows="1">
   <Column ss:Index="1" ss:Width="40"/>
   <Column ss:Index="2" ss:Width="110"/>
   <Column ss:Index="3" ss:Width="100"/>
   <Column ss:Index="4" ss:Width="55"/>
   <Column ss:Index="5" ss:Width="160"/>
   <Column ss:Index="6" ss:Width="380"/>
   <Column ss:Index="7" ss:Width="50"/>
   <Column ss:Index="8" ss:Width="55"/>
   <Column ss:Index="9" ss:Width="70"/>
   <Column ss:Index="10" ss:Width="160"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="9" ss:StyleID="Title"><Data ss:Type="String">政企园区服务平台 · 客户端 · 产品功能清单（首页 · 企业服务）</Data></Cell>
   </Row>
   <Row ss:Height="36">
    <Cell ss:MergeAcross="9" ss:StyleID="SubTitle"><Data ss:Type="String">范围：工作台首页 / 企业服务　|　版本：v1.1　|　适用端：客户端 PC　|　列结构对齐 v1.0　|　P0=一期/MVP　P1=二期　P2=三期　|　对齐当前已实现能力（功能级，非按钮字段级）</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">序号</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">一级模块</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">二级模块</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">编号</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">功能名称</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">功能描述</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">优先级</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">是否MVP</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">端侧</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">备注</Data></Cell>
   </Row>
${body}  </Table>
 </Worksheet>

 <Worksheet ss:Name="文档说明">
  <Table ss:ExpandedColumnCount="2" ss:ExpandedRowCount="6">
   <Column ss:Width="120"/>
   <Column ss:Width="520"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">项</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">说明</Data></Cell>
   </Row>
   <Row ss:Height="42">
    <Cell ss:StyleID="Cell"><Data ss:Type="String">列结构</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">对齐《政企园区服务平台-客户端-产品功能清单-v1.0.xls》：序号、一级模块、二级模块、编号、功能名称、功能描述、优先级、是否MVP、端侧、备注。</Data></Cell>
   </Row>
   <Row ss:Height="36">
    <Cell ss:StyleID="Cell"><Data ss:Type="String">范围</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">仅含「五、工作台首页」「八、企业服务」；功能粒度为能力级，不拆到按钮/字段。</Data></Cell>
   </Row>
   <Row ss:Height="36">
    <Cell ss:StyleID="Cell"><Data ss:Type="String">编号规则</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">首页 E-xxx；企业服务 H-xxx（与 v1.0 模块字母约定一致）。</Data></Cell>
   </Row>
   <Row ss:Height="36">
    <Cell ss:StyleID="Cell"><Data ss:Type="String">版本</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">v1.1 · 2026-09-08 · 按当前客户端实现盘点</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>
`;

const out = new URL("../政企园区服务平台-客户端-产品功能清单-首页企服-v1.1.xls", import.meta.url);
fs.writeFileSync(out, xml, "utf8");
console.log("OK", decodeURIComponent(out.pathname), "rows", rows.length);
