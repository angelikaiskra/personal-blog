import { HomeView } from '@/features/home/views/home-view';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  path: '/',
});

export default function HomePage() {
  return <HomeView />;
}
