import type { SVGProps } from 'react';

/**
 * Soldex mark — two stacked rounded squares.
 * Abstract, monochrome with a single accent. Not literally a shoe.
 * Uses `currentColor` for the outline; accent for the fill.
 */
export function Logo({
  size = 22,
  accent = '#7dd3fc',
  className,
  ...rest
}: { size?: number; accent?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {/* back card (accent fill) */}
      <rect x="7" y="7" width="14" height="14" rx="3" fill={accent} />
      {/* front card (outline) */}
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
