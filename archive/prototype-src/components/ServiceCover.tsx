import { useState } from "react";
import type { EnterpriseService } from "../data/enterpriseServices";
import { publicUrl } from "../utils/publicUrl";

type Props = {
  service: EnterpriseService;
};

/** 服务封面：优先真实图片，加载失败时回退色块 */
export function ServiceCover({ service }: Props) {
  const [broken, setBroken] = useState(false);
  const hasImage = Boolean(service.image) && !broken;

  return (
    <div className={`svc-card-cover ${hasImage ? "has-image" : `tone-${service.tone}`}`}>
      {service.hot && <span className="svc-card-hot">热销</span>}
      {hasImage ? (
        <img
          src={publicUrl(service.image!)}
          alt={service.name}
          className="svc-card-cover-img"
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="svc-card-mark">{service.category.slice(0, 2)}</span>
      )}
    </div>
  );
}
