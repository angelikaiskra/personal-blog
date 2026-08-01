import { allPosts } from 'content-collections';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { SparklesIcon } from '@/components/icons/sparkles-icon';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { AnimatedLink } from '@/components/ui/animated-link';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/icons/arrow-right-icon';
import { postTags } from '@/config/tags';
import { Badge } from '@/components/ui/badge';

export function HomeView() {
  const recentPosts = allPosts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 10);

  return (
    <MaxWidthContainer className="pb-20">
      <section className="mt-15 sm:mt-20">
        <div className="flex max-w-[455px] flex-col gap-y-5 max-sm:mx-auto max-sm:items-center max-sm:text-center sm:max-w-[590px] sm:gap-y-10">
          <div className="relative flex items-center gap-x-2 max-sm:justify-center">
            <Heading variant="h1" as="h1" className="sm:text-5xl">
              Hi, I&apos;m Angela!
            </Heading>
            <SparklesIcon className="text-accent absolute top-2 -right-13 size-9 sm:static sm:size-12" />
            <SparklesIcon className="text-accent absolute -top-4 -left-14 size-7 rotate-30 sm:hidden" />
          </div>
          <Text as="p">
            <span className="sm:block">Frontend Developer crafting web experiences with React and TypeScript. </span>I
            love technology and I&apos;m fascinated by how things work. This blog is where I share what I&apos;m
            currently exploring, building and figuring out.
          </Text>
          <Button icon={<ArrowRightIcon className="size-5" />} className="max-sm:mt-3">
            Contact me
          </Button>
        </div>
      </section>

      <div className="mt-20 flex flex-wrap justify-between gap-x-20 sm:mt-24 md:flex-nowrap">
        <section>
          <Heading as="h2" variant="h1">
            Latest posts
          </Heading>

          <ul className="divide-border mt-6 divide-y sm:mt-8">
            {recentPosts.map((post) => (
              <li key={post._meta.path} className="py-8 first:pt-0">
                <article className="max-w-3xl">
                  <Heading as="h3" variant="h3" className="mb-2 font-bold">
                    {post.title}
                  </Heading>

                  <div className="text-muted-fg flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <time dateTime={post.lastUpdated}>{new Date(post.lastUpdated).toDateString()}</time>
                    <span className="bg-muted-fg size-1.5 rounded-full" aria-hidden="true" />
                    <span>{post.readingTime}</span>
                  </div>

                  <Text as="p" variant="body" className="mt-4 max-w-170">
                    {post.excerpt}
                  </Text>

                  <AnimatedLink href={`/blog/${post._meta.path}`} className="mt-5">
                    Read more
                  </AnimatedLink>
                </article>
              </li>
            ))}
          </ul>

          <div className="flex w-full justify-center max-sm:mt-4">
            <Button variant="secondary" icon={<ArrowRightIcon className="size-5" />}>
              Read more posts
            </Button>
          </div>
        </section>

        <aside className="max-md:mt-18">
          <Heading as="h2" variant="h1">
            Categories
          </Heading>

          <div className="mt-8 flex flex-wrap gap-3 sm:max-w-72">
            {postTags.map((tag) => (
              <Badge key={tag.key} as="a" href={`/${tag.key}`}>
                {tag.label}
              </Badge>
            ))}
          </div>
        </aside>
      </div>
    </MaxWidthContainer>
  );
}
