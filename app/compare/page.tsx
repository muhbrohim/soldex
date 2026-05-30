import { ComparePage } from '@/components/ComparePage';
import { shoes } from '@/lib/data';

export default function Page() {
  return <ComparePage allShoes={shoes} />;
}
