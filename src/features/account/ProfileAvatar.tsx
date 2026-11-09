import { useEffect, useState } from "react";
import "./profile-avatar.css";

/** Keeps the existing avatar container and falls back when an image is unavailable. */
export function ProfileAvatar({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed
    ? <img className="profile-avatar-image" src={src} alt="" onError={() => setFailed(true)}/>
    : <>{name.slice(0, 1) || "我"}</>;
}
