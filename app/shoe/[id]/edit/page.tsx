'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoeForm } from '@/components/ShoeForm';
import { useShoe } from '@/lib/hooks';
import { useAuth } from '@/components/AuthProvider';
import { SkeletonText } from '@/components/Skeleton';

export default function EditShoePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: shoe, error } = useShoe(id);

  useEffect(() => {
    if (!loading && !user)
      router.replace(`/login?next=/shoe/${id}/edit`);
  }, [loading, user, router, id]);

  if (loading || !user) return <p className="text-muted">…</p>;
  if (error) return <p className="text-rose-400">Failed: {String(error)}</p>;
  if (!shoe) return <SkeletonText lines={8} />;
  return <ShoeForm mode="edit" initial={shoe} />;
}
