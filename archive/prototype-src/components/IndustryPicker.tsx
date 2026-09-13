import { useMemo } from "react";
import {
  getIndustryClasses,
  getIndustryDivisions,
  getIndustryGroups,
  getIndustrySection,
  industrySections,
  type IndustrySelection,
} from "../data/industries";

type IndustryPickerProps = {
  value: IndustrySelection;
  onChange: (next: IndustrySelection) => void;
};

export function IndustryPicker({ value, onChange }: IndustryPickerProps) {
  const section = getIndustrySection(value.section);
  const divisions = useMemo(() => getIndustryDivisions(value.section), [value.section]);
  const groups = useMemo(
    () => getIndustryGroups(value.section, value.division),
    [value.section, value.division],
  );
  const classes = useMemo(
    () => getIndustryClasses(value.section, value.division, value.group),
    [value.section, value.division, value.group],
  );

  const setSection = (sectionCode: string) => {
    onChange({ section: sectionCode, division: "", group: "", class: "" });
  };

  const setDivision = (divisionCode: string) => {
    onChange({ ...value, division: divisionCode, group: "", class: "" });
  };

  const setGroup = (groupCode: string) => {
    onChange({ ...value, group: groupCode, class: "" });
  };

  const setClass = (classCode: string) => {
    onChange({ ...value, class: classCode });
  };

  return (
    <div className="industry-picker">
      <p className="form-hint">按 GB/T 4754-2017 国家标准，依次选择门类、大类、中类、小类。</p>
      <div className="form-grid industry-picker__grid">
        <label>
          <span>行业门类 *</span>
          <select required value={value.section} onChange={(e) => setSection(e.target.value)}>
            <option value="">请选择门类</option>
            {industrySections.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>行业大类 *</span>
          <select
            required
            disabled={!value.section}
            value={value.division}
            onChange={(e) => setDivision(e.target.value)}
          >
            <option value="">{value.section ? "请选择大类" : "请先选择门类"}</option>
            {divisions.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>行业中类 *</span>
          <select
            required
            disabled={!value.division}
            value={value.group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">{value.division ? "请选择中类" : "请先选择大类"}</option>
            {groups.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>行业小类 *</span>
          <select
            required
            disabled={!value.group}
            value={value.class}
            onChange={(e) => setClass(e.target.value)}
          >
            <option value="">{value.group ? "请选择小类" : "请先选择中类"}</option>
            {classes.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {section && value.class && (
        <em className="form-hint industry-picker__summary">
          已选：{value.section} {section.name} → {value.division} → {value.group} → {value.class}
        </em>
      )}
    </div>
  );
}
