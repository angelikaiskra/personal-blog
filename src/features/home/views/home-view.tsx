import { allPosts } from 'content-collections';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { SparklesIcon } from '@/components/icons/sparkles-icon';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { AnimatedLink } from '@/components/ui/animated-link';
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { postTags } from "@/config/tags";
import { Badge } from "@/components/ui/badge";

export function HomeView() {
  const recentPosts = allPosts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 10);

  return (
    <MaxWidthContainer className="pb-20">
      <section className="mt-20">
        <div className="flex max-w-[590px] flex-col gap-y-10">
          <div className="flex items-center gap-x-2">
            <Heading variant="h1" as="h1" className="text-5xl">
              Hi, I&apos;m Angela!
            </Heading>
            <SparklesIcon className="size-12 text-accent" />
          </div>
          <Text as="p">
            <span className="md:block">Frontend Developer crafting web experiences with React and TypeScript.</span>
            I love technology and I&apos;m fascinated by how things work. This blog is where I share what I&apos;m
            currently exploring, building and figuring out.
          </Text>
          <Button icon={<ArrowRightIcon />}>Contact me</Button>
        </div>
      </section>

      <div className="mt-20 flex gap-x-20 justify-between">
        <section>
          <Heading as="h2" variant="h1">
            Latest posts
          </Heading>

          <ul className="divide-border divide-y mt-8">
            {recentPosts.map((post) => (
              <li key={post._meta.path} className="py-8 first:pt-0">
                <article className="max-w-3xl">
                  <Heading as="h3" variant="h3" className="mb-2">
                    {post.title}
                  </Heading>

                  <div className="text-muted-fg mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <time dateTime={post.lastUpdated}>
                      {new Date(post.lastUpdated).toDateString()}
                    </time>
                    <span className="bg-foreground rounded-full size-1" aria-hidden="true" />
                    <span>{post.readingTime}</span>
                  </div>

                  <Text as="p" variant="body" className="mb-5 max-w-170">
                    {post.excerpt}
                  </Text>

                  <AnimatedLink href={`/blog/${post._meta.path}`}>Read more</AnimatedLink>
                </article>
              </li>
            ))}
          </ul>

          <div className="w-full flex justify-center">
            <Button variant="secondary" icon={<ArrowRightIcon className="size-4" />}>Read more posts</Button>
          </div>
        </section>

        <aside>
          <Heading as="h2" variant="h1">
            Categories
          </Heading>

          <div className="mt-8 flex flex-wrap gap-3 max-w-72">
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
