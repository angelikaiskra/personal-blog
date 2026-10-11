import { BlogView } from '@/features/blog/views/blog-view';
import { siteConfig } from '@/config/site';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Blog',
  description: siteConfig.description,
  path: '/blog',
});

export default function BlogPage() {
  return <BlogView />;
}
