import Link from 'next/link';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { SparklesIcon } from '@/components/icons/sparkles-icon';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { AnimatedLink } from '@/components/ui/animated-link';
import { Button } from '@/components/ui/button';
import { ArrowRightLongIcon } from '@/components/icons/arrow-right-long-icon';
import { postCategories } from '@/config/categories';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { getPublishedPosts } from '@/features/blog/lib/posts';
import { VoxelCatHero } from '../components/voxel-cat/voxel-cat-hero';

export function HomeView() {
  const recentPosts = getPublishedPosts().slice(0, 10);

  return (
    <MaxWidthContainer className="pb-20">
      <section className="mt-15 sm:mt-20">
        <div className="grid items-center gap-y-12 md:grid-cols-[minmax(0,590px)_minmax(260px,1fr)] md:gap-x-8 lg:gap-x-14">
          <div className="flex max-w-[455px] flex-col gap-y-5 max-sm:mx-auto max-sm:items-center max-sm:text-center sm:max-w-[590px] sm:gap-y-10">
            <div className="relative flex items-center gap-x-2 max-sm:justify-center">
              <Heading variant="h1" as="h1" className="sm:text-5xl">
                Hi, I&apos;m Angela!
              </Heading>
              <SparklesIcon className="absolute top-2 -right-13 size-9 text-accent sm:static sm:size-12" />
              <SparklesIcon className="absolute -top-4 -left-14 size-7 rotate-30 text-accent sm:hidden" />
            </div>
            <Text as="p">
              <span className="sm:block">Frontend developer crafting web experiences with React and TypeScript. </span>I
              love technology and I&apos;m fascinated by how things work. This blog is where I share what I&apos;m
              currently exploring, building and figuring out.
            </Text>
            <Button
              as="a"
              href="mailto:hello@angelaiskra.com"
              icon={<ArrowRightLongIcon className="size-5" />}
              className="max-sm:mt-3"
            >
              Contact me
            </Button>
          </div>

          <VoxelCatHero />
        </div>
      </section>

      <div className="mt-12 flex flex-wrap justify-between gap-x-20 sm:mt-24 md:flex-nowrap">
        <section>
          <Heading as="h2" variant="h1">
            Latest posts
          </Heading>

          <ul className="mt-6 divide-y divide-border sm:mt-8">
            {recentPosts.map((post) => (
              <li key={post.slug} className="py-8 first:pt-0">
                <article className="max-w-3xl">
                  <Heading as="h3" variant="h3" className="mb-2 font-bold">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="decoration-link-accent decoration-2 underline-offset-2 hover:underline focus-visible:underline"
                    >
                      {post.title}
                    </Link>
                  </Heading>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-fg">
                    <time dateTime={post.lastUpdated}>{format(parseISO(post.lastUpdated), 'MMMM do, yyyy')}</time>
                    <span className="size-1.5 rounded-full bg-muted-fg" aria-hidden="true" />
                    <span>{post.readingTime}</span>
                  </div>

                  <Text as={Link} href={`/blog/${post.slug}`} variant="body" className="mt-4 block max-w-170">
                    {post.excerpt}
                  </Text>

                  <AnimatedLink href={`/blog/${post.slug}`} hoverAnimation="arrowSlide" className="mt-5">
                    Read more<span className="sr-only"> about {post.title}</span>
                  </AnimatedLink>
                </article>
              </li>
            ))}
          </ul>

          {/* <div className="flex w-full justify-center max-sm:mt-4">
            <Button variant="secondary" icon={<ArrowRightIcon className="size-5" />}>
              Read more posts
            </Button>
          </div> */}
        </section>

        <aside className="max-md:mt-8">
          <Heading as="h2" variant="h1">
            Categories
          </Heading>

          <div className="mt-8 flex flex-wrap gap-3 sm:max-w-72">
            {postCategories.map((category) => (
              <Badge key={category.key} as={Link} href={`/category/${category.key}`}>
                {category.label}
              </Badge>
            ))}
          </div>
        </aside>
      </div>
    </MaxWidthContainer>
  );
}
