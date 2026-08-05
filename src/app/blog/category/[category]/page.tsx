import { notFound } from 'next/navigation';
import { postTags } from '@/config/tags';
import { BlogView } from '@/features/blog/views/blog-view';

interface Props {
  params: Promise<{ category: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return postTags.map((tag) => ({ category: tag.key }));
}

export default async function BlogCategoryPage({ params }: Props) {
  const { category } = await params;
  const tag = postTags.find((item) => item.key === category);

  if (!tag) notFound();

  return <BlogView selectedTag={tag.key} />;
}
