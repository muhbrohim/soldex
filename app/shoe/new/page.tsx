'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoeForm } from '@/components/ShoeForm';
import { useAuth } from '@/components/AuthProvider';

export default function NewShoePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/shoe/new');
  }, [loading, user, router]);
  if (loading || !user) return <p className="text-muted">…</p>;
  return <ShoeForm mode="create" />;
}
