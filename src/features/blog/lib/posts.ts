import 'server-only';
import { allPosts, type Post } from 'content-collections';

export const getPublishedPosts = (): Post[] => {
  return allPosts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
};

export const getPublishedPostBySlug = (slug: string): Post | undefined => {
  return getPublishedPosts().find((post) => post.slug === slug);
};
