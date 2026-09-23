import type { ComponentPropsWithoutRef } from 'react';

import { AiIcon } from '@/components/icons/ai-icon';
import { AstroIcon } from '@/components/icons/astro-icon';
import { FigmaIcon } from '@/components/icons/figma-icon';
import { FramerMotionIcon } from '@/components/icons/framer-motion-icon';
import { JestIcon } from '@/components/icons/jest-icon';
import { NextjsIcon } from '@/components/icons/nextjs-icon';
import { PlaywrightIcon } from '@/components/icons/playwright-icon';
import { ReactIcon } from '@/components/icons/react-icon';
import { ScssIcon } from '@/components/icons/scss-icon';
import { StorybookIcon } from '@/components/icons/storybook-icon';
import { TailwindIcon } from '@/components/icons/tailwind-icon';
import { TypescriptIcon } from '@/components/icons/typescript-icon';
import { WordpressIcon } from '@/components/icons/wordpress-icon';
import { cn } from '@/lib/utils';

import { TechnologyTile, type TechnologyIcon, type TechnologyTileSize } from './technology-tile';

interface Technology {
  label: string;
  icon: TechnologyIcon;
  size: TechnologyTileSize;
  iconClassName?: string;
}

const technologies = [
  { label: 'React', icon: ReactIcon, size: 'big' },
  { label: 'Typescript', icon: TypescriptIcon, size: 'big' },
  { label: 'Next.js', icon: NextjsIcon, size: 'big' },
  { label: 'Jest', icon: JestIcon, size: 'small' },
  { label: 'Playwright', icon: PlaywrightIcon, size: 'small' },
  { label: 'Astro', icon: AstroIcon, size: 'medium' },
  { label: 'Tailwind', icon: TailwindIcon, size: 'medium' },
  { label: 'SCSS', icon: ScssIcon, size: 'medium' },
  { label: 'Framer Motion', icon: FramerMotionIcon, size: 'medium', iconClassName: 'size-8' },
  { label: 'Storybook', icon: StorybookIcon, size: 'medium' },
  { label: 'WordPress', icon: WordpressIcon, size: 'medium' },
  { label: 'Figma', icon: FigmaIcon, size: 'medium' },
  { label: 'AI', icon: AiIcon, size: 'medium' },
] as const satisfies readonly Technology[];

type TechnologiesGridProps = Omit<ComponentPropsWithoutRef<'ul'>, 'children'>;

export function TechnologiesGrid({ className, ...props }: TechnologiesGridProps) {
  return (
    <ul
      className={cn(
        'grid max-w-147.5 auto-rows-[6.5rem] grid-cols-2 gap-3',
        'md:auto-rows-auto md:grid-cols-4 md:grid-rows-[5rem_5rem_7.5rem_7.5rem]',
        className,
      )}
      {...props}
    >
      {technologies.map((technology) => (
        <TechnologyTile key={technology.label} {...technology} />
      ))}
    </ul>
  );
}
