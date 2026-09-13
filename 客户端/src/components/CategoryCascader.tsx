import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  categoryPathLabel,
  getL2Options,
  getL3Options,
  serviceCategories,
  type ServiceCategoryId,
} from "../data/enterpriseServices";

export type CategoryCascadeValue = {
  categoryId: ServiceCategoryId | "all";
  categoryL2: string;
  categoryL3: string;
};

type Props = {
  value: CategoryCascadeValue;
  onChange: (next: CategoryCascadeValue) => void;
};

/** 三级类目级联：可停在任意一级 */
export function CategoryCascader({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const [hoverL1, setHoverL1] = useState<ServiceCategoryId | "all">(value.categoryId);
  const [hoverL2, setHoverL2] = useState(value.categoryL2);

  useEffect(() => {
    if (!open) return;
    setHoverL1(value.categoryId === "all" ? "ip" : value.categoryId);
    setHoverL2(value.categoryL2);
  }, [open, value.categoryId, value.categoryL2]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const l1Items = useMemo(
    () =>
      serviceCategories.filter(
        (c): c is { id: ServiceCategoryId; label: string; icon: string } => c.id !== "all",
      ),
    [],
  );
  const l2Items = useMemo(() => getL2Options(hoverL1), [hoverL1]);
  const l3Items = useMemo(() => getL3Options(hoverL1, hoverL2), [hoverL1, hoverL2]);

  const label = categoryPathLabel(value);

  const pickAll = () => {
    onChange({ categoryId: "all", categoryL2: "", categoryL3: "" });
    setOpen(false);
  };

  const pickL1 = (id: ServiceCategoryId) => {
    onChange({ categoryId: id, categoryL2: "", categoryL3: "" });
    setOpen(false);
  };

  const pickL2 = (l1: ServiceCategoryId, l2Label: string) => {
    onChange({ categoryId: l1, categoryL2: l2Label, categoryL3: "" });
    setOpen(false);
  };

  const pickL3 = (l1: ServiceCategoryId, l2Label: string, l3Label: string) => {
    onChange({ categoryId: l1, categoryL2: l2Label, categoryL3: l3Label });
    setOpen(false);
  };

  return (
    <div className={`svc-cascader${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="svc-cascader-trigger"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="svc-cascader-label">{label}</span>
        <span className="svc-cascader-arrow" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="svc-cascader-panel" id={listId} role="listbox">
          <div className="svc-cascader-col">
            <button
              type="button"
              className={`svc-cascader-item${value.categoryId === "all" ? " on" : ""}`}
              onClick={pickAll}
            >
              全部服务
            </button>
            {l1Items.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`svc-cascader-item${hoverL1 === c.id ? " hover" : ""}${
                  value.categoryId === c.id && !value.categoryL2 ? " on" : ""
                }`}
                onMouseEnter={() => {
                  setHoverL1(c.id);
                  setHoverL2("");
                }}
                onClick={() => pickL1(c.id)}
              >
                {c.label}
                <em>›</em>
              </button>
            ))}
          </div>

          <div className="svc-cascader-col">
            {hoverL1 !== "all" && l2Items.length === 0 && (
              <div className="svc-cascader-empty">暂无二级类目</div>
            )}
            {l2Items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`svc-cascader-item${hoverL2 === n.label ? " hover" : ""}${
                  value.categoryId === hoverL1 && value.categoryL2 === n.label && !value.categoryL3
                    ? " on"
                    : ""
                }`}
                onMouseEnter={() => setHoverL2(n.label)}
                onClick={() => hoverL1 !== "all" && pickL2(hoverL1, n.label)}
              >
                {n.label}
                <em>›</em>
              </button>
            ))}
          </div>

          <div className="svc-cascader-col">
            {hoverL2 && l3Items.length === 0 && (
              <div className="svc-cascader-empty">暂无三级类目</div>
            )}
            {!hoverL2 && hoverL1 !== "all" && (
              <div className="svc-cascader-empty">悬停或点选二级后展开</div>
            )}
            {l3Items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`svc-cascader-item${
                  value.categoryId === hoverL1 &&
                  value.categoryL2 === hoverL2 &&
                  value.categoryL3 === n.label
                    ? " on"
                    : ""
                }`}
                onClick={() => hoverL1 !== "all" && pickL3(hoverL1, hoverL2, n.label)}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
