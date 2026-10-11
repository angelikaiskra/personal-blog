import { AboutMeView } from '@/features/about-me/views/about me-view';
import { siteConfig } from '@/config/site';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'About',
  description: `Learn more about ${siteConfig.author}.`,
  path: '/about',
});

export default function AboutMePage() {
  return <AboutMeView />;
}
