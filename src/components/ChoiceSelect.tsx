import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CaretDown, Check, MagnifyingGlass } from "@phosphor-icons/react";
import "./choice-select.css";

type Choice = { id: string; name: string; description?: string; keywords?: string };

/** Shared version of the marketplace's reviewed dropdown, with optional field search. */
export function ChoiceSelect({ id, label, value, options, onChange, disabled = false,
  searchable = false, placeholder = "请选择", searchPlaceholder = "搜索选项",
  className = "", field = false,
}: { id?: string; label: string; value: string; options: Choice[]; onChange: (value: string) => void;
  disabled?: boolean; searchable?: boolean; placeholder?: string; searchPlaceholder?: string;
  className?: string; field?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false), [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null), optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedName = options.find(option => option.id === value)?.name || placeholder;
  const normalized = query.trim().toLocaleLowerCase();
  const visible = options.filter(option => !normalized || `${option.name} ${option.keywords || ""}`.toLocaleLowerCase().includes(normalized));
  const expanded = open && !disabled;
  function close(focus = false) { setOpen(false); if (focus) trigger.current?.focus(); }
  function show(focus = false) {
    if (disabled) return;
    const index = Math.max(0, options.findIndex(option => option.id === value));
    setQuery(""); setFocusIndex(index); setOpen(true);
    requestAnimationFrame(() => {
      if (searchable) search.current?.focus();
      else if (focus) optionRefs.current[index]?.focus();
      optionRefs.current[index]?.scrollIntoView({ block: "nearest" });
    });
  }
  function choose(next: string) { onChange(next); close(true); }
  function optionKey(event: KeyboardEvent, index: number) {
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % visible.length;
    else if (event.key === "ArrowUp") next = (index - 1 + visible.length) % visible.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = visible.length - 1;
    else if (event.key === "Tab") { close(); return; }
    else return;
    event.preventDefault(); setFocusIndex(next); optionRefs.current[next]?.focus();
  }
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(); };
    // Closing a dropdown inside a dialog must leave the parent dialog open.
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault(); event.stopPropagation(); close(true);
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("keydown", escape, true); };
  }, [expanded]);
  return <div ref={root} className={`market-category-control ${field ? "choice-select-field" : ""} ${className}`} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close();
  }}>
    <button id={id} ref={trigger} type="button" className="market-category-trigger" disabled={disabled}
      aria-label={`${label}：${selectedName}`} aria-haspopup="listbox" aria-expanded={expanded}
      aria-controls={expanded ? listId : undefined} aria-describedby={id ? `${id}-hint` : undefined}
      onClick={() => expanded ? close() : show()} onKeyDown={event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(true); }
      }}>
      <span title={selectedName}>{selectedName}</span><CaretDown size={15} className={expanded ? "is-open" : ""}/>
    </button>
    {expanded && <div className="market-category-menu">
      {searchable && <label className="choice-select-search"><MagnifyingGlass size={17}/>
        <input ref={search} type="search" aria-label={searchPlaceholder} placeholder={searchPlaceholder}
          value={query} maxLength={100} onChange={event => { setQuery(event.target.value); setFocusIndex(0); }}
          onKeyDown={event => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault(); const index = event.key === "ArrowDown" ? 0 : visible.length - 1;
              if (index >= 0) { setFocusIndex(index); optionRefs.current[index]?.focus(); }
            } else if (event.key === "Enter") {
              event.preventDefault(); if (visible.length === 1) choose(visible[0].id);
            }
          }}/>
      </label>}
      <div id={listId} role="listbox" aria-label={label} className="choice-select-options">
        {visible.map((option, index) => <button type="button" role="option" aria-selected={value === option.id}
          tabIndex={focusIndex === index ? 0 : -1} ref={node => { optionRefs.current[index] = node; }} key={option.id}
          onClick={() => choose(option.id)} onKeyDown={event => optionKey(event, index)}>
          <span className="choice-select-option-text"><span>{option.name}</span>{option.description && <small>{option.description}</small>}</span>
          {value === option.id && <Check size={16} weight="bold"/>}
        </button>)}
      </div>
      {!visible.length && <p role="status">{options.length ? "未找到匹配项，请更换关键词。" : "暂无可选项。"}</p>}
    </div>}
  </div>;
}
