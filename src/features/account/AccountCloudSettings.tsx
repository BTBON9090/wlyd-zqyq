import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, CheckCircle, MapPin, ShieldCheck } from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { ErrorNotice, Input } from "../../components/ui";
import { CloudFeedback, CloudReady, ParkDialog, type Park } from "../../uat/BuyerDataControls";
import { useUat } from "../../uat/UatSessionProvider";
import { uatRequest } from "../../uat/api";
import { ProfileAvatar } from "./ProfileAvatar";
import AddressManagement from "./AddressManagement";
import "./account-settings.css";

const DemoProvider = __DEMO__ ? lazy(() => import("../../dev/AccountPreviewProvider")) : null;

/** The reviewed sidebar hosts separate settings pages backed by the same cloud documents. */
export default function AccountCloudSettings({ mode = "profile" }: { mode?: "profile" | "addresses" | "parks" }) {
  const content = <CloudReady>{mode === "addresses" ? <AddressManagement/> : <ProfileSettings key={mode} parkOnly={mode === "parks"}/>}</CloudReady>;
  return DemoProvider ? <Suspense fallback={<div className="loading-page">正在读取资料…</div>}><DemoProvider>{content}</DemoProvider></Suspense> : content;
}
function ProfileSettings({ parkOnly }: { parkOnly: boolean }) {
  const { user, entries, update, resolve, refreshSession } = useUat();
  const { openAuth, logout } = useApp();
  const profile = (entries.profile.value || {}) as Record<string, string>;
  const [name, setName] = useState(profile.contactName || user!.displayName);
  const [phone, setPhone] = useState(profile.phone || "");
  const [company, setCompany] = useState(profile.company || "");
  const [avatar, setAvatar] = useState(profile.avatar || "");
  const [parkOpen, setParkOpen] = useState(false), [pending, setPending] = useState(false), [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null), [success, setSuccess] = useState("");
  const form = useRef<HTMLFormElement>(null), upload = useRef<HTMLInputElement>(null);
  const entry = entries.profile;
  const dirty = name.trim() !== (profile.contactName || user!.displayName)
    || phone.trim() !== (profile.phone || "") || company.trim() !== (profile.company || "")
    || avatar !== (profile.avatar || "");
  useEffect(() => {
    if (!entry.loaded || entry.saving || entry.revision) return;
    const saved = (entry.value || {}) as Record<string, string>;
    setName(saved.contactName || user!.displayName); setPhone(saved.phone || "");
    setCompany(saved.company || ""); setAvatar(saved.avatar || "");
  }, [entry.version, entry.value, entry.revision, entry.saving]);
  const parks = useQuery({ queryKey: ["uat-public-parks"], queryFn: () => uatRequest<Park[]>("/parks"), retry: false });
  const currentPark = parks.data?.find(park => park.id === user?.currentParkId);
  function edited() { setSuccess(""); setError(null); }
  async function uploadAvatar(file?: File) {
    if (!file || uploading || pending) return;
    edited();
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024 || !file.size) {
      setError("请选择不超过 4 MB 的 JPG、PNG 或 WebP 图片。"); return;
    }
    setUploading(true);
    try {
      const result = await uatRequest<{ url: string }>("/media?purpose=avatar", {
        method: "POST", headers: { "Content-Type": file.type }, body: file,
      });
      if (typeof result.url !== "string" || !(result.url.startsWith("/api/shared/media/") || (__DEMO__ && /^data:image\/(png|jpeg|webp);base64,/.test(result.url)))) throw new Error("头像上传结果无效，请重新上传。");
      setAvatar(result.url);
    } catch (failure) { setError(failure); }
    finally { setUploading(false); }
  }
  async function persist(retry = false): Promise<boolean> {
    if (pending || uploading || !form.current?.reportValidity()) return false;
    if (!name.trim()) { setError("请输入姓名。"); return false; }
    setPending(true); setError(null); setSuccess("");
    try {
      const saved = await update("profile", {
        name: name.trim(), displayName: name.trim(), contactName: name.trim(),
        mobile: phone.trim(), phone: phone.trim(), company: company.trim(), avatar,
      });
      if (!saved && !(retry && await resolve("profile", true))) {
        setError("个人信息尚未保存，当前输入已保留，请处理下方同步提示。"); return false;
      }
      try { await refreshSession(); } catch {
        setSuccess("个人信息已保存，账号显示信息将在重新读取后更新。"); return true;
      }
      setSuccess("个人信息已保存。");
      return true;
    } catch (failure) { setError(failure); return false; }
    finally { setPending(false); }
  }
  async function submit(event: FormEvent) { event.preventDefault(); await persist(); }
  return <div className="account-settings-content">
    {!parkOnly && <section className="v3-account-panel account-profile-panel">
      <header className="account-settings-section-heading"><h2>基本资料</h2><p>更新头像与联系信息，保存在当前账号中。</p></header>
      <form ref={form} onSubmit={submit} className="account-profile-form">
        <div className="account-profile-avatar-row">
          <span className="account-profile-avatar"><ProfileAvatar name={name || user!.displayName} src={avatar}/></span>
          <div><button type="button" className="button secondary" disabled={pending || uploading} onClick={() => upload.current?.click()}><Camera size={17}/>{uploading ? "正在上传…" : "更换头像"}</button>
            <input ref={upload} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending || uploading} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void uploadAvatar(file); }}/>
            <p>支持 JPG、PNG、WebP，最大 4 MB；上传后请保存。</p>
            {avatar && <button type="button" className="text-button" disabled={pending || uploading} onClick={() => { setAvatar(""); edited(); }}>移除头像</button>}
          </div>
        </div>
        <div className="account-profile-fields">
          <Input id="profile-username" label="登录账号" value={user!.username} readOnly hint="账号用于登录，暂不支持修改。"/>
          <Input id="profile-name" label="姓名" value={name} required maxLength={60} disabled={pending || uploading} onChange={event => { setName(event.target.value); edited(); }}/>
          <Input id="profile-phone" label="手机号" type="tel" value={phone} maxLength={40} disabled={pending || uploading} hint="仅用于联系，尚未进行短信核验。" onChange={event => { setPhone(event.target.value); edited(); }}/>
          <Input id="profile-company" label="企业名称" value={company} maxLength={150} disabled={pending || uploading} onChange={event => { setCompany(event.target.value); edited(); }}/>
        </div>
        <ErrorNotice error={error}/>
        <CloudFeedback only="profile" onKeep={() => persist(true)} onResolved={kept => { setError(null); setSuccess(kept ? "个人信息已保存。" : "已读取云端个人信息。"); }}/>
        {success && <p className="account-settings-success" role="status"><CheckCircle size={18} weight="fill"/>{success}</p>}
        <div className="account-profile-actions"><button className="button primary" disabled={pending || uploading}>{pending ? "正在保存…" : "保存个人信息"}</button></div>
      </form>
    </section>}
    <section className="v3-account-panel account-profile-panel">
      <header className="account-settings-section-heading"><h2><MapPin size={20}/>当前园区{!parkOnly && <span className="account-settings-out-of-scope">本次需求不包括，请忽略</span>}</h2><p>园区决定当前可采购的商品，购物车按园区分别保存。</p></header>
      <div className="account-settings-row"><div><strong>{parks.isPending ? "正在读取园区…" : currentPark?.name || (user?.currentParkId ? "园区信息暂不可用" : "尚未选择园区")}</strong>{currentPark?.address && <p>{currentPark.address}</p>}</div><button className="button secondary" disabled={pending || uploading || (!parkOnly && dirty)} onClick={() => { setSuccess(""); setParkOpen(true); }}>{user?.currentParkId ? "切换园区" : "选择园区"}</button></div>
      {!parkOnly && dirty && <p className="field-hint">个人信息有未保存的修改，请先保存后切换园区。</p>}
      <ErrorNotice error={parks.error}/>{parks.isError && <button type="button" className="text-button" onClick={() => void parks.refetch()}>重新加载园区</button>}
    </section>
    {!parkOnly && <section className="v3-account-panel account-profile-panel">
      <header className="account-settings-section-heading"><h2><ShieldCheck size={20}/>账号安全<span className="account-settings-out-of-scope">本次需求不包括，请忽略</span></h2></header>
      <div className="account-settings-row"><div><strong>登录密码</strong><p>验证当前密码后，设置新的登录密码。</p></div><button className="button secondary" disabled={pending || uploading} onClick={() => openAuth({mode:"reset", returnTo:"/account/profile"})}>修改密码</button></div>
      <div className="account-settings-row"><div><strong>退出当前账号</strong><p>退出后可重新登录或切换其他账号。</p></div><button className="button secondary" disabled={pending || uploading} onClick={async () => { setPending(true); setError(null); setSuccess(""); try { await logout(); } catch (failure) { setError(failure); } finally { setPending(false); } }}>退出登录</button></div>
    </section>}
    <ParkDialog open={parkOpen} onOpenChange={setParkOpen}/>
  </div>;
}
