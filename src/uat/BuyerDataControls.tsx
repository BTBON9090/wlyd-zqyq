import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useApp } from "../app/AppProvider";
import { EmptyState, ErrorNotice, Field, Modal } from "../components/ui";
import { ChoiceSelect } from "../components/ChoiceSelect";
import "./buyer-data-controls.css";
import { UAT, uatRequest, type StateKey } from "./api";
import { useUat } from "./UatSessionProvider";
export type Park = { id: string; name: string; address?: string };
const names: Record<StateKey, string> = {
  cart: "购物车",
  addresses: "地址簿",
  preferences: "园区选择",
  onboarding: "入驻资料",
  profile: "个人资料",
};

/** Data feedback inside the reviewed shell; no replacement layout or navigation. */
export function CloudFeedback({
  only,
  onResolved,
  onKeep,
}: {
  only?: StateKey;
  onResolved?: (kept: boolean) => void;
  onKeep?: () => Promise<boolean>;
}) {
  const { entries, resolve } = useUat();
  if (!UAT) return null;
  return (
    <>
      {Object.entries(entries)
        .filter(
          ([key, entry]) =>
            (!only || key === only) && entry.error && entry.loaded,
        )
        .map(([key, entry]) => (
          <div className="notice error" role="alert" key={key}>
            <div>
              <strong>{names[key as StateKey]}尚未保存</strong>
              <p>{entry.error} 当前输入已保留。</p>
              <div className="v3-dialog-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={async () => {
                    if (await (onKeep ? onKeep() : resolve(key as StateKey, true))) onResolved?.(true);
                  }}
                >
                  {entry.conflict ? "保留本次修改并确认覆盖" : "重试保存"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={async () => {
                    if (await resolve(key as StateKey, false)) onResolved?.(false);
                  }}
                >
                  读取云端并放弃本次修改
                </button>
              </div>
            </div>
          </div>
        ))}
    </>
  );
}

export function CloudReady({ children }: { children: ReactNode }) {
  const { entries, loadStates, user } = useUat();
  if (!UAT || !user || Object.values(entries).every((e) => e.loaded))
    return children;
  const error = Object.values(entries).find((e) => !e.loaded && e.error)?.error;
  return error ? (
    <EmptyState
      error
      title="资料暂时无法加载"
      description={error}
      action="重新加载"
      onAction={() => void loadStates()}
    />
  ) : (
    <div className="loading-page" role="status">
      正在读取账号资料…
    </div>
  );
}

export function ParkDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, entries, update, refreshSession } = useUat();
  const { toast } = useApp();
  const [selected, setSelected] = useState(user?.currentParkId || "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  const parks = useQuery({
    queryKey: ["uat-public-parks"],
    queryFn: () => uatRequest<Park[]>("/parks"),
    enabled: (UAT || __DEMO__) && open,
    retry: false,
  });
  async function choose() {
    if (!selected || !user || busy) return;
    if (Object.values(entries).some((e) => e.saving || e.revision)) {
      setError("请先保存当前页面尚未同步的修改，再切换园区。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!user.parkIds.includes(selected)) {
        await uatRequest(`/me/parks/${encodeURIComponent(selected)}/join`, {
          method: "POST",
          body: "{}",
        });
        await refreshSession();
      }
      if (!(await update("preferences", { currentParkId: selected }))) {
        setError("园区选择尚未保存，请处理同步提示。");
        return;
      }
      await refreshSession();
      onOpenChange(false);
      toast("当前园区已更新");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
      title="选择园区"
    >
      <CloudReady>
        <Field
          id="buyer-park"
          label="所在园区"
          hint="加入后可浏览该园区的在售商品；购物车按园区分别保存。"
        >
          <ChoiceSelect
            id="buyer-park"
            label="所在园区"
            value={selected}
            onChange={setSelected}
            disabled={busy || parks.isPending}
            field
            searchable
            placeholder={parks.isPending ? "正在加载园区…" : "请选择园区"}
            searchPlaceholder="搜索园区名称或地址"
            options={(parks.data || []).map(park => ({
              id: park.id,
              name: park.name,
              description: user?.parkIds.includes(park.id) ? "已加入" : undefined,
              keywords: park.address,
            }))}
          />
        </Field>
        <ErrorNotice error={error || parks.error} />
        <CloudFeedback
          only="preferences"
          onResolved={() => onOpenChange(false)}
        />
        {parks.isError && (
          <button className="text-button" onClick={() => void parks.refetch()}>
            重新加载园区
          </button>
        )}
        <div className="v3-dialog-actions">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            取消
          </button>
          <button
            className="button primary"
            disabled={busy || !selected}
            onClick={() => void choose()}
          >
            {busy
              ? "保存中…"
              : user?.parkIds.includes(selected)
                ? "使用此园区"
                : "加入并使用"}
          </button>
        </div>
      </CloudReady>
    </Modal>
  );
}

export function ProcurementAccess({ children }: { children: ReactNode }) {
  const { user, loading, error } = useUat();
  const { openAuth } = useApp();
  const location = useLocation();
  const [parkOpen, setParkOpen] = useState(false);
  if (!UAT) return children;
  if (loading) return <div className="loading-page">正在读取账号信息…</div>;
  if (!user)
    return (
      <div className="buyer-access-panel"><EmptyState
        title="登录后开始采购"
        description={error || "使用您的账号查看园区商品、管理购物车与订单。"}
        action="登录 / 注册"
        onAction={() =>
          openAuth({ returnTo: location.pathname + location.search })
        }
      /></div>
    );
  if (!user.currentParkId)
    return (
      <CloudReady>
        <div className="buyer-access-panel"><EmptyState
          title="请选择采购园区"
          description="选择并加入园区后，可查看该园区的商品、价格和库存。"
          action="选择园区"
          onAction={() => setParkOpen(true)}
        /></div>
        <ParkDialog open={parkOpen} onOpenChange={setParkOpen} />
      </CloudReady>
    );
  return <CloudReady>{children}</CloudReady>;
}
