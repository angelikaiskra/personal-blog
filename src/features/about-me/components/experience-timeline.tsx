import type { ComponentPropsWithoutRef } from 'react';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/heading';

interface Experience {
  role: string;
  company: string;
  period: string;
  description: string;
}

const experiences = [
  {
    role: 'Frontend Developer',
    company: 'Shiji',
    period: 'May 2025 - Currently',
    description:
      "Build and maintain software features within a multi-region, microservices architecture using React and TypeScript. Develop reusable, accessible design system components. Contribute to company's internal libraries. Ensure code quality through unit, E2E testing, code reviews and applying SOLID engineering best practices.",
  },
  {
    role: 'Frontend Developer',
    company: '180heartbeats + JvM',
    period: 'Jan 2023 - May 2025',
    description:
      'Built web applications and interactive digital experiences for leading brands, including Red Bull, T-Mobile, Xiaomi. Collaborated with designers, product managers, and backend developers to deliver high-quality, responsive solutions.',
  },
  {
    role: 'Web Developer',
    company: 'STETTINER ID&STORY',
    period: 'Oct 2018 - Jan 2023 (part-time)',
    description:
      'Engineered and maintained CMS, ERP and enterprise software solutions for diverse range of clients. Worked across the full development lifecycle, from client meetings and technical planning to building complex systems and optimizing performance, SEO and web accessibility.',
  },
] as const satisfies readonly Experience[];

type ExperienceTimelineProps = Omit<ComponentPropsWithoutRef<'ol'>, 'children'>;

export function ExperienceTimeline({ className, ...props }: ExperienceTimelineProps) {
  return (
    <ol className={cn('flex max-w-lg flex-col', className)} {...props}>
      {experiences.map(({ role, company, period, description }) => (
        <li key={`${company}-${period}`} className="group relative pb-10 pl-8 last:pb-0 sm:pb-12 sm:pl-10">
          <span aria-hidden className="absolute top-0 bottom-0 left-0.75 w-0.5 bg-muted-hover group-first:top-3.5" />
          <span
            aria-hidden
            className="absolute top-2.5 left-0 size-2 rounded-full bg-foreground ring-8 ring-background dark:ring-14"
          />
          <h3>
            <span className="whitespace-nowrap">
              <Heading variant="body" className="font-semibold dark:font-semibold">
                {role}
              </Heading>
              <span
                className="mx-2 -mt-1 inline-block size-1 rounded-full bg-foreground align-middle"
                aria-hidden="true"
              />
            </span>
            <wbr />
            <Heading variant="body" className="font-semibold whitespace-nowrap text-primary dark:font-semibold">
              {company}
            </Heading>
          </h3>
          <Text as="p" variant="base" color="muted" className="mt-2">
            {period}
          </Text>
          <Text as="p" className="mt-3 leading-normal">
            {description}
          </Text>
        </li>
      ))}
    </ol>
  );
}
