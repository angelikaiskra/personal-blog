import { notFound } from 'next/navigation';
import { postCategories } from '@/config/categories';
import { BlogView } from '@/features/blog/views/blog-view';

interface Props {
  params: Promise<{ category: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return postCategories.map((category) => ({ category: category.key }));
}

export default async function BlogCategoryPage({ params }: Props) {
  const { category: categoryFromUrl } = await params;
  const category = postCategories.find((item) => item.key === categoryFromUrl);

  if (!category) notFound();

  return <BlogView selectedCategory={category.key} />;
}
