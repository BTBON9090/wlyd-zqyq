import { UAT } from "../../uat/api";
import { useUat } from "../../uat/UatSessionProvider";
import { useEffect, useState } from "react";
import { MapPin, CaretDown, Plus, PencilSimple, Trash, CheckCircle } from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { Modal } from "../../components/ui";
import { blankBook, type Address, type Book } from "./delivery";
import { SHARED_PROCUREMENT } from './sharedApi';
import { RegionSelect } from "./RegionSelect";
import { defaultAddressInBook, removeAddressFromBook, saveAddressInBook } from "./addressBook";
import "./buyer-flow.css";

function read(key: string): Book {
  try {
    const b = JSON.parse(localStorage.getItem(key) || "null");
    if (
      b &&
      Array.isArray(b.entries) &&
      b.entries.every(
        (a: Address) =>
          a &&
          ["receiver", "phone", "region", "street", "id"].every(
            (k) => typeof a[k as keyof Address] === "string",
          ),
      )
    )
      return b;
  } catch {
    /* Empty or stale local address book. */
  }
  return SHARED_PROCUREMENT ? { entries: [{ id: 'demo-address', receiver: '演示收货人', phone: '13800000000', region: '上海市 / 上海市 / 浦东新区', street: '联调测试地址 1 号（虚构）' }], selected: 'demo-address', defaultId: 'demo-address', region: '上海市 / 上海市 / 浦东新区' } : blankBook;
}
export function useDelivery() {
  const uat = useUat();
  const { session } = useApp(),
    key = "procurement-addresses-v1:" + (session?.id || "guest");
  const [, refresh] = useState(0);
  useEffect(() => {
    const sync = () => refresh((n) => n + 1);
    window.addEventListener("storage", sync);
    window.addEventListener("delivery-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("delivery-change", sync);
    };
  }, []);
  const cloud = uat.entries.addresses.value;
  const book: Book = UAT ? (cloud && typeof cloud === "object" && !Array.isArray(cloud) && "entries" in cloud ? cloud as Book : blankBook) : read(key);
  const
    active = book.entries.find((a) => a.id === book.selected) || book.entries.find((a) => a.id === book.defaultId);
  const save = async (next: Book) => {
    if (UAT) return uat.update("addresses", next);
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event("delivery-change"));
    return true;
  };
  return {
    key,
    error: UAT ? uat.entries.addresses.error : "",
    resolveCloud: (keep: boolean) => uat.resolve("addresses", keep),
    synced: !UAT || (uat.entries.addresses.loaded && !uat.entries.addresses.saving && !uat.entries.addresses.revision),
    book,
    active,
    region: active?.region || book.region || "",
    save,
  };
}
type Delivery = ReturnType<typeof useDelivery>;
const empty: Address = {
  id: "",
  receiver: "",
  phone: "",
  region: "",
  street: "",
};
export function AddressPicker({
  delivery: d,
  checkout = false,
  management = false,
}: {
  delivery: Delivery;
  checkout?: boolean;
  management?: boolean;
}) {
  const { book, active } = d;
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false),
    [form, setForm] = useState<Address | null>(null),
    [removing, setRemoving] = useState<Address | null>(null),
    [hint, setHint] = useState(""),
    [notice, setNotice] = useState(""),
    [makeDefault, setMakeDefault] = useState(false);
  useEffect(() => {
    setOpen(false); setForm(null); setRemoving(null); setHint(""); setNotice("");
  }, [d.key]);
  function show() {
    setForm(null); setRemoving(null); setHint(""); setNotice(""); setOpen(true);
  }
  function addAddress() {
    setForm({ ...empty }); setRemoving(null); setMakeDefault(!book.defaultId);
    setHint(""); setNotice(""); setOpen(true);
  }
  function editAddress(address: Address) {
    setForm({ ...address }); setRemoving(null); setMakeDefault(address.id === book.defaultId);
    setHint(""); setNotice(""); setOpen(true);
  }
  async function saveBook(next: Book, success: string, close = false): Promise<boolean> {
    if (saving) return false;
    setSaving(true); setHint(""); setNotice("");
    try {
      if (!(await d.save(next))) {
        setHint("本次地址修改已保留，但尚未保存到云端，请处理同步提示。");
        return false;
      }
      if (close) { setForm(null); setRemoving(null); setOpen(false); }
      setNotice(success);
      return true;
    } catch (error) {
      setHint(error instanceof Error ? error.message : "地址保存失败，请重试。");
      return false;
    } finally { setSaving(false); }
  }
  async function choose(address: Address) {
    await saveBook({ ...book, selected: address.id, region: address.region }, "当前收货地址已更新", true);
  }
  async function setDefault(address: Address) {
    await saveBook(defaultAddressInBook(book, address), "默认收货地址已更新");
  }
  async function removeAddress() {
    if (!removing || saving) return;
    if (await saveBook(removeAddressFromBook(book, removing.id), "收货地址已删除", management)) {
      setRemoving(null);
    }
  }
  async function submit(event: React.FormEvent) { event.preventDefault(); await persist(); }
  async function persist(retry = false): Promise<boolean> {
    if (saving) return false;
    if (!form) return retry ? d.resolveCloud(true) : false;
    const address = { ...form, id: form.id || crypto.randomUUID(), receiver: form.receiver.trim(),
      phone: form.phone.trim(), region: form.region.trim(), street: form.street.trim() };
    if (!address.receiver || !address.region || !address.street || !/^\+?[\d][\d -]{5,19}$/.test(address.phone)) {
      setHint("请填写收货人、有效联系电话、省市区和详细地址。"); return false;
    }
    setForm(address); setSaving(true); setHint(""); setNotice("");
    try {
      const saved = await d.save(saveAddressInBook(book, address, makeDefault, !management || (makeDefault && book.defaultId !== address.id)));
      // Stage the current form before resolving: a second edit after a conflict must survive retry.
      const synced = saved || (retry && await d.resolveCloud(true));
      if (!synced) { setHint("地址修改尚未保存到云端，请处理同步提示后重试。"); return false; }
      setForm(null); setOpen(false); setNotice("收货地址已保存"); return true;
    } catch (error) {
      setHint(error instanceof Error ? error.message : "地址保存失败，请重试。"); return false;
    } finally { setSaving(false); }
  }
  async function resolve(keep: boolean) {
    if (saving) return;
    if (keep && form) { await persist(true); return; }
    setSaving(true);
    try {
      if (await d.resolveCloud(keep)) {
        setForm(null); setRemoving(null); setHint(""); setOpen(false);
        setNotice(keep ? "地址簿已保存" : "已读取云端地址簿");
      }
    } finally { setSaving(false); }
  }
  const feedback = d.error && <div className="notice error" role="alert"><div>
    <strong>地址修改尚未保存到云端</strong><p>{d.error} 本次修改已保留。</p>
    <div className="v3-dialog-actions"><button type="button" className="button secondary" disabled={saving} onClick={() => void resolve(true)}>保留本次修改并重试</button>
      <button type="button" className="text-button" disabled={saving} onClick={() => void resolve(false)}>读取云端并放弃本次修改</button></div>
  </div></div>;
  return <>
    {management ? <>
      <header className="account-address-heading"><div><h2>收货地址</h2><p>已保存 {book.entries.length} 个地址，与结算页使用同一地址簿。</p></div>
        <button type="button" className="button primary" disabled={saving} onClick={addAddress}><Plus size={16}/>新增地址</button></header>
      {notice && !d.error && <p className="account-address-notice" role="status"><CheckCircle size={18}/>{notice}</p>}
      {!open && feedback}
      {!open && hint && <p className="notice error" role="alert">{hint}</p>}
      {book.entries.length ? <div className="account-address-list">
        {book.entries.map(address => <article className={`account-address-card${address.id === book.defaultId ? " is-default" : ""}`} key={address.id}>
          <div className="account-address-content"><div className="account-address-person"><strong>{address.receiver}</strong><span>{address.phone}</span>
            {address.id === book.defaultId && <span className="account-address-default">默认地址</span>}
            {address.id === active?.id && <span className="account-address-current">当前使用</span>}</div>
            <p><MapPin size={16}/><span>{address.region} {address.street}</span></p></div>
          <div className="account-address-actions">
            {address.id !== book.defaultId && <button type="button" disabled={saving} onClick={() => void setDefault(address)}>设为默认</button>}
            <button type="button" disabled={saving} onClick={() => editAddress(address)}><PencilSimple size={16}/>编辑</button>
            <button type="button" className="is-remove" disabled={saving} onClick={() => {setRemoving(address); setForm(null); setHint(""); setNotice(""); setOpen(true);}}><Trash size={16}/>删除</button>
          </div>
        </article>)}
      </div> : <div className="account-address-empty"><MapPin size={44} weight="duotone"/><h3>还没有收货地址</h3><p>添加后，可在采购结算时直接选择使用。</p><button type="button" className="button secondary" onClick={addAddress}><Plus size={16}/>新增地址</button></div>}
    </> : <div className={checkout ? "buyer-address-card" : "buyer-destination"}>
      <MapPin size={checkout ? 24 : 18} weight="duotone"/><div>{checkout ? <><strong>{active ? <>{active.receiver} <span className="buyer-phone">{active.phone}</span></> : "尚未选择收货地址"}</strong>
        <p>{active ? active.region + " " + active.street : "添加收货信息后即可提交订单。"}</p></> : <><small>配送至</small><button type="button" onClick={show} aria-label="切换">{active ? active.region + " " + active.street : "选择配送地址"} <CaretDown size={13}/></button></>}</div>
      {checkout && <button type="button" onClick={show}>管理收货地址 <CaretDown size={13}/></button>}
    </div>}
    <Modal open={open} onOpenChange={value => { if (!saving) {setOpen(value); if (!value) {setForm(null); setRemoving(null); setHint("");}} }}
      title={removing ? "删除收货地址" : form ? (book.entries.some(item => item.id === form.id) ? "编辑收货地址" : "新增收货地址") : "配送地址"}
      footer={!form && !removing && <div className="buyer-address-tools"><button type="button" className="button primary" disabled={saving} onClick={addAddress}><Plus size={16}/>新增地址</button></div>}>
      {feedback}
      {removing ? <div className="buyer-address-confirm"><p>确认删除这个收货地址？已生成订单中的收货信息不受影响。</p><div><strong>{removing.receiver}　{removing.phone}</strong><p>{removing.region} {removing.street}</p></div>
        {hint && <p className="notice error" role="alert">{hint}</p>}<div className="buyer-address-actions"><button type="button" className="button secondary" disabled={saving} onClick={() => {setRemoving(null); setHint(""); if(management)setOpen(false);}}>取消</button><button type="button" className="button primary" disabled={saving} onClick={() => void removeAddress()}>{saving ? "正在删除…" : "确认删除"}</button></div>
      </div> : form ? <form className="buyer-address-form" onSubmit={submit}>
        <fieldset className="buyer-address-fields" disabled={saving}>
          <label>收货人<input required maxLength={40} placeholder="请输入收货人姓名" autoComplete="name" value={form.receiver} onChange={event => setForm({...form, receiver:event.target.value})}/></label>
          <label>联系电话<input required type="tel" placeholder="请输入联系电话" autoComplete="tel" maxLength={20} value={form.phone} onChange={event => setForm({...form, phone:event.target.value})}/></label>
          <RegionSelect key={form.id || "new"} value={form.region} onChange={region => setForm({...form,region})}/>
          <label>详细地址<input required maxLength={180} placeholder="街道、楼栋及门牌号" autoComplete="street-address" value={form.street} onChange={event => setForm({...form,street:event.target.value})}/></label>
          {form.id && form.id === book.defaultId ? <span className="buyer-address-default-state"><CheckCircle size={17}/>默认地址</span> : <label className="buyer-default-address"><input type="checkbox" checked={makeDefault} onChange={event => setMakeDefault(event.target.checked)}/>设为默认地址</label>}
        </fieldset>
        {hint && <p role="alert">{hint}</p>}<div className="buyer-address-actions"><button type="button" className="button secondary" disabled={saving} onClick={() => {setForm(null);setHint("");if(management)setOpen(false);}}>{management ? "取消" : "返回"}</button><button className="button primary" disabled={saving}>{saving ? "保存中…" : management ? "保存地址" : "保存并使用"}</button></div>
      </form> : <div className="buyer-address-list">
        {notice && !d.error && <p role="status">{notice}</p>}
        {hint && <p className="notice error" role="alert">{hint}</p>}
        {book.entries.map(address => <article key={address.id}><button disabled={saving} onClick={() => void choose(address)}><strong>{address.receiver}　{address.phone}</strong><span>{address.region} {address.street}</span></button>
          <small>{address.id === book.defaultId ? "默认" : ""}{address.id === active?.id ? " 当前使用" : ""}</small>
          <button disabled={saving} onClick={() => editAddress(address)}>编辑</button>
          <button disabled={saving} onClick={() => {setRemoving(address);setHint("");setNotice("");}}>删除</button></article>)}
        {!book.entries.length && <p>还没有保存的收货地址。</p>}
      </div>}
    </Modal>
  </>;
}
