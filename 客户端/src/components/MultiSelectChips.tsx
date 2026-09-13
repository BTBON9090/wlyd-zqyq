type Props = {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
};

export function MultiSelectChips({ label, options, value, onChange, hint }: Props) {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((x) => x !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div className="multi-chips">
      <span className="multi-chips__label">{label}</span>
      {hint && <p className="form-hint">{hint}</p>}
      <div className="multi-chips__list">
        {options.map((item) => (
          <button
            key={item}
            type="button"
            className={`multi-chip ${value.includes(item) ? "on" : ""}`}
            onClick={() => toggle(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
