import { InsightsView } from '@/components/InsightsView';
import { shoes } from '@/lib/data';

export default function Page() {
  return <InsightsView shoes={shoes} />;
}
