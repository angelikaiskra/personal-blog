import { AboutMeView } from '@/features/about-me/views/about me-view';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'About',
  path: '/about',
});

export default function AboutMePage() {
  return <AboutMeView />;
}
