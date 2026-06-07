import z from 'zod';

export const postTags = ['react', 'javascript', 'typescript', 'css', 'career', 'general'] as const;

const PostTag = z.enum(postTags);
export type PostTag = z.infer<typeof PostTag>;
