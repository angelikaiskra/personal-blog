import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { postCategories } from '@/config/categories';
import { siteConfig } from '@/config/site';
import { BlogView } from '@/features/blog/views/blog-view';
import { createMetadata } from '@/lib/metadata';

interface Props {
  params: Promise<{ category: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return postCategories.map((category) => ({ category: category.key }));
}

function getCategory(key: string) {
  const category = postCategories.find((item) => item.key === key);

  if (!category) notFound();

  return category;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: key } = await params;
  const category = getCategory(key);

  return createMetadata({
    title: category.label,
    description: `Explore ${category.label} articles from ${siteConfig.author}'s development blog.`,
    path: `/category/${category.key}`,
  });
}

export default async function BlogCategoryPage({ params }: Props) {
  const { category: key } = await params;
  const category = getCategory(key);

  return <BlogView selectedCategory={category.key} />;
}
