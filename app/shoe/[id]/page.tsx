'use client';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { ShoeDetail } from '@/components/ShoeDetail';
import { useShoes } from '@/lib/hooks';
import { SkeletonText } from '@/components/Skeleton';

export default function ShoePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: shoes, error } = useShoes();
  if (error) return <p className="text-rose-400">Failed to load: {String(error)}</p>;
  if (!shoes) return <SkeletonText lines={10} />;
  const shoe = shoes.find((s) => s.id === id);
  if (!shoe) return notFound();
  return <ShoeDetail shoe={shoe} all={shoes} />;
}
