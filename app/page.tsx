'use client';
import { BrowseView } from '@/components/BrowseView';
import { SkeletonTable } from '@/components/Skeleton';
import { useShoes, useMeta } from '@/lib/hooks';

export default function HomePage() {
  const { data: shoes, error } = useShoes();
  const { data: meta } = useMeta();
  if (error) return <p className="text-rose-400">Failed to load: {String(error)}</p>;
  if (!shoes || !meta) return <SkeletonTable rows={12} />;
  return <BrowseView shoes={shoes} meta={meta} />;
}
