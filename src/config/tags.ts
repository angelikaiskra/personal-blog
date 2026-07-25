import z from 'zod';

export interface PostTagConfig {
  key: string;
  label: string;
  hoverColor: string;
}

export const postTags = [
  { key: 'react', label: 'React', hoverColor: 'gray' },
  { key: 'javascript', label: 'JavaScript', hoverColor: 'gray' },
  { key: 'typescript', label: 'TypeScript', hoverColor: 'gray' },
  { key: 'css', label: 'CSS', hoverColor: 'gray' },
  { key: 'career', label: 'Career', hoverColor: 'gray' },
  { key: 'general', label: 'General', hoverColor: 'gray' },
] as const satisfies readonly PostTagConfig[];

export const postTagKeys = postTags.map((tag) => tag.key) as [
  (typeof postTags)[number]['key'],
  ...(typeof postTags)[number]['key'][],
];

const PostTagKey = z.enum(postTagKeys);
export type PostTagKey = z.infer<typeof PostTagKey>;
