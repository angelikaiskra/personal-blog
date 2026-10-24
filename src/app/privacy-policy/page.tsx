import type { ReactNode } from 'react';

import { Heading } from '@/components/ui/heading';
import { Link } from '@/components/ui/link';
import { MaxWidthContainer } from '@/components/ui/max-width-container';
import { Text } from '@/components/ui/text';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Privacy Policy',
  description: 'What data this blog collects, why, and what you can do about it.',
  path: '/privacy-policy',
});

const CONTACT_EMAIL = 'hello@angelaiskra.com';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 sm:mt-14">
      <Heading as="h2" variant="h2" className="font-bold">
        {title}
      </Heading>
      <div className="mt-4 space-y-4 sm:mt-6">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <MaxWidthContainer className="pb-20">
      <main className="mt-15 max-w-180 sm:mt-20">
        <Heading variant="h1" as="h1">
          Privacy policy
        </Heading>
        <Text as="p" variant="small" color="muted" className="mt-4 block">
          Last updated: October 24, 2026
        </Text>
        <Text as="p" className="mt-6 block sm:mt-8">
          This website doesn&apos;t show ads, doesn&apos;t sell anything and doesn&apos;t set any cookies. It only
          collects what&apos;s needed to keep the site running and to know which articles people read.
        </Text>
        <Text as="p" className="mt-4 block">
          The person responsible for your data is me, Angelika Iskra. If you have any questions, feel free to email me
          at <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
        </Text>

        <Section title="Hosting">
          <Text as="p" className="block">
            The site runs on Amazon Web Services, on a server in Frankfurt. The server (like any other web server) logs
            your IP address, your browser, and the page you opened. Logs are regularly deleted after 30 days.
          </Text>
          <Text as="p" className="block">
            If you switch between light and dark mode, the choice is saved in your browser&apos;s local storage.
          </Text>
        </Section>

        <Section title="Analytics">
          <Text as="p" className="block">
            I use <Link href="https://umami.is">Umami</Link> to see how many people visit and which articles they read.
            It&apos;s a privacy-friendly alternative to Google Analytics. It doesn&apos;t use cookies or store your IP
            address. You can read more about them at{' '}
            <Link href="https://umami.is/privacy">Umami&apos;s privacy policy</Link>.
          </Text>
        </Section>

        <Section title="Comments">
          <Text as="p" className="block">
            Comments under articles run on <Link href="https://giscus.app">giscus</Link>, which stores them in GitHub
            Discussions. The comments section loads from giscus and GitHub, so both of them see your IP address when you
            open a post.
          </Text>
          <Text as="p" className="block">
            To comment, you need to sign in with GitHub. After that, your GitHub name, avatar, and comment are public,
            and giscus saves a token in your browser&apos;s local storage to keep you signed in. You can read more in{' '}
            <Link href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
              GitHub&apos;s privacy statement
            </Link>
            .
          </Text>
        </Section>

        <Section title="The legal part">
          <Text as="p" className="block">
            The legal basis for all of this is my legitimate interest in running and improving the blog (Art. 6(1)(f)
            GDPR). AWS, GitHub, and Umami are US companies, so some data may end up in the US, under the EU-US Data
            Privacy Framework or Standard Contractual Clauses.
          </Text>
          <Text as="p" className="block">
            You can ask me to fix, delete, or export your data, or to limit how I use it.{' '}
            <strong className="font-semibold">You can also object to this at any time</strong> by sending me an email.
          </Text>
          <Text as="p" className="block">
            If you&apos;re unhappy with how I handle your data, you can file a complaint with a data protection
            authority.
          </Text>
        </Section>
      </main>
    </MaxWidthContainer>
  );
}
