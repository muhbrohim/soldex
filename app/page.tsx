import { BrowseView } from '@/components/BrowseView';
import { shoes, meta } from '@/lib/data';

export default function HomePage() {
  return <BrowseView shoes={shoes} meta={meta} />;
}
