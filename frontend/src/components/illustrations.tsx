import { SVGProps } from 'react';

/**
 * Illustrations vectorielles "maison" (pas d'images externes / stock photos)
 * pour la page d'accueil : une scène camion + autoroute + suivi GPS, et une
 * scène porte-conteneurs au coucher du soleil. Dessinées à la main en SVG
 * pour rester légères, cohérentes avec la palette brand/ink, et 100% libres
 * de droits.
 */
type IllustrationProps = SVGProps<SVGSVGElement>;

export function TruckHeroIllustration(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 600 420" {...props}>
      <defs>
        <linearGradient id="truckSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111a2e" />
          <stop offset="100%" stopColor="#0b1220" />
        </linearGradient>
        <linearGradient id="truckRoad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#182238" />
          <stop offset="100%" stopColor="#0b1220" />
        </linearGradient>
        <radialGradient id="truckGlow" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="600" height="420" rx="24" fill="url(#truckSky)" />
      <circle cx="300" cy="150" r="220" fill="url(#truckGlow)" />

      {/* route en perspective */}
      <path d="M -20 340 L 240 250 L 360 250 L 620 340 Z" fill="url(#truckRoad)" />
      <path
        d="M 300 250 L 300 340"
        stroke="#f97316"
        strokeWidth="4"
        strokeDasharray="10 10"
        opacity="0.6"
      />
      <path d="M -20 340 L 620 340" stroke="#f97316" strokeOpacity="0.25" strokeWidth="2" />

      {/* itinéraire pointillé vers le pin GPS */}
      <path
        d="M 120 300 C 180 230, 250 210, 330 150 S 430 90, 470 70"
        fill="none"
        stroke="#fb923c"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
      <circle cx="120" cy="300" r="5" fill="#f97316" />
      <circle cx="330" cy="150" r="5" fill="#f97316" />

      {/* pin GPS */}
      <g transform="translate(452, 30)">
        <circle cx="18" cy="18" r="26" fill="#f97316" opacity="0.18" />
        <path
          d="M18 2c9.4 0 17 7.6 17 17 0 12.7-17 27-17 27S1 31.7 1 19C1 9.6 8.6 2 18 2z"
          fill="#f97316"
        />
        <circle cx="18" cy="18" r="7" fill="white" />
      </g>

      {/* remorque */}
      <g transform="translate(150, 175)">
        <rect x="0" y="0" width="150" height="90" rx="8" fill="#e2e8f0" />
        <rect x="0" y="0" width="150" height="90" rx="8" fill="white" fillOpacity="0.06" />
        <rect x="10" y="10" width="130" height="70" rx="4" fill="#182238" />
        <rect x="18" y="18" width="45" height="54" rx="3" fill="#ea580c" />
        <rect x="70" y="18" width="60" height="54" rx="3" fill="#f97316" fillOpacity="0.55" />
        <rect x="0" y="82" width="150" height="8" fill="#0b1220" />
      </g>

      {/* cabine */}
      <g transform="translate(300, 195)">
        <path d="M0 70 V20 a10 10 0 0 1 10-10 H55 L90 40 V70 Z" fill="#f97316" />
        <path d="M18 16 H50 L70 40 H18 Z" fill="#0b1220" fillOpacity="0.35" />
        <rect x="0" y="60" width="90" height="12" fill="#0b1220" />
        <circle cx="80" cy="52" r="6" fill="#ffedd5" />
      </g>

      {/* roues */}
      <g fill="#0b1220" stroke="#e2e8f0" strokeWidth="3">
        <circle cx="205" cy="270" r="20" />
        <circle cx="320" cy="270" r="20" />
        <circle cx="365" cy="270" r="20" />
      </g>
      <g fill="#111a2e">
        <circle cx="205" cy="270" r="9" />
        <circle cx="320" cy="270" r="9" />
        <circle cx="365" cy="270" r="9" />
      </g>

      {/* ombre */}
      <ellipse cx="290" cy="296" rx="185" ry="10" fill="#000" opacity="0.28" />

      {/* colis flottants */}
      <g transform="translate(80, 110)">
        <rect width="34" height="34" rx="6" fill="white" fillOpacity="0.9" />
        <path d="M0 10 H34 M17 10 V34" stroke="#ea580c" strokeWidth="2" />
      </g>
      <path
        d="M97 144 C 105 165, 115 175, 135 185"
        fill="none"
        stroke="white"
        strokeOpacity="0.25"
        strokeWidth="2"
        strokeDasharray="2 6"
      />
    </svg>
  );
}

interface GpsOverlayProps extends IllustrationProps {
  tone?: 'light' | 'dark';
}

/**
 * Calque transparent (pins GPS + itinéraires pointillés) à superposer sur une
 * vraie photo, pour recréer l'effet "réalité augmentée / suivi en direct" des
 * visuels de référence, sans dépendre d'une image tierce protégée.
 */
export function GpsOverlay({ tone = 'light', ...props }: GpsOverlayProps) {
  const line = tone === 'light' ? '#ffffff' : '#ea580c';
  const pinFill = tone === 'light' ? '#ffffff' : '#ea580c';
  const pinDot = tone === 'light' ? '#ea580c' : '#ffffff';

  return (
    <svg viewBox="0 0 600 400" fill="none" {...props}>
      <path
        d="M55 330 C 130 275, 190 250, 250 205 S 370 130, 425 95"
        stroke={line}
        strokeOpacity="0.75"
        strokeWidth="2.5"
        strokeDasharray="1.5 9"
        strokeLinecap="round"
      />
      <path
        d="M300 400 C 335 340, 350 300, 405 250 S 470 170, 500 140"
        stroke={line}
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeDasharray="1.5 9"
        strokeLinecap="round"
      />
      <circle cx="55" cy="330" r="4.5" fill={line} />
      <circle cx="250" cy="205" r="4.5" fill={line} />
      <circle cx="405" cy="250" r="4.5" fill={line} opacity="0.7" />

      <g transform="translate(405, 65)">
        <circle cx="20" cy="20" r="9" fill={pinFill} opacity="0.15">
          <animate attributeName="r" values="9;24;9" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0;0.25" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <path
          d="M20 4c9.4 0 17 7.6 17 17 0 12.7-17 27-17 27S3 33.7 3 21C3 11.6 10.6 4 20 4z"
          fill={pinFill}
        />
        <circle cx="20" cy="20" r="7" fill={pinDot} />
      </g>
    </svg>
  );
}

export function ShipHeroIllustration(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 900 460" {...props}>
      <defs>
        <linearGradient id="shipSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="45%" stopColor="#7c2d12" />
          <stop offset="75%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="shipSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#0b1220" />
        </linearGradient>
        <radialGradient id="shipSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="60%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="900" height="460" fill="url(#shipSky)" />
      <circle cx="450" cy="205" r="150" fill="url(#shipSun)" />
      <circle cx="450" cy="205" r="60" fill="#fff7ed" opacity="0.9" />
      <rect y="270" width="900" height="190" fill="url(#shipSea)" />

      {/* reflet du soleil sur l'eau */}
      <g opacity="0.35">
        <rect x="420" y="280" width="60" height="6" fill="#fff7ed" />
        <rect x="400" y="300" width="100" height="5" fill="#fff7ed" />
        <rect x="435" y="320" width="30" height="5" fill="#fff7ed" />
        <rect x="410" y="342" width="80" height="5" fill="#fff7ed" />
      </g>

      {/* vagues */}
      <path
        d="M0 300 Q 50 292 100 300 T 200 300 T 300 300 T 400 300 T 500 300 T 600 300 T 700 300 T 800 300 T 900 300"
        fill="none"
        stroke="#fff7ed"
        strokeOpacity="0.12"
        strokeWidth="3"
      />
      <path
        d="M0 330 Q 50 322 100 330 T 200 330 T 300 330 T 400 330 T 500 330 T 600 330 T 700 330 T 800 330 T 900 330"
        fill="none"
        stroke="#fff7ed"
        strokeOpacity="0.08"
        strokeWidth="3"
      />

      {/* itinéraire pointillé + pin */}
      <path
        d="M 640 260 C 700 210, 760 170, 800 120"
        fill="none"
        stroke="#fff7ed"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
        opacity="0.8"
      />
      <g transform="translate(782, 82)">
        <circle cx="18" cy="18" r="26" fill="#fff7ed" opacity="0.18" />
        <path
          d="M18 2c9.4 0 17 7.6 17 17 0 12.7-17 27-17 27S1 31.7 1 19C1 9.6 8.6 2 18 2z"
          fill="#fff7ed"
        />
        <circle cx="18" cy="18" r="7" fill="#ea580c" />
      </g>

      {/* coque du navire */}
      <path d="M120 300 L 700 300 L 660 340 L 160 340 Z" fill="#0b1220" />
      <rect x="150" y="285" width="520" height="18" fill="#111a2e" />

      {/* conteneurs empilés */}
      {[
        { x: 170, y: 235, w: 60, h: 50, c: '#ea580c' },
        { x: 235, y: 235, w: 60, h: 50, c: '#fff7ed' },
        { x: 300, y: 235, w: 60, h: 50, c: '#243350' },
        { x: 365, y: 235, w: 60, h: 50, c: '#fb923c' },
        { x: 430, y: 235, w: 60, h: 50, c: '#182238' },
        { x: 200, y: 185, w: 60, h: 50, c: '#f97316' },
        { x: 265, y: 185, w: 60, h: 50, c: '#e2e8f0' },
        { x: 330, y: 185, w: 60, h: 50, c: '#182238' },
        { x: 395, y: 185, w: 60, h: 50, c: '#c2410c' },
        { x: 232, y: 135, w: 60, h: 50, c: '#fff7ed' },
        { x: 297, y: 135, w: 60, h: 50, c: '#ea580c' },
      ].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill={b.c} stroke="#0b1220" strokeOpacity="0.25" />
          <path d={`M${b.x} ${b.y + b.h / 2} H${b.x + b.w}`} stroke="#0b1220" strokeOpacity="0.15" />
        </g>
      ))}

      {/* passerelle */}
      <g transform="translate(500, 190)">
        <rect x="0" y="30" width="70" height="65" fill="#182238" />
        <rect x="10" y="45" width="15" height="15" fill="#fb923c" opacity="0.7" />
        <rect x="30" y="45" width="15" height="15" fill="#fb923c" opacity="0.7" />
        <rect x="50" y="45" width="15" height="15" fill="#fb923c" opacity="0.7" />
        <rect x="20" y="0" width="8" height="35" fill="#0b1220" />
        <rect x="0" y="-6" width="70" height="8" fill="#111a2e" />
      </g>

      <ellipse cx="410" cy="352" rx="330" ry="14" fill="#000" opacity="0.25" />
    </svg>
  );
}
