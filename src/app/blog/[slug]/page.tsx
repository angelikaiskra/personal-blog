import { notFound } from 'next/navigation';
import { allPosts } from 'content-collections';
import { PostView } from '@/features/blog/views/post-view';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allPosts.filter((p) => p.published).map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug && p.published);

  if (!post) notFound();

  return <PostView post={post} />;
}
