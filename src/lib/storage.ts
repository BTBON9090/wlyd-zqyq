import { z } from "zod";
export function readStored<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  try {
    const raw = sessionStorage.getItem(`park-pilot:${key}`);
    return raw ? schema.parse(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}
export function writeStored(key: string, value: unknown) {
  try {
    sessionStorage.setItem(`park-pilot:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function removeStored(key: string) {
  try {
    sessionStorage.removeItem(`park-pilot:${key}`);
  } catch {
    /* restricted storage */
  }
}
