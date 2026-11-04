import { Heading } from '@/components/ui/heading';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { Text } from '@/components/ui/text';
import Image from 'next/image';

import { TechnologiesGrid } from '../components/technologies-grid';
import { Link } from '@/components/ui/link';

export function AboutMeView() {
  return (
    <MaxWidthContainer className="pb-20">
      <main className="mt-15 sm:mt-20">
        <div className="flex items-center justify-center max-lg:flex-col md:justify-between md:gap-x-8 lg:gap-x-14">
          <div className="max-w-147.5 flex-1">
            <Heading variant="h1" as="h1">
              About me
            </Heading>
            <Text as="p" className="mt-6 block sm:mt-8">
              I&apos;m Angela. Welcome to my spot on the web for writing and sharing what I&apos;ve learned with the
              world.
            </Text>
            <Text as="p" className="mt-4 block">
              I&apos;ve been building websites for the last 8 years. Currently, I&apos;m working as a Frontend Developer
              at <Link href="https://www.shijigroup.com/">Shiji</Link>, a product company delivering solutions for
              hospitality industry.
            </Text>
            <Text as="p" className="mt-4 block">
              In my spare time, you can usually find me lifting weights at the gym, running or delving into fantasy
              universes. As you probably saw, I&apos;m a cat person. I have two of these wonderful creatures, Lusia and
              Leoś.
            </Text>
          </div>
          <div className="relative flex max-lg:mt-10 max-sm:mt-8 min-[640px]:justify-center md:mr-4 md:justify-end">
            <div className="absolute top-2 left-2 -z-1 h-full w-full rounded-xl bg-black dark:bg-[#211c1d]" />
            <Image
              src="/about-me-hero.jpg"
              width={281}
              height={280}
              className="h-auto w-80 rounded-xl"
              alt="Image of Angela smiling to the camera"
            />
          </div>
        </div>
      </main>
      <section className="mt-20 sm:mt-24">
        <Heading as="h2" variant="h2" className="font-bold">
          Technologies I use
        </Heading>

        <TechnologiesGrid className="mt-6 sm:mt-8" />
      </section>
      <section className="mt-20 sm:mt-24">
        <Heading as="h2" variant="h2" className="font-bold">
          AI usage on this blog
        </Heading>

        <Text as="p" className="mt-6 sm:mt-8">
          All articles are written fully by me.
        </Text>
      </section>
    </MaxWidthContainer>
  );
}
