import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { AnimatedLink } from '@/components/ui/animated-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { Text } from '@/components/ui/text';
import { postCategories, type PostCategoryKey } from '@/config/categories';
import { getPublishedPosts } from '@/features/blog/lib/posts';
import { cn } from '@/lib/utils';

const selectedBadgeClasses =
  'bg-primary text-primary-fg hover:bg-primary-hover dark:bg-primary dark:hover:bg-primary-hover';

interface BlogViewProps {
  selectedCategory?: PostCategoryKey;
}

export function BlogView({ selectedCategory }: BlogViewProps) {
  const selectedCategoryConfig = postCategories.find((category) => category.key === selectedCategory);
  const posts = getPublishedPosts().filter((post) => !selectedCategory || post.categories.includes(selectedCategory));

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
            className={cn('px-4', !selectedCategory && selectedBadgeClasses)}
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
                className={cn('px-4', isSelected && selectedBadgeClasses)}
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
            <li key={post.slug}>
              <Card as="article" className="flex h-full flex-col">
                <Heading as="h2" variant="h3" className="font-bold">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="decoration-link-accent decoration-2 underline-offset-2 hover:underline focus-visible:underline"
                  >
                    {post.title}
                  </Link>
                </Heading>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-fg">
                  <time dateTime={post.lastUpdated}>{format(parseISO(post.lastUpdated), 'MMMM do, yyyy')}</time>
                  <span className="size-1 rounded-full bg-foreground" aria-hidden="true" />
                  <span>{post.readingTime}</span>
                </div>

                <Text as={Link} href={`/blog/${post.slug}`} variant="body" className="mt-4 mb-6 block">
                  {post.excerpt}
                </Text>

                <AnimatedLink href={`/blog/${post.slug}`} hoverAnimation="arrowSlide" className="mt-auto">
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
