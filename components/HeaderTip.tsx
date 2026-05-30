'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Lightweight Tailwind-only tooltip. No external dep.
 * Shows on hover OR focus (keyboard a11y).
 * `learnMoreHref` adds a "Learn more →" link inside the tooltip body.
 */
export function HeaderTip({
  label,
  code,
  tip,
  learnMoreHref,
  align = 'left',
  className = '',
}: {
  label: ReactNode;
  code?: string;
  tip: string;
  learnMoreHref?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const justify =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
  const tipPos =
    align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';

  return (
    <span className={`relative inline-flex items-center gap-1 group/tip ${justify} ${className}`}>
      <span>{label}</span>
      <button
        type="button"
        tabIndex={0}
        aria-label={typeof label === 'string' ? `Info about ${label}` : 'Info'}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-line text-[9px] leading-none text-muted hover:text-ink hover:border-muted focus:outline-none focus:text-ink focus:border-accent"
        onClick={(e) => e.stopPropagation()}
      >
        i
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full mt-1 ${tipPos} z-50 w-64 rounded border border-line bg-bg p-2 text-left text-[11px] font-normal leading-snug text-ink shadow-lg opacity-0 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 group-hover/tip:pointer-events-auto group-focus-within/tip:pointer-events-auto transition-opacity`}
      >
        {code && (
          <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">
            code: <span className="font-mono">{code}</span>
          </span>
        )}
        <span className="block">{tip}</span>
        {learnMoreHref && (
          <Link
            href={learnMoreHref}
            className="mt-1 inline-block text-[10px] text-accent hover:underline"
          >
            Learn more →
          </Link>
        )}
      </span>
    </span>
  );
}
