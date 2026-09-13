import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  parkPanoramaImage,
  parkPanoramaSpots,
  type ParkPanoramaSpot,
} from "../../data/industryMap";
import { parkName } from "../../data";
import { publicUrl } from "../../utils/publicUrl";

type Props = {
  onSelectSpot?: (spot: ParkPanoramaSpot) => void;
};

/** 真实照片全景：横向拖拽环视 + 点位热点 */
export function ParkPanorama({ onSelectSpot }: Props) {
  const [yaw, setYaw] = useState(18);
  const [pitch, setPitch] = useState(0);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const [activeId, setActiveId] = useState(parkPanoramaSpots[0]?.id ?? "");

  const activeSpot = useMemo(
    () => parkPanoramaSpots.find((s) => s.id === activeId) ?? parkPanoramaSpots[0],
    [activeId],
  );

  const onPointerDown = (e: ReactPointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setYaw((drag.current.yaw + dx * 0.18 + 360) % 360);
    setPitch(Math.max(-16, Math.min(16, drag.current.pitch - dy * 0.08)));
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const selectSpot = useCallback(
    (spot: ParkPanoramaSpot) => {
      setActiveId(spot.id);
      setYaw(spot.yaw);
      setPitch(spot.pitch * 0.35);
      onSelectSpot?.(spot);
    },
    [onSelectSpot],
  );

  // 横向实景：yaw 0→360 对应图片左→右
  const panX = (yaw / 360) * 100;
  const panY = pitch * 1.1;

  return (
    <div className="park-pano">
      <div
        className="park-pano-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label={`${parkName} 实景全景`}
      >
        <div
          className="park-pano-photo"
          style={{
            backgroundImage: `url(${publicUrl(parkPanoramaImage)})`,
            backgroundPosition: `${panX}% calc(42% + ${panY}px)`,
          }}
        />
        {activeSpot?.image && (
          <div
            className="park-pano-spot-focus"
            style={{ backgroundImage: `url(${publicUrl(activeSpot.image)})` }}
            aria-hidden
          />
        )}
        <div className="park-pano-vignette" aria-hidden />

        {parkPanoramaSpots.map((spot) => {
          const offset = ((spot.yaw - yaw + 540) % 360) - 180;
          const visible = Math.abs(offset) < 72;
          if (!visible) return null;
          return (
            <button
              key={spot.id}
              type="button"
              className={`park-pano-hotspot ${activeId === spot.id ? "on" : ""}`}
              style={{
                left: `calc(50% + ${offset * 7.2}px)`,
                top: `calc(48% + ${spot.pitch - pitch * 2}px)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectSpot(spot);
              }}
            >
              <span className="park-pano-pin" />
              <em>{spot.title}</em>
            </button>
          );
        })}

        <div className="park-pano-hud">
          <strong>园区实景全景</strong>
          <span>
            {activeSpot?.title ?? parkName} · 拖拽环视 · 点击热点
          </span>
        </div>
        <div className="park-pano-compass" aria-hidden>
          <b style={{ transform: `rotate(${-yaw}deg)` }}>N</b>
        </div>
      </div>

      <div className="park-pano-spots">
        {parkPanoramaSpots.map((s) => (
          <button
            key={s.id}
            type="button"
            className={activeId === s.id ? "on" : ""}
            onClick={() => selectSpot(s)}
          >
            <span
              className="park-pano-spot-thumb"
              style={{ backgroundImage: `url(${publicUrl(s.image)})` }}
              aria-hidden
            />
            <span className="park-pano-spot-text">
              <b>{s.title}</b>
              <span>{s.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
