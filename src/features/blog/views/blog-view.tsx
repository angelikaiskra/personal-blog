import { allPosts } from 'content-collections';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { AnimatedLink } from '@/components/ui/animated-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { Text } from '@/components/ui/text';
import { postCategories, type PostCategoryKey } from '@/config/categories';
import { cn } from '@/lib/utils';

interface BlogViewProps {
  selectedCategory?: PostCategoryKey;
}

export function BlogView({ selectedCategory }: BlogViewProps) {
  const selectedCategoryConfig = postCategories.find((category) => category.key === selectedCategory);
  const posts = allPosts
    .filter((post) => post.published && (!selectedCategory || post.categories.includes(selectedCategory)))
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return (
    <MaxWidthContainer className="pb-20">
      <section className="mt-15 sm:mt-20">
        <div className="flex items-end justify-between gap-4">
          <Heading as="h1" variant="h1">
            {selectedCategoryConfig ? `${selectedCategoryConfig.label}` : 'All posts'}
          </Heading>
          <Text as="p" variant="base" className="font-medium">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'}
          </Text>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
          <Badge
            as={Link}
            className={cn('px-4', !selectedCategory && 'bg-primary hover:bg-primary-hover')}
            href="/blog"
            aria-current={!selectedCategory ? 'page' : undefined}
          >
            Show all
          </Badge>
          {postCategories.map((category) => {
            const isSelected = category.key === selectedCategory;

            return (
              <Badge
                key={category.key}
                as={Link}
                className={cn('px-4', isSelected && 'bg-primary hover:bg-primary-hover')}
                href={`/category/${category.key}`}
                aria-current={isSelected ? 'page' : undefined}
              >
                {category.label}
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

                <Text as={Link} href={`/blog/${post._meta.path}`} variant="body" className="mt-4 block">
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
          {selectedCategoryConfig ? `No posts in ${selectedCategoryConfig.label} yet.` : 'No posts yet.'}
        </Text>
      )}
    </MaxWidthContainer>
  );
}
