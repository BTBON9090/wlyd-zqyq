import { useEffect, useRef, useState } from "react";
import { MapPin, CaretDown, Plus } from "@phosphor-icons/react";
import { useApp } from "../../app/AppProvider";
import { Modal } from "../../components/ui";
import { blankBook, type Address, type Book } from "./delivery";
import regions from "china-division/dist/pca-code.json";
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
  return blankBook;
}
export function useDelivery() {
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
  const book = read(key),
    active = book.entries.find((a) => a.id === book.selected);
  const save = (next: Book) => {
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event("delivery-change"));
  };
  return {
    key,
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
function RegionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLFieldSetElement>(null);
  const [province, setProvince] = useState(
    () => regions.find((p) => value.startsWith(p.name))?.code || "",
  );
  const provinceData = regions.find((p) => p.code === province);
  const [city, setCity] = useState(
    () =>
      provinceData?.children.find((c) => value.includes(c.name))?.code ||
      (provinceData?.children.length === 1
        ? provinceData.children[0].code
        : ""),
  );
  const cityData = provinceData?.children.find((c) => c.code === city);
  const [level, setLevel] = useState<"province" | "city" | "district">(
    "province",
  );
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <fieldset
      className="buyer-region-select"
      ref={root}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <legend>省市区</legend>
      <button
        type="button"
        className="buyer-region-trigger"
        aria-label="选择省市区"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(!open);
          setLevel(province ? (city ? "district" : "city") : "province");
        }}
      >
        <span>{value || "请选择省、市、区"}</span>
        <CaretDown size={16} />
      </button>
      {open && (
        <div
          className="buyer-region-menu"
          role="dialog"
          aria-label="选择省市区"
        >
          <div className="buyer-region-tabs">
            <button
              type="button"
              aria-pressed={level === "province"}
              onClick={() => setLevel("province")}
            >
              {provinceData?.name || "选择省份"}
            </button>
            <button
              type="button"
              disabled={!province}
              aria-pressed={level === "city"}
              onClick={() => setLevel("city")}
            >
              {cityData?.name === "市辖区"
                ? provinceData?.name
                : cityData?.name || "选择城市"}
            </button>
            <button
              type="button"
              disabled={!city}
              aria-pressed={level === "district"}
              onClick={() => setLevel("district")}
            >
              选择区县
            </button>
          </div>
          <div className="buyer-region-options">
            {level === "province"
              ? regions.map((p) => (
                  <button
                    type="button"
                    key={p.code}
                    onClick={() => {
                      setProvince(p.code);
                      const c =
                        p.children.length === 1 ? p.children[0].code : "";
                      setCity(c);
                      onChange("");
                      setLevel(c ? "district" : "city");
                    }}
                  >
                    {p.name}
                  </button>
                ))
              : level === "city"
                ? provinceData?.children.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      onClick={() => {
                        setCity(c.code);
                        onChange("");
                        setLevel("district");
                      }}
                    >
                      {c.name === "市辖区" ? provinceData.name : c.name}
                    </button>
                  ))
                : cityData?.children?.map((a) => (
                    <button
                      type="button"
                      key={a.code}
                      onClick={() => {
                        onChange(
                          [
                            provinceData?.name,
                            cityData.name === "市辖区" || cityData.name === "县"
                              ? ""
                              : cityData.name,
                            a.name,
                          ].join(""),
                        );
                        setOpen(false);
                      }}
                    >
                      {a.name}
                    </button>
                  ))}
          </div>
        </div>
      )}
    </fieldset>
  );
}
export function AddressPicker({
  delivery: d,
  checkout = false,
}: {
  delivery: Delivery;
  checkout?: boolean;
}) {
  const { book, active } = d;
  const [open, setOpen] = useState(false),
    [form, setForm] = useState<Address | null>(null),
    [hint, setHint] = useState(""),
    [makeDefault, setMakeDefault] = useState(false);
  function show() {
    setForm(null);
    setHint("");
    setOpen(true);
  }
  function choose(a: Address) {
    d.save({ ...book, selected: a.id, region: a.region });
    setOpen(false);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const a = {
      ...form,
      id: form.id || crypto.randomUUID(),
      receiver: form.receiver.trim(),
      phone: form.phone.trim(),
      region: form.region.trim(),
      street: form.street.trim(),
    };
    if (
      !a.receiver ||
      !a.region ||
      !a.street ||
      !/^\+?[\d][\d -]{5,19}$/.test(a.phone)
    ) {
      setHint("请填写收货人、有效联系电话、省市区和详细地址。");
      return;
    }
    d.save({
      ...book,
      entries: [...book.entries.filter((x) => x.id !== a.id), a],
      selected: a.id,
      region: a.region,
      defaultId: makeDefault
        ? a.id
        : book.defaultId === a.id
          ? undefined
          : book.defaultId || (!book.entries.length ? a.id : undefined),
    });
    setForm(null);
    setOpen(false);
  }
  return (
    <>
      <div className={checkout ? "buyer-address-card" : "buyer-destination"}>
        <MapPin size={checkout ? 24 : 18} weight="duotone" />
        <div>
          {checkout ? (
            <>
              <strong>
                {active ? (
                  <>
                    {active.receiver}{" "}
                    <span className="buyer-phone">{active.phone}</span>
                  </>
                ) : (
                  "尚未选择收货地址"
                )}
              </strong>
              <p>
                {active
                  ? active.region + " " + active.street
                  : "添加收货信息后即可提交订单。"}
              </p>
            </>
          ) : (
            <>
              <small>配送至</small>
              <button type="button" onClick={show} aria-label="切换">
                {active ? active.region + " " + active.street : "选择配送地址"}{" "}
                <CaretDown size={13} />
              </button>
            </>
          )}
        </div>
        {checkout && (
          <button type="button" onClick={show}>
            管理收货地址 <CaretDown size={13} />
          </button>
        )}
      </div>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={form ? (form.id ? "编辑收货地址" : "新增收货地址") : "配送地址"}
      >
        {form ? (
          <form className="buyer-address-form" onSubmit={submit}>
            <label>
              收货人
              <input
                required
                maxLength={40}
                placeholder="请输入收货人姓名"
                autoComplete="name"
                value={form.receiver}
                onChange={(e) => setForm({ ...form, receiver: e.target.value })}
              />
            </label>
            <label>
              联系电话
              <input
                required
                type="tel"
                placeholder="请输入联系电话"
                autoComplete="tel"
                maxLength={20}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <RegionSelect
              key={form.id || "new"}
              value={form.region}
              onChange={(region) => setForm({ ...form, region })}
            />
            <label>
              详细地址
              <input
                required
                maxLength={180}
                placeholder="街道、楼栋及门牌号"
                autoComplete="street-address"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
            </label>
            <label className="buyer-default-address">
              <input
                type="checkbox"
                checked={makeDefault}
                onChange={(e) => setMakeDefault(e.target.checked)}
              />
              设为默认地址
            </label>
            {hint && <p role="alert">{hint}</p>}
            <div className="buyer-address-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setForm(null);
                  setHint("");
                }}
              >
                返回
              </button>
              <button className="button primary">保存并使用</button>
            </div>
          </form>
        ) : (
          <div className="buyer-address-list">
            {book.entries.map((a) => (
              <article key={a.id}>
                <button onClick={() => choose(a)}>
                  <strong>
                    {a.receiver}　{a.phone}
                  </strong>
                  <span>
                    {a.region} {a.street}
                  </span>
                </button>
                <small>
                  {a.id === book.defaultId ? "默认" : ""}
                  {a.id === book.selected ? " 当前使用" : ""}
                </small>
                <button
                  onClick={() => {
                    setForm(a);
                    setMakeDefault(a.id === book.defaultId);
                    setHint("");
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={() => {
                    const entries = book.entries.filter((x) => x.id !== a.id);
                    const next = a.id === book.selected ? entries[0] : active;
                    d.save({
                      ...book,
                      entries,
                      defaultId:
                        book.defaultId === a.id ? undefined : book.defaultId,
                      selected: next?.id || "",
                      region: next?.region || "",
                    });
                  }}
                >
                  删除
                </button>
              </article>
            ))}
            {!book.entries.length && <p>还没有保存的收货地址。</p>}
            <div className="buyer-address-tools">
              <button
                className="button primary"
                onClick={() => {
                  setForm(empty);
                  setMakeDefault(!book.defaultId);
                  setHint("");
                }}
              >
                <Plus size={16} />
                新增地址
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
