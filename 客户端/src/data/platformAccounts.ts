const SHARED_PHONES_KEY = "park-platform-registered-phones";

/** 演示：预置已在供应商端可用的手机号 */
const SEED_PHONES = ["13800138888", "13800138000", "13900139000"];

function readPhones(): Set<string> {
  try {
    const raw = localStorage.getItem(SHARED_PHONES_KEY);
    if (!raw) return new Set(SEED_PHONES);
    const parsed = JSON.parse(raw) as string[];
    return new Set([...SEED_PHONES, ...parsed]);
  } catch {
    return new Set(SEED_PHONES);
  }
}

/** 园区客户端注册成功后，写入共享手机号列表（供应商端登录校验用） */
export function registerPhoneOnPlatform(phone: string) {
  const phones = readPhones();
  phones.add(phone);
  localStorage.setItem(SHARED_PHONES_KEY, JSON.stringify([...phones]));
}

export function isPhoneRegisteredOnPlatform(phone: string) {
  return readPhones().has(phone);
}
