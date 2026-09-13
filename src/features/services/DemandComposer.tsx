import { useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Modal, Input, Field, ErrorNotice } from "../../components/ui";
import { categories } from "../../data/categories";
import { gateway } from "../../lib/api";
import { useValidation } from "../../lib/forms";
import { DEMO } from "../../lib/config";
export function DemandComposer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ip");
  const [requirement, setRequirement] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState("");
  const key = useRef(crypto.randomUUID());
  const lock = useRef(false);
  const client = useQueryClient();
  const { errors, validate } = useValidation();
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    const data = { title, category, requirement, budget };
    if (
      !validate(
        z.object({
          title: z
            .string()
            .trim()
            .min(4, "请填写至少 4 个字的需求标题")
            .max(60),
          category: z.string().min(1),
          requirement: z
            .string()
            .trim()
            .min(10, "请至少填写 10 个字的需求描述")
            .max(1000),
          budget: z.string().max(40),
        }),
        data,
      )
    )
      return;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await gateway.publishDemand(data, key.current);
      setReceipt(result.id);
      void client.invalidateQueries({ queryKey: ["demands"] });
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        if (!pending && !value) onClose();
      }}
      title={receipt ? "需求已发布" : "发布服务需求"}
      description={
        receipt
          ? DEMO
            ? "演示需求已保存，未通知真实服务商。"
            : "需求已保存，可在个人中心查看。"
          : "说明您要做什么，让服务商更准确地理解需求。"
      }
    >
      {receipt ? (
        <div className="demand-success">
          <p>
            需求编号 <strong>{receipt}</strong>
          </p>
          <Link className="button primary" to="/account/demands">
            查看我的需求
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="demand-form">
          <ErrorNotice error={error} />
          <Input
            id="title"
            label="需求标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            error={errors.title}
            placeholder="例如：企业官网设计与开发"
          />
          <Field label="服务类别" id="category">
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.slice(1).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Input
            id="budget"
            label="预期预算（选填）"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            maxLength={40}
            placeholder="例如：1–3 万元，可面议"
          />
          <Field label="需求描述" id="requirement" error={errors.requirement}>
            <textarea
              id="requirement"
              rows={4}
              maxLength={1000}
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="说明服务内容、预期交付时间与其他要求"
            />
          </Field>
          <p className="muted small">
            发布后可在个人中心管理，提交不产生付款。
          </p>
          <button className="button primary full-width" disabled={pending}>
            {pending ? "正在发布…" : "发布需求"}
          </button>
        </form>
      )}
    </Modal>
  );
}
