import { HomeView } from '@/features/home/views/home-view';
import { siteConfig } from '@/config/site';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  path: '/',
});

export default function HomePage() {
  return <HomeView />;
}
