import { SVGProps } from 'react';
import { Link } from 'react-router-dom';

/**
 * Identité visuelle TransEuroGoo — logo maison (pas d'image externe).
 * Le pictogramme combine un pin de géolocalisation et une route/flèche de
 * mouvement, pour incarner à la fois "Trans" (transport) et le suivi GPS
 * ("Goo" / géolocalisation) au cœur du produit.
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" {...props}>
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#logoGrad)" />
      {/* route */}
      <path
        d="M8 27 C 14 22, 16 18, 22 13"
        fill="none"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="0.5 5.2"
      />
      {/* pin de géolocalisation */}
      <path
        d="M24 8c4.4 0 8 3.6 8 8 0 6-8 14.5-8 14.5S16 22 16 16c0-4.4 3.6-8 8-8z"
        fill="white"
      />
      <circle cx="24" cy="16" r="3.4" fill="#ea580c" />
    </svg>
  );
}

interface LogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  iconClassName?: string;
  to?: string | null;
}

/** Icône + nom de marque, prêt à l'emploi dans les en-têtes. */
export function Logo({ variant = 'dark', className = '', iconClassName = 'h-9 w-9', to = '/' }: LogoProps) {
  const textBase = variant === 'dark' ? 'text-ink-900' : 'text-white';
  const accent = variant === 'dark' ? 'text-brand-600' : 'text-brand-400';

  const content = (
    <span className={`flex items-center gap-2.5 text-lg font-bold tracking-tight ${textBase} ${className}`}>
      <LogoMark className={`${iconClassName} shrink-0 drop-shadow-sm`} />
      <span className="leading-none">
        TransEuro<span className={accent}>Goo</span>
      </span>
    </span>
  );

  if (to === null) return content;
  return (
    <Link to={to} className="inline-flex items-center">
      {content}
    </Link>
  );
}
