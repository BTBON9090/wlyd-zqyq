import { useState, type ReactNode } from "react";
import { useApp } from "../app/AppProvider";
import { Context } from "../uat/UatSessionProvider";
import { emptyEntries, type Entries } from "../uat/cloudState";
import type { StateKey, UatUser } from "../uat/api";

export default function AccountPreviewProvider({children}: {children: ReactNode}) {
  const app = useApp();
  const key = "park-account-preview:" + (app.session?.id || "guest");
  const [entries, setEntries] = useState<Entries>(() => {
    const initial = emptyEntries();
    Object.values(initial).forEach(entry => {entry.loaded = true;});
    initial.profile.value = {contactName: app.session?.name || "林远", phone: app.session?.phone || "13800000000", company: app.session?.enterprise || "园区示例企业"};
    initial.preferences.value = {currentParkId: "park-lingang"};
    try { const saved = JSON.parse(localStorage.getItem(key) || "null"); if(saved) for (const name of ["profile", "preferences"] as const) if(saved[name]) initial[name].value = saved[name]; } catch { /* New preview account. */ }
    return initial;
  });
  const profile = entries.profile.value as Record<string,string>;
  const user: UatUser = {id: app.session?.id || "preview-buyer", username: localStorage.getItem("park-preview-username") || "preview_buyer", displayName: profile.contactName || "林远", role: "buyer", parkIds: ["park-lingang", "park-suzhou"], currentParkId: String((entries.preferences.value as {currentParkId?:string}).currentParkId || "park-lingang")};
  async function update(name: StateKey, value: unknown) {
    const next = {...entries, [name]: {...entries[name], value, version: entries[name].version + 1}};
    localStorage.setItem(key, JSON.stringify({profile: next.profile.value, preferences: next.preferences.value}));
    setEntries(next);
    if(name === "profile" && app.session) {
      const p=value as Record<string,string>;
      const session={...app.session,name:p.contactName,phone:p.phone,enterprise:p.company};
      (await import("./mockGateway")).setDemoSession(session); app.setSession(session);
    }
    return true;
  }
  return <Context.Provider value={{user, entries, loading:false, error:"", update, resolve:async()=>true, loadStates:async()=>{}, refreshSession:async()=>{}, logout:app.logout, authenticate:async()=>{throw new Error("请通过原型登录弹窗或验收工具登录。");}}}>{children}</Context.Provider>;
}
