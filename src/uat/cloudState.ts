import type { CloudValue, StateKey } from "./api";
export type StateEntry = CloudValue & {
  loaded: boolean;
  saving: boolean;
  error: string;
  conflict: boolean;
  revision: number;
};
export type Entries = Record<StateKey, StateEntry>;
type Request = <T>(path: string, options?: RequestInit) => Promise<T>;
export const stateKeys: StateKey[] = [
  "cart",
  "addresses",
  "preferences",
  "onboarding",
  "profile",
];
export const emptyEntries = (): Entries =>
  Object.fromEntries(
    stateKeys.map((key) => [
      key,
      {
        value: key === "cart" || key === "addresses" ? [] : {},
        version: 0,
        loaded: false,
        saving: false,
        error: "",
        conflict: false,
        revision: 0,
      },
    ]),
  ) as Entries;

/** Per-login state. Writes to each document are serialized; drafts survive failures. */
export class CloudStateStore {
  entries = emptyEntries();
  private epoch = 0;
  private flights: Partial<Record<StateKey, Promise<boolean>>> = {};
  private request: Request;
  private changed: (entries: Entries) => void;
  constructor(request: Request, changed: (entries: Entries) => void) {
    this.request = request;
    this.changed = changed;
  }
  private publish() {
    this.changed({ ...this.entries });
  }
  reset() {
    this.epoch++;
    this.flights = {};
    this.entries = emptyEntries();
    this.publish();
  }
  async load(key: StateKey) {
    const token = this.epoch,
      before = this.entries[key];
    try {
      const result = await this.request<CloudValue>(`/me/state/${key}`);
      if (
        token !== this.epoch ||
        this.entries[key] !== before ||
        before.saving ||
        before.revision
      )
        return;
      this.entries[key] = {
        ...result,
        loaded: true,
        saving: false,
        error: "",
        conflict: false,
        revision: 0,
      };
      this.publish();
    } catch (e) {
      if (token !== this.epoch || this.entries[key] !== before) return;
      this.entries[key] = {
        ...before,
        error: e instanceof Error ? e.message : "云端资料加载失败",
      };
      this.publish();
    }
  }
  async loadAll() {
    await Promise.all(stateKeys.map((key) => this.load(key)));
  }
  async update(key: StateKey, value: unknown): Promise<boolean> {
    const old = this.entries[key];
    if (!old.loaded) return false;
    this.entries[key] = {
      ...old,
      value: typeof value === "function" ? value(old.value) : value,
      revision: old.revision + 1,
    };
    this.publish();
    return this.flush(key);
  }
  private async flush(key: StateKey): Promise<boolean> {
    if (this.flights[key]) return this.flights[key]!;
    const token = this.epoch;
    const work = (async () => {
      while (token === this.epoch) {
        const entry = this.entries[key];
        if (!entry.revision) return true;
        if (entry.error) return false;
        const revision = entry.revision;
        this.entries[key] = { ...entry, saving: true };
        this.publish();
        try {
          const saved = await this.request<CloudValue>(`/me/state/${key}`, {
            method: "PUT",
            body: JSON.stringify({
              value: entry.value,
              version: entry.version,
            }),
          });
          if (token !== this.epoch) return false;
          const current = this.entries[key],
            newer = current.revision !== revision;
          this.entries[key] = {
            ...current,
            value: newer ? current.value : saved.value,
            version: saved.version,
            saving: newer,
            revision: newer ? current.revision : 0,
          };
          this.publish();
          if (!newer) return true;
        } catch (e) {
          if (token !== this.epoch) return false;
          this.entries[key] = {
            ...this.entries[key],
            saving: false,
            error: e instanceof Error ? e.message : "云端保存失败",
            conflict:
              !!e && typeof e === "object" && "status" in e && e.status === 409,
          };
          this.publish();
          return false;
        }
      }
      return false;
    })();
    this.flights[key] = work;
    try {
      return await work;
    } finally {
      if (token === this.epoch) delete this.flights[key];
    }
  }
  async resolve(
    key: StateKey,
    keep: boolean,
    confirm: (message: string) => boolean,
  ): Promise<boolean> {
    const token = this.epoch;
    try {
      const remote = await this.request<CloudValue>(`/me/state/${key}`);
      if (token !== this.epoch) return false;
      if (
        keep &&
        (this.entries[key].conflict ||
          remote.version !== this.entries[key].version) &&
        !confirm(
          "云端版本已变化。确认用当前页面保留的修改替换云端该项资料？其他设备的这项修改将被替换。",
        )
      )
        return false;
      if (
        !keep &&
        !confirm("确认读取云端版本，并放弃当前页面尚未保存的这项修改？")
      )
        return false;
      this.entries[key] = {
        ...this.entries[key],
        version: remote.version,
        value: keep ? this.entries[key].value : remote.value,
        loaded: true,
        error: "",
        conflict: false,
        revision: keep ? Math.max(1, this.entries[key].revision) : 0,
      };
      this.publish();
      if (keep) return this.flush(key);
      return true;
    } catch (e) {
      if (token === this.epoch) {
        this.entries[key] = {
          ...this.entries[key],
          error: e instanceof Error ? e.message : "读取云端失败",
        };
        this.publish();
      }
      return false;
    }
  }
}
