import { postTagKeys } from '@/config/tags';
import { defineCollection, defineConfig } from '@content-collections/core';
import readingTime from 'reading-time';
import { z } from 'zod';

const posts = defineCollection({
  name: 'posts',
  directory: 'content/posts',
  include: '*.mdx',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    created: z.string(),
    lastUpdated: z.string(),
    tags: z.array(z.enum(postTagKeys)),
    published: z.boolean().default(true),
    content: z.string(),
  }),
  transform: (document) => {
    const stats = readingTime(document.content);
    return {
      ...document,
      readingTime: stats.text,
      readingMinutes: Math.ceil(stats.minutes),
    };
  },
});

export default defineConfig({
  content: [posts],
});
