import { useState } from "react";
import { z } from "zod";
import { useApp } from "../app/AppProvider";
export function useValidation() {
  const { skipped } = useApp();
  const [errors, setErrors] = useState<Record<string, string>>({});
  return {
    errors,
    clear: (key: string) =>
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    validate: (schema: z.ZodType, value: unknown) => {
      const result = schema.safeParse(value);
      const next: Record<string, string> = {};
      if (!result.success)
        result.error.issues.forEach((issue) => {
          const key = String(issue.path[0]);
          if (!skipped.includes(key) && !next[key]) next[key] = issue.message;
        });
      setErrors(next);
      if (Object.keys(next).length) {
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        );
        return false;
      }
      return true;
    },
  };
}
export function fileError(file?: File) {
  if (!file) return "";
  if (file.size > 10 * 1024 * 1024) return "文件不能超过 10 MB";
  if (!/\.(pdf|docx|xlsx|png|jpe?g)$/i.test(file.name))
    return "请上传 PDF、DOCX、XLSX、JPG 或 PNG 文件";
  return "";
}
