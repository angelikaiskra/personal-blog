import z from 'zod';

export interface PostCategoryConfig {
  key: string;
  label: string;
  hoverColor: string;
}

export const postCategories = [
  { key: 'react', label: 'React', hoverColor: 'gray' },
  { key: 'javascript', label: 'JavaScript', hoverColor: 'gray' },
  { key: 'typescript', label: 'TypeScript', hoverColor: 'gray' },
  { key: 'css', label: 'CSS', hoverColor: 'gray' },
  { key: 'career', label: 'Career', hoverColor: 'gray' },
  { key: 'general', label: 'General', hoverColor: 'gray' },
] as const satisfies readonly PostCategoryConfig[];

export const postCategoryKeys = postCategories.map((tag) => tag.key) as [
  (typeof postCategories)[number]['key'],
  ...(typeof postCategories)[number]['key'][],
];

const PostCategoryKey = z.enum(postCategoryKeys);
export type PostCategoryKey = z.infer<typeof PostCategoryKey>;
