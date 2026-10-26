import type { Metadata } from 'next';

import { ArrowRightLongIcon } from '@/components/icons/arrow-right-long-icon';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { SiteShell } from '@/components/ui/site-shell';
import { Text } from '@/components/ui/text';
import { KnockoffShelf } from '@/features/not-found/components/knockoff-shelf';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <SiteShell>
      <MaxWidthContainer className="pt-6 pb-20 sm:pt-10">
        <KnockoffShelf />

        <section className="mt-7 grid items-start gap-x-14 gap-y-5 sm:mt-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div>
            <Heading as="h1" variant="h1" className="text-balance sm:text-5xl">
              This page was knocked off the shelf
            </Heading>
          </div>

          <div className="flex flex-col gap-y-7">
            <Text as="p" className="max-w-[34em]">
              The page you&apos;re looking for doesn&apos;t exist. The link might have a typo, the post might have
              moved, or it got pushed off the edge like everything else around here.
            </Text>
            <div className="flex flex-wrap gap-x-5 gap-y-4">
              <Button as="a" href="/" icon={<ArrowRightLongIcon className="size-5" />}>
                Back to home
              </Button>
            </div>
          </div>
        </section>
      </MaxWidthContainer>
    </SiteShell>
  );
}
