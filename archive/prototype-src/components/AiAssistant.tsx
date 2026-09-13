import { useEffect, useState } from "react";
import { IconClose, IconSpark } from "./Icons";
import { companyName } from "../data";

const chips = ["查订单进度", "我们能享受哪些政策", "匹配金融产品", "发布采购需求"];

const replies: Record<string, string> = {
  查订单进度:
    "您有 1 笔待收货：伺服电机 ×20（PO-08216）已发出，预计明日送达。确认收货后将进入对账结算。需要我打开订单详情吗？",
  我们能享受哪些政策:
    "根据临港精密制造的行业与规模画像，当前可申报 3 项：①研发费用加计扣除（8/31 截止）②园区设备补贴 ③高层次人才住房补贴。需要我生成申报要点卡片吗？",
  匹配金融产品:
    "结合近 90 日采购流水与在手银票，建议优先：园区信用贷（额度测算约 280 万）或银票贴现比价（票面 200 万，3 家机构已报价）。",
  发布采购需求:
    "请用一句话描述需求，例如「采购 50 台 1.5kW 伺服电机，两周内交货」。我会生成采购需求单，确认后即可发布。",
};

type Msg = { role: "bot" | "user"; text: string };

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState(true);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: `您好！我是您的专属 AI 经纪人「小x」。已读取「${companyName}」档案。不论是查询大宗行情、找车发货，还是需要供应链融资，您都可以直接交给我来帮您对接！`,
    },
  ]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMsgs((prev) => [
      ...prev,
      { role: "user", text: q },
      {
        role: "bot",
        text:
          replies[q] ??
          "已理解您的问题。一期将接入智能体与 RAG 知识库，基于政策、操作指南与园区信息作答，并可路由到下单、查询等业务模块。",
      },
    ]);
    setInput("");
  };

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: string }>).detail;
      setOpen(true);
      setTip(false);
      const prompt = detail?.prompt?.trim();
      if (!prompt) return;
      setMsgs((prev) => [
        ...prev,
        { role: "user", text: prompt },
        {
          role: "bot",
          text:
            replies[prompt] ??
            "已理解您的问题。一期将接入智能体与 RAG 知识库，基于政策、操作指南与园区信息作答，并可路由到下单、查询等业务模块。",
        },
      ]);
    };
    window.addEventListener("portal-open-ai", onOpen as EventListener);
    return () => window.removeEventListener("portal-open-ai", onOpen as EventListener);
  }, []);


  return (
    <>
      <button
        className="ai-fab"
        onClick={() => {
          setOpen(true);
          setTip(false);
        }}
        aria-label="打开 AI 助手"
      >
        <IconSpark />
        {tip && !open && <span className="ai-tip">有 1 条政策匹配建议</span>}
      </button>

      {open && <div className="ai-backdrop" onClick={() => setOpen(false)} />}

      <aside className={`ai-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="ai-head">
          <div className="who">
            <span className="ai-orb" />
            <div>
              <h3>AI 助手 · 小x</h3>
              <span>在线 · 经开区企业专属经纪人</span>
            </div>
          </div>
          <button className="ai-close" onClick={() => setOpen(false)} aria-label="关闭">
            <IconClose />
          </button>
        </div>

        <div className="ai-suggest">
          检测到研发加计扣除将于 8 月 31 日截止，与贵司画像匹配。可一键查看政策要点，或让我比对申报条件。
        </div>

        <div className="ai-chips">
          {chips.map((c) => (
            <button key={c} onClick={() => ask(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="ai-msgs">
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.text}
            </div>
          ))}
        </div>

        <form
          className="ai-input"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="用自然语言提问，例如：帮我查待付款"
          />
          <button type="submit">发送</button>
        </form>
      </aside>
    </>
  );
}
