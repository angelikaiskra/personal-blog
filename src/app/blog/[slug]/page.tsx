import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { postCategories } from '@/config/categories';
import { getPublishedPostBySlug, getPublishedPosts } from '@/features/blog/lib/posts';
import { PostView } from '@/features/blog/views/post-view';
import { createMetadata } from '@/lib/metadata';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }));
}

function getPublishedPost(slug: string) {
  const post = getPublishedPostBySlug(slug);

  if (!post) notFound();

  return post;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPublishedPost(slug);
  const tags = post.categories.map((key) => postCategories.find((category) => category.key === key)?.label ?? key);

  // TODO: Add openGraph.images and twitter.images
  return createMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    article: {
      publishedTime: new Date(post.created).toISOString(),
      modifiedTime: new Date(post.lastUpdated).toISOString(),
      tags,
      section: tags[0],
    },
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPublishedPost(slug);

  return <PostView post={post} />;
}
