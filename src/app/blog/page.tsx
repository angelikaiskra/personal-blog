import { BlogView } from '@/features/blog/views/blog-view';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Blog',
  path: '/blog',
});

export default function BlogPage() {
  return <BlogView />;
}
