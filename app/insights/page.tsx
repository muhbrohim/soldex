'use client';
import { InsightsView } from '@/components/InsightsView';
import { useShoes } from '@/lib/hooks';
import { SkeletonText } from '@/components/Skeleton';

export default function Page() {
  const { data: shoes, error } = useShoes();
  if (error) return <p className="text-rose-400">Failed to load: {String(error)}</p>;
  if (!shoes) return <SkeletonText lines={8} />;
  return <InsightsView shoes={shoes} />;
}
