import { useMemo } from "react";
import {
  getChainL1,
  industryChainTree,
  type IndustryChainSelection,
} from "../data/industryChain";

type Props = {
  value: IndustryChainSelection;
  onChange: (next: IndustryChainSelection) => void;
};

export function IndustryChainPicker({ value, onChange }: Props) {
  const l2List = useMemo(() => getChainL1(value.l1)?.children ?? [], [value.l1]);
  const l3List = useMemo(
    () => l2List.find((x) => x.id === value.l2)?.children ?? [],
    [l2List, value.l2],
  );

  return (
    <div className="form-grid industry-picker__grid">
      <label>
        <span>一级产业 *</span>
        <select
          required
          value={value.l1}
          onChange={(e) => onChange({ l1: e.target.value, l2: "", l3: "" })}
        >
          <option value="">请选择一级产业</option>
          {industryChainTree.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>二级产业 *</span>
        <select
          required
          disabled={!value.l1}
          value={value.l2}
          onChange={(e) => onChange({ ...value, l2: e.target.value, l3: "" })}
        >
          <option value="">{value.l1 ? "请选择二级产业" : "请先选择一级"}</option>
          {l2List.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <label className="span-2">
        <span>三级产业 *</span>
        <select
          required
          disabled={!value.l2}
          value={value.l3}
          onChange={(e) => onChange({ ...value, l3: e.target.value })}
        >
          <option value="">{value.l2 ? "请选择三级产业" : "请先选择二级"}</option>
          {l3List.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
