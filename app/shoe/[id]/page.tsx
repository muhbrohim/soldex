import { shoes } from '@/lib/data';
import { ShoeDetail } from '@/components/ShoeDetail';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return shoes.map((s) => ({ id: s.id }));
}

export default async function ShoePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shoe = shoes.find((s) => s.id === id);
  if (!shoe) return notFound();
  return <ShoeDetail shoe={shoe} all={shoes} />;
}
