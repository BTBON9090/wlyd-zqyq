import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={32} height={32} {...props}>
      <path d="M8 22V10l8-3 8 3v12l-8 3-8-3z" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
      <path d="M16 7v18M8 10l8 3 8-3" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.5 16.5L21 21" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconCart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h2l1.5 10h9L19 8H7" />
      <circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBank(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10l8-5 8 5" />
      <path d="M6 10v7M10 10v7M14 10v7M18 10v7" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function IconBrief(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="8" width="16" height="11" rx="1.5" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
}

export function IconMegaphone(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 14v-4l12-5v14L5 14z" />
      <path d="M5 10v4a3 3 0 0 0 3 3" />
    </svg>
  );
}

export function IconMap(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7l5-2 6 2 5-2v14l-5 2-6-2-5 2V7z" />
      <path d="M9 5v14M15 7v14" />
    </svg>
  );
}

export function IconNews(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 5h9a3 3 0 0 1 3 3v11H8a2 2 0 0 1-2-2V5z" />
      <path d="M9 9h6M9 13h6M9 17h3" />
    </svg>
  );
}

export function IconSend(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M4 12l16-8-6 16-2-6-8-2z" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function IconSpark(props: IconProps) {
  return (
    <svg {...base} width={26} height={26} {...props}>
      <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z" />
      <path d="M18 14l.7 2.2 2.3.8-2.3.8L18 20l-.7-2.2-2.3-.8 2.3-.8L18 14z" />
    </svg>
  );
}

export function IconSwitchArrows(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M16 7H4M4 7l3-3M4 7l3 3" />
      <path d="M8 17h12M20 17l-3-3M20 17l-3 3" />
    </svg>
  );
}

export function ParkSkyline() {
  return (
    <svg className="hero-skyline" viewBox="0 0 640 360" fill="none" aria-hidden>
      <path
        d="M40 300V210h36v90M90 300V160h48v140M152 300V190h28v110M200 300V120l40-18 40 18v180M292 300V175h22v125M330 300V205h54v95M400 300V140h18v160M432 300V168h62v132M510 300V188h36v112M560 300V150h40v150"
        stroke="#FFFFFF"
        strokeOpacity="0.32"
        strokeWidth="1.2"
      />
      <path d="M220 120v-36M240 102h-40" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.2" />
      <circle cx="240" cy="78" r="7" stroke="#FFFFFF" strokeOpacity="0.75" />
      <path d="M0 300h640" stroke="#FFFFFF" strokeOpacity="0.55" />
      <rect x="214" y="148" width="12" height="10" fill="#FFFFFF" fillOpacity="0.28" />
      <rect x="246" y="148" width="12" height="10" fill="#FFFFFF" fillOpacity="0.28" />
      <rect x="214" y="172" width="12" height="10" fill="#FFFFFF" fillOpacity="0.16" />
      <rect x="246" y="172" width="12" height="10" fill="#FFFFFF" fillOpacity="0.16" />
    </svg>
  );
}
