// Minimal pulse skeleton blocks. Pure presentation; size via className.
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-panel border border-line ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      <Skeleton className="h-8" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-7" />
      ))}
    </div>
  );
}
