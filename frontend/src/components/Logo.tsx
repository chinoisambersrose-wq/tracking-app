import { SVGProps } from 'react';
import { Link } from 'react-router-dom';

/**
 * Identité visuelle TransEuroGo — recréation fidèle du logo officiel fourni
 * par le client : badge circulaire à double anneau (orange + anthracite en
 * "croissants" superposés) autour d'un pictogramme camion + flèche de
 * mouvement, avec le nom "TransEuroGo" et la signature "Express Delivery".
 * Dessiné en SVG maison (pas d'image raster) pour rester net à toute taille.
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" {...props}>
      {/* Anneau extérieur orange (croissant) */}
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="none"
        stroke="#ea580c"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="80 27"
        transform="rotate(-40 20 20)"
      />
      {/* Anneau intérieur anthracite (croissant, décalé) */}
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="none"
        stroke="#182238"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="58 49"
        transform="rotate(75 20 20)"
      />
      {/* Pictogramme camion + flèche de mouvement, au centre */}
      <g transform="translate(8.5, 13)" stroke="#ea580c" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M0.5 1.5h11v9h-11z" />
        <path d="M2 6h5.5" />
        <path d="M5.5 3.8L8 6l-2.5 2.2" />
        <path d="M11.5 5h3.2l3.3 3v2.5h-6.5z" />
        <circle cx="4" cy="12.3" r="1.5" fill="#ea580c" stroke="none" />
        <circle cx="14.5" cy="12.3" r="1.5" fill="#ea580c" stroke="none" />
      </g>
    </svg>
  );
}

interface LogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  iconClassName?: string;
  to?: string | null;
  tagline?: boolean;
}

/** Icône + nom de marque, prêt à l'emploi dans les en-têtes. */
export function Logo({ variant = 'dark', className = '', iconClassName = 'h-9 w-9', to = '/', tagline = false }: LogoProps) {
  const textBase = variant === 'dark' ? 'text-ink-900' : 'text-white';
  const taglineColor = variant === 'dark' ? 'text-ink-700/50' : 'text-ink-100/50';

  const content = (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={`${iconClassName} shrink-0`} />
      <span className="leading-none">
        <span className={`block text-lg font-bold tracking-tight ${textBase}`}>TransEuroGo</span>
        {tagline && (
          <span className={`block text-[10px] font-medium uppercase tracking-widest ${taglineColor}`}>
            Express Delivery
          </span>
        )}
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
