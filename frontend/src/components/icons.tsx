import { SVGProps } from 'react';

/**
 * Icônes SVG inline minimalistes (trait, style "line icons"), pour éviter
 * toute dépendance externe (lucide-react, etc.) et garder le bundle léger.
 * Toutes acceptent les props SVG standard (className, etc.).
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

export function TruckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M1 3h13v13H1z" />
      <path d="M14 8h4l4 4v4h-8V8z" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

export function ShipIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 15l1.5 4.5a2 2 0 0 0 1.9 1.4h11.2a2 2 0 0 0 1.9-1.4L21 15" />
      <path d="M5 15V9h14v6" />
      <path d="M12 9V3" />
      <path d="M9 3h6" />
    </svg>
  );
}

export function PlaneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12l19-8-7 19-3-8-8-3z" />
    </svg>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 22s7-7.4 7-12.5A7 7 0 0 0 5 9.5C5 14.6 12 22 12 22z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2l8 3.5v6c0 5-3.4 8.6-8 10.5-4.6-1.9-8-5.5-8-10.5v-6L12 2z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 21l1.4-4.1A8 8 0 1 1 8 19.5L3 21z" />
      <path d="M8.5 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1.1-.5.9-1.1l-.4-1.1a.9.9 0 0 0-1-.6l-1 .2a4.4 4.4 0 0 1-2.4-2.4l.2-1a.9.9 0 0 0-.6-1L8.6 8a.9.9 0 0 0-1.1.9z" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.8 2.6 4.2 5.7 4.2 9s-1.4 6.4-4.2 9c-2.8-2.6-4.2-5.7-4.2-9s1.4-6.4 4.2-9z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function AwardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="5" />
      <path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5" />
    </svg>
  );
}

export function HeadsetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2.5" y="13" width="4.5" height="6" rx="1.5" />
      <rect x="17" y="13" width="4.5" height="6" rx="1.5" />
      <path d="M19.5 19v1a3 3 0 0 1-3 3h-3" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </svg>
  );
}
