import { useEffect, useMemo, useRef, useState } from "react";
import {
  ENTRY_AGREEMENTS,
  SIGN_FLOW_STEPS,
  type EntryAgreement,
} from "../data/entryAgreements";

type SignPatch = { agree?: boolean; faceVerified?: boolean; signed?: boolean };
type Phase = "read" | "face" | "seal" | "done";
type FaceStatus = "idle" | "wait" | "checking" | "pass";

type Props = {
  subjectName: string;
  displayName: string;
  contactName?: string;
  certNo?: string;
  agree: boolean;
  faceVerified: boolean;
  signed: boolean;
  canReuse?: boolean;
  onChange: (patch: SignPatch) => void;
};

export function EntryAgreementSign({
  subjectName,
  displayName,
  contactName,
  certNo,
  agree,
  faceVerified,
  signed,
  canReuse,
  onChange,
}: Props) {
  const allDone = faceVerified && signed && agree;
  const [phase, setPhase] = useState<Phase>(() =>
    signed ? "done" : faceVerified ? "seal" : "read",
  );
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("idle");
  const [viewing, setViewing] = useState<EntryAgreement | null>(null);
  const [sealing, setSealing] = useState(false);
  const timers = useRef<number[]>([]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const signer = contactName || displayName || subjectName || "经办人";
  const subject = subjectName || displayName || "入驻主体";
  const qrPayload = useMemo(
    () => `zqyq-face://${encodeURIComponent(signer)}/${certNo || "verify"}`,
    [signer, certNo],
  );

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (signed) setPhase("done");
  }, [signed]);

  useEffect(() => {
    if (faceStatus !== "wait") return;
    // 演示环境：等待扫码状态保持，需用户点「模拟已扫码」或真实回调
  }, [faceStatus]);

  useEffect(() => {
    if (faceStatus !== "checking") return;
    clearTimers();
    schedule(() => {
      onChangeRef.current({ faceVerified: true });
      setFaceStatus("pass");
      schedule(() => setPhase("seal"), 700);
    }, 1400);
    return clearTimers;
  }, [faceStatus]);

  const startAuthorize = () => {
    if (!agree) return;
    clearTimers();
    setFaceStatus("idle");
    setPhase("face");
    onChange({ faceVerified: false, signed: false });
  };

  const startQrVerify = () => setFaceStatus("wait");

  const simulateScanned = () => {
    if (faceStatus !== "wait") return;
    setFaceStatus("checking");
  };

  const confirmSeal = () => {
    if (!faceVerified && faceStatus !== "pass") return;
    setSealing(true);
    schedule(() => {
      onChange({ faceVerified: true, signed: true });
      setSealing(false);
      setPhase("done");
    }, 900);
  };

  const reuseExisting = () => {
    clearTimers();
    onChange({ agree: true, faceVerified: true, signed: true });
    setFaceStatus("pass");
    setPhase("done");
  };

  const resetSign = () => {
    clearTimers();
    setSealing(false);
    setFaceStatus("idle");
    onChange({ faceVerified: false, signed: false });
    setPhase("read");
  };

  const stepIndex =
    phase === "read" ? 0 : phase === "face" ? 1 : phase === "seal" ? 2 : 3;

  return (
    <div className="sign-flow">
      <header className="sign-flow-head">
        <span className="sign-flow-icon" aria-hidden>
          📄
        </span>
        <div>
          <h3>入驻协议一次性签署</h3>
          <p className="sign-flow-sub">
            共 {ENTRY_AGREEMENTS.length} 份协议，完成一次授权、手机扫码人脸识别与电子签章后全部生效。
          </p>
        </div>
      </header>

      {canReuse && (
        <div className="sign-flow-reuse">
          <button type="button" className="btn btn-outline btn-sm" onClick={reuseExisting}>
            沿用已有签署
          </button>
          {allDone && (
            <button type="button" className="btn btn-ghost-dark btn-sm" onClick={resetSign}>
              重新签署
            </button>
          )}
        </div>
      )}

      <ol className="sign-flow-steps">
        {SIGN_FLOW_STEPS.map((label, i) => {
          const done = i < stepIndex || phase === "done";
          const active = i === stepIndex && phase !== "done";
          const cls = [done ? "done" : "", active ? "on" : ""].filter(Boolean).join(" ");
          return (
            <li key={label} className={cls}>
              <b>{done && !active ? "✓" : i + 1}</b>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>

      {phase === "read" && (
        <>
          <div className="agreement-list">
            <div className="agreement-list-head">
              <strong>协议清单</strong>
              <span>共 {ENTRY_AGREEMENTS.length} 份，一次签署全部生效</span>
            </div>
            <ul>
              {ENTRY_AGREEMENTS.map((item) => (
                <li key={item.id}>
                  <div className="agreement-item-main">
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </div>
                  <button
                    type="button"
                    className="agreement-view-link"
                    onClick={() => setViewing(item)}
                  >
                    查看全文
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <label className="sign-consent-bar">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => onChange({ agree: e.target.checked })}
            />
            <span className="sign-consent-text">
              我已阅读并同意上述全部协议，授权平台进行一次手机扫码人脸识别与一次电子签章，对全部协议同时生效。
            </span>
          </label>

          <button
            type="button"
            className="btn btn-sign-once"
            disabled={!agree}
            onClick={startAuthorize}
          >
            <span className="btn-sign-once-icon" aria-hidden>
              📱
            </span>
            一次性授权并签署
          </button>
        </>
      )}

      {phase === "face" && (
        <div className="face-scan-panel">
          <div className="face-scan-qr">
            <DemoQr payload={qrPayload} />
            <span>请使用手机扫描</span>
          </div>
          <div className="face-scan-body">
            <h4>人脸识别核验</h4>
            <p>
              请经办人「{signer}」使用手机扫描左侧二维码完成人脸识别，一次核验即可签署全部{" "}
              {ENTRY_AGREEMENTS.length} 份协议。
            </p>
            <ul className="face-scan-meta">
              <li>
                核验人：<b>{signer}</b>
              </li>
              <li>
                证件号：<b>{maskId(certNo)}</b>
              </li>
              <li>
                签署主体：<b>{subject}</b>
              </li>
            </ul>

            <div className="face-scan-status">
              {faceStatus === "idle" && (
                <button type="button" className="btn btn-primary btn-sm" onClick={startQrVerify}>
                  开始扫码核验
                </button>
              )}
              {faceStatus === "wait" && (
                <div className="face-scan-wait">
                  <span className="face-scan-spinner" aria-hidden />
                  等待手机扫码…
                </div>
              )}
              {faceStatus === "checking" && (
                <div className="face-scan-wait">
                  <span className="face-scan-spinner" aria-hidden />
                  正在进行人脸识别…
                </div>
              )}
              {faceStatus === "pass" && (
                <div className="face-scan-pass">✓ 识别通过，正在进入电子签章</div>
              )}
            </div>

            {faceStatus === "wait" && (
              <button type="button" className="face-scan-demo" onClick={simulateScanned}>
                演示：模拟手机已扫码
              </button>
            )}
            <button
              type="button"
              className="face-scan-back"
              onClick={() => {
                clearTimers();
                setFaceStatus("idle");
                setPhase("read");
              }}
            >
              返回阅读协议
            </button>
          </div>
        </div>
      )}

      {phase === "seal" && (
        <div className="face-seal-panel">
          <div className="face-seal-banner">
            ✓ 人脸识别已通过，请完成电子签章，签章将加盖在全部协议上。
          </div>
          <div className="face-seal-info">
            <div>
              签署主体：<b>{subject}</b>
            </div>
            <div>
              签署人：<b>{signer}</b>
            </div>
            <div>
              文件：一次性签署 {ENTRY_AGREEMENTS.map((a) => `《${a.title}》`).join("、")}
            </div>
          </div>
          <div className="face-seal-preview" aria-hidden>
            <div className="face-seal-stamp">
              <span>{subject.slice(0, 8)}</span>
              <em>电子印章</em>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sign-once"
            disabled={sealing}
            onClick={confirmSeal}
          >
            <span className="btn-sign-once-icon" aria-hidden>
              {sealing ? "…" : "🔏"}
            </span>
            {sealing ? "签章生效中…" : "确认电子签章并生效"}
          </button>
          <button type="button" className="face-scan-back" onClick={() => setPhase("face")}>
            返回人脸核验
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="sign-flow-done">
          <span className="sign-flow-done-badge">✓</span>
          <div>
            <strong>全部协议已生效</strong>
            <p>
              已通过手机扫码人脸识别，并对 {ENTRY_AGREEMENTS.length} 份协议完成电子签章。签章主体：
              {subject}
            </p>
          </div>
        </div>
      )}

      {phase === "done" && !canReuse && (
        <button type="button" className="btn btn-ghost-dark btn-sm" onClick={resetSign}>
          重新签署
        </button>
      )}

      {viewing && (
        <div className="agreement-modal-backdrop" onClick={() => setViewing(null)}>
          <div
            className="agreement-modal"
            role="dialog"
            aria-labelledby="agreement-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h4 id="agreement-modal-title">{viewing.title}</h4>
              <button type="button" className="agreement-modal-close" onClick={() => setViewing(null)}>
                ×
              </button>
            </header>
            <div className="agreement-modal-body">
              <p className="agreement-modal-summary">{viewing.summary}</p>
              <pre>{viewing.body}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function maskId(id?: string) {
  if (!id) return "—";
  const s = id.trim();
  if (s.length < 8) return s;
  return `${s.slice(0, 4)}********${s.slice(-4)}`;
}

/** 演示用二维码图案（按 payload 生成稳定伪随机矩阵） */
function DemoQr({ payload }: { payload: string }) {
  const size = 21;
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) h = Math.imul(h ^ payload.charCodeAt(i), 16777619);
  const cells: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      const inFinder =
        (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
      if (inFinder) {
        const dx = x < 7 ? x : x - (size - 7);
        const dy = y < 7 ? y : y - (size - 7);
        cells[y][x] =
          dx === 0 ||
          dy === 0 ||
          dx === 6 ||
          dy === 6 ||
          (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      } else {
        cells[y][x] = ((h + x * 19 + y * 37) & 3) !== 0;
      }
    }
  }
  const s = 6;
  return (
    <svg
      className="face-qr-svg"
      width={size * s}
      height={size * s}
      viewBox={`0 0 ${size * s} ${size * s}`}
      aria-label="人脸识别二维码"
    >
      <rect width={size * s} height={size * s} fill="#fff" />
      {cells.flatMap((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill="#0f172a" />
          ) : null,
        ),
      )}
    </svg>
  );
}
