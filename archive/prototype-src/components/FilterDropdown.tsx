import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Props = {
  label: string;
  /** 已选时展示在触发器上的摘要 */
  summary?: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onClear: () => void;
  onConfirm: () => void;
  children: ReactNode;
};

/** 紧凑筛选下拉：触发条 + 弹层（区间 + 快捷项 + 清空/确定） */
export function FilterDropdown({
  label,
  summary,
  open,
  onToggle,
  onClose,
  onClear,
  onConfirm,
  children,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = Boolean(summary);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`svc-fd${open ? " is-open" : ""}${active ? " is-active" : ""}`} ref={rootRef}>
      <button type="button" className="svc-fd-trigger" onClick={onToggle}>
        <span className="svc-fd-trigger-text">{summary || label}</span>
        <span className="svc-fd-chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        <div className="svc-fd-panel" role="dialog" aria-label={label}>
          <div className="svc-fd-title">{label}</div>
          <div className="svc-fd-body">{children}</div>
          <div className="svc-fd-foot">
            <button type="button" className="svc-fd-clear" onClick={onClear}>
              清空
            </button>
            <button
              type="button"
              className="svc-fd-ok"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type ChipProps = {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function FilterChip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      className={`svc-fd-chip${active ? " on" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function FilterRangeRow({
  left,
  right,
  sep = "-",
}: {
  left: ReactNode;
  right: ReactNode;
  sep?: string;
}) {
  return (
    <div className="svc-fd-range">
      {left}
      <span>{sep}</span>
      {right}
    </div>
  );
}

export function useExclusiveOpen<T extends string>() {
  const [openKey, setOpenKey] = useState<T | null>(null);
  const toggle = (key: T) => setOpenKey((cur) => (cur === key ? null : key));
  const close = () => setOpenKey(null);
  return { openKey, toggle, close, setOpenKey };
}
