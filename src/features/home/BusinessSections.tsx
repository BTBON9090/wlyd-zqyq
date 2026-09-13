import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { ContentImage } from "../../components/ContentImage";
import { Modal } from "../../components/ui";
import { DEMO } from "../../lib/config";
const finances = [
  {
    name: "园区信用贷",
    category: "借贷",
    desc: "面向企业日常经营与资金周转",
    tags: ["信用授信", "线上申请"],
    flow: "了解准入条件 → 提交企业资料 → 机构授信审核 → 按约用款",
  },
  {
    name: "企业财产保障",
    category: "保险",
    desc: "关注厂房设备、存货与经营风险",
    tags: ["财产保障", "方案核保"],
    flow: "了解保障范围 → 填写投保标的 → 机构核保 → 出具保单",
  },
  {
    name: "银票贴现",
    category: "票据",
    desc: "围绕真实票据与贸易背景对接机构",
    tags: ["票据信息", "机构询价"],
    flow: "提供票据信息 → 机构询价 → 贸易背景审核 → 办理贴现",
  },
  {
    name: "供应链票据",
    category: "供应链金融",
    desc: "连接上下游企业的交易与结算需求",
    tags: ["贸易确权", "账期协同"],
    flow: "确认交易背景 → 提交相关资料 → 机构审核 → 按约流转结算",
  },
];
const products = [
  {
    id: "camera",
    name: "网络监控摄像机",
    spec: "H.265 · 红外 30m · POE",
    supplier: "安防设备",
    price: "428",
    unit: "台",
    cat: "security",
  },
  {
    id: "gloves",
    name: "丁腈防护手套",
    spec: "工业防护 · 多规格可选",
    supplier: "劳保耗材",
    price: "68",
    unit: "打",
    cat: "tools",
  },
  {
    id: "paper",
    name: "工业无尘擦拭纸",
    spec: "9×9 寸 · 600 片",
    supplier: "清洁耗材",
    price: "96",
    unit: "包",
    cat: "cleaning",
  },
  {
    id: "access",
    name: "门禁刷卡读头",
    spec: "IC 卡 · IP65 · 韦根 26",
    supplier: "安防设备",
    price: "186",
    unit: "个",
    cat: "security",
  },
  {
    id: "cleaner",
    name: "多功能清洁剂",
    spec: "5L / 桶 · 中性配方",
    supplier: "清洁耗材",
    price: "58",
    unit: "桶",
    cat: "cleaning",
  },
];
export function BusinessSections({
  images = {},
  productImages = {},
}: {
  images?: Record<string, string>;
  productImages?: Record<string, string>;
}) {
  const [finance, setFinance] = useState<(typeof finances)[number] | null>(
    null,
  );
  return (
    <>
      <section
        className="showcase-container business-section"
        id="finance-business"
      >
        <div className="business-heading">
          <div>
            <span>数智金融</span>
            <h2>让金融服务，回应企业经营所需</h2>
            <p>借贷、保险、票据与供应链金融，多种产品方向供您了解。</p>
          </div>
          <Link to="/finance">
            金融服务专区 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="finance-business-grid">
          <div className="business-poster">
            <ContentImage
              src={images.finance}
              alt="数智金融专题宣传图"
              placeholder="金融专题宣传图 · 待上传"
            />
            <div>
              <span>产融协同</span>
              <h3>
                连接金融资源
                <br />
                支持企业发展
              </h3>
            </div>
          </div>
          {finances.map((item) => (
            <button
              className="finance-product"
              key={item.name}
              onClick={() => setFinance(item)}
            >
              <span>{item.category}</span>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
              <div>
                {item.tags.map((tag) => (
                  <small key={tag}>{tag}</small>
                ))}
              </div>
              <strong>
                了解产品 <ArrowRight size={14} />
              </strong>
            </button>
          ))}
        </div>
        <p className="business-note">
          展示产品方向与办理路径，具体条件、费用和审核结果以金融机构发布为准。
        </p>
      </section>
      <section className="business-trade" id="trade-business">
        <div className="showcase-container">
          <div className="business-heading">
            <div>
              <span>商品交易</span>
              <h2>企业采购，从好商品开始</h2>
              <p>安防、清洁、工具、消防与办公用品，连接企业采购和供应资源。</p>
            </div>
            <Link to="/procurement">
              进入集采商城 <ArrowRight size={16} />
            </Link>
          </div>
          <div className="trade-navigation">
            {[
              ["安防设备", "security"],
              ["清洁耗材", "cleaning"],
              ["工具设施", "tools"],
              ["防汛应急", "flood"],
              ["消防安全", "fire"],
              ["物业办公", "office"],
            ].map(([name, id]) => (
              <Link key={id} to={`/procurement?cat=${id}`}>
                {name}
              </Link>
            ))}
          </div>
          <div className="trade-product-grid">
            <Link className="trade-poster business-poster" to="/procurement">
              <ContentImage
                src={images.trade}
                alt="产业采购广告"
                placeholder="采购专题图 · 待上传"
              />
              <div>
                <span>园区集采</span>
                <h3>
                  好物资
                  <br />
                  助力好生意
                </h3>
                <small>电商采购 · 协议采购 · 询价</small>
              </div>
            </Link>
            {products.map((product) => (
              <Link
                className="trade-product"
                key={product.id}
                to={`/procurement?cat=${product.cat}`}
              >
                <ContentImage
                  src={productImages[product.id]}
                  alt={product.name}
                />
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.spec}</p>
                  <strong>
                    {DEMO ? (
                      <>
                        ¥ {product.price}
                        <small> / {product.unit}</small>
                      </>
                    ) : (
                      "查看品类"
                    )}
                  </strong>
                  <span>{product.supplier}</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="business-note">
            采购内容与价格以供应商发布及双方确认为准。
          </p>
        </div>
      </section>
      <section
        className="showcase-container business-section"
        id="logistics-business"
      >
        <div className="business-heading">
          <div>
            <span>智慧物流 · 万连通</span>
            <h2>让每一次发运，都有清晰的路径</h2>
            <p>从找车发货到运费结算，衔接货主与运力的业务协同。</p>
          </div>
          <Link to="/logistics">
            了解智慧物流 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="logistics-business-layout">
          <div className="business-poster">
            <ContentImage
              src={images.logistics}
              alt="智慧物流宣传图"
              placeholder="物流专题宣传图 · 待上传"
            />
          </div>
          <div className="logistics-copy">
            <h3>货物所往，服务所至</h3>
            <p>围绕园区企业发运需求，连接运输资源、订单执行与费用结算。</p>
            <div className="logistics-services">
              {[
                ["找车发货", "按路线与货物需求对接运输资源"],
                ["智能调度", "协调车辆、时间与运输任务"],
                ["运单跟踪", "关注运输节点和货物进度"],
                ["运费结算", "汇集运单信息与费用记录"],
              ].map(([name, desc], i) => (
                <Link key={name} to={`/logistics?service=${i}`}>
                  <span>0{i + 1}</span>
                  <div>
                    <h4>{name}</h4>
                    <p>{desc}</p>
                  </div>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
            <Link className="button primary" to="/logistics">
              进入物流专区 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <Modal
        open={!!finance}
        onOpenChange={(open) => {
          if (!open) setFinance(null);
        }}
        title={finance?.name || "金融产品介绍"}
        description={finance?.desc}
      >
        <div className="finance-flow">
          <h3>办理路径</h3>
          <p>{finance?.flow}</p>
          <p className="muted">
            本区介绍产品方向，暂未接入真实机构申请。具体方案以机构审核为准。
          </p>
          <Link className="button primary" to="/finance">
            前往金融服务专区 <ArrowRight size={16} />
          </Link>
        </div>
      </Modal>
    </>
  );
}
