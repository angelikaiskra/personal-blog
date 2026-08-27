import { allPosts } from 'content-collections';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { AnimatedLink } from '@/components/ui/animated-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { Text } from '@/components/ui/text';
import { postTags, type PostTagKey } from '@/config/tags';
import { cn } from '@/lib/utils';

interface BlogViewProps {
  selectedTag?: PostTagKey;
}

export function BlogView({ selectedTag }: BlogViewProps) {
  const selectedTagConfig = postTags.find((tag) => tag.key === selectedTag);
  const posts = allPosts
    .filter((post) => post.published && (!selectedTag || post.tags.includes(selectedTag)))
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return (
    <MaxWidthContainer className="pb-20">
      <section className="mt-15 sm:mt-20">
        <div className="flex items-end justify-between gap-4">
          <Heading as="h1" variant="h1">
            {selectedTagConfig ? `${selectedTagConfig.label}` : 'All posts'}
          </Heading>
          <Text as="p" variant="base" className="font-medium">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'}
          </Text>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
          <Badge
            as={Link}
            className={cn('px-4', !selectedTag && 'bg-primary hover:bg-primary-hover')}
            href="/blog"
            aria-current={!selectedTag ? 'page' : undefined}
          >
            Show all
          </Badge>
          {postTags.map((tag) => {
            const isSelected = tag.key === selectedTag;

            return (
              <Badge
                key={tag.key}
                as={Link}
                className={cn('px-4', isSelected && 'bg-primary hover:bg-primary-hover')}
                href={`/category/${tag.key}`}
                aria-current={isSelected ? 'page' : undefined}
              >
                {tag.label}
              </Badge>
            );
          })}
        </div>
      </section>

      {posts.length > 0 ? (
        <ul className="mt-8 grid gap-8 sm:mt-16 md:grid-cols-2">
          {posts.map((post) => (
            <li key={post._meta.path}>
              <Card as="article">
                <Heading as="h2" variant="h3" className="font-bold">
                  <Link
                    href={`/blog/${post._meta.path}`}
                    className="decoration-link-accent decoration-2 underline-offset-2 hover:underline focus-visible:underline"
                  >
                    {post.title}
                  </Link>
                </Heading>

                <div className="text-muted-fg mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <time dateTime={post.lastUpdated}>{format(parseISO(post.lastUpdated), 'MMMM do, yyyy')}</time>
                  <span className="bg-foreground size-1 rounded-full" aria-hidden="true" />
                  <span>{post.readingTime}</span>
                </div>

                <Text as="p" variant="body" className="mt-4">
                  {post.excerpt}
                </Text>

                <AnimatedLink href={`/blog/${post._meta.path}`} hoverAnimation="arrowSlide" className="mt-6">
                  Read more
                </AnimatedLink>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Text as="p" color="muted" className="mt-10">
          {selectedTagConfig ? `No posts in ${selectedTagConfig.label} yet.` : 'No posts yet.'}
        </Text>
      )}
    </MaxWidthContainer>
  );
}
