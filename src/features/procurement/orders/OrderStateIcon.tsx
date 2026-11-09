import { Check, Clock, Info, X } from "@phosphor-icons/react";
import "./order-feedback.css";

export function OrderStateIcon({ state, compact = false }: {
  state: "success" | "error" | "pending" | "info";
  compact?: boolean;
}) {
  const Icon = {success: Check, error: X, pending: Clock, info: Info}[state];
  return <span className={`order-state-icon order-state-icon-${state}${compact ? " is-compact" : ""}`} aria-hidden="true">
    <Icon weight="bold" />
  </span>;
}
