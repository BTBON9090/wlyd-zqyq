import { ContentImage } from "./ContentImage";
import {
  Component,
  useId,
  type ReactNode,
  type ErrorInfo,
  type InputHTMLAttributes,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowClockwise,
  MagnifyingGlass,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { site } from "../lib/config";
import { useDesignVersion } from "../app/DesignVersion";
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label={`${site.name}首页`}>
      <span className="brand-mark">万</span>
      <span>
        <strong>{site.name}</strong>
        <small>{site.support}</small>
      </span>
    </Link>
  );
}
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { commerceVersion: version } = useDesignVersion();
  const withAcceptanceTools = __DEMO__ && version === "v3";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={!withAcceptanceTools}>
      <Dialog.Portal>
        {withAcceptanceTools ? <div className="modal-overlay" aria-hidden="true" /> : <Dialog.Overlay className="modal-overlay" />}
        <Dialog.Content className="modal-content" onInteractOutside={(event) => {
          if (withAcceptanceTools && event.target instanceof Element && event.target.closest(".acceptance-panel, .global-tools")) event.preventDefault();
        }}>
          <div className="modal-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="关闭弹窗">
              <X size={22} />
            </Dialog.Close>
          </div>
          <div className="modal-body">
            <Dialog.Description className={description ? "muted" : "sr-only"}>
              {description || title}
            </Dialog.Description>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Field({
  label,
  error,
  hint,
  children,
  id,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
export function Input({
  label,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const uid = useId();
  const id = props.id || uid;
  return (
    <Field label={label} error={error} hint={hint} id={id}>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
      />
    </Field>
  );
}
export function ErrorNotice({ error }: { error: unknown }) {
  return error ? (
    <div className="notice error" role="alert">
      <WarningCircle size={20} />
      <span>{error instanceof Error ? error.message : String(error)}</span>
    </div>
  ) : null;
}
export function EmptyState({
  title = "暂时没有找到相关服务",
  description = "试试其他关键词，或清除筛选条件。",
  action,
  onAction,
  error = false,
}: {
  title?: string;
  description?: string;
  action?: string;
  onAction?: () => void;
  error?: boolean;
}) {
  return (
    <div className="empty-state">
      {error ? (
        <WarningCircle size={44} weight="light" />
      ) : (
        <MagnifyingGlass size={44} weight="light" />
      )}
      <h2>{title}</h2>
      <p>{description}</p>
      {action && (
        <button className="button secondary" onClick={onAction}>
          {error && <ArrowClockwise />}
          {action}
        </button>
      )}
    </div>
  );
}
export function Skeletons() {
  return (
    <div className="service-grid" aria-label="正在加载服务" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function MediaSlot({
  src,
  label,
  large = false,
}: {
  src?: string;
  label: string;
  large?: boolean;
}) {
  return (
    <ContentImage
      src={src}
      alt={label}
      className={`media-slot ${large ? "large" : ""}`}
    />
  );
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page render failed", error.name, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <div className="container">
        <EmptyState
          error
          title="页面暂时无法显示"
          description="请刷新页面重试，已提交的申请不会因此重复。"
          action="重新加载"
          onAction={() => window.location.reload()}
        />
      </div>
    ) : (
      this.props.children
    );
  }
}
