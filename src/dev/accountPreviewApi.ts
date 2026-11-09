/** Only imported by a __DEMO__ build; unsupported actions never reach a backend. */
export async function accountPreviewRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if(path === "/auth/password" && options.method === "POST") {
    const body = JSON.parse(String(options.body || "{}"));
    await (await import("./previewAuth")).changePreviewPassword(body.currentPassword, body.newPassword);
    return {} as T;
  }
  if(path === "/parks") return [
    {id:"park-lingang",name:"上海临港新片区智能制造产业园",address:"上海市浦东新区"},
    {id:"park-suzhou",name:"苏州工业园区企业服务中心",address:"江苏省苏州市"},
    {id:"park-zhengzhou",name:"郑州航空港产业园",address:"河南省郑州市"},
  ] as T;
  if(/^\/me\/parks\/[^/]+\/join$/.test(path)) return {} as T;
  if(path === "/media?purpose=avatar" && options.body instanceof Blob) {
    const url = await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("图片读取失败"));reader.readAsDataURL(options.body as Blob);});
    return {url} as T;
  }
  throw new Error("此原型操作尚未提供本地模拟：" + path);
}
