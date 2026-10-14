import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { LightbulbIcon } from '@/components/icons/lightbulb-icon';

import { CollapsibleAsideContent } from './collapsible-aside-content';

const asideVariants = cva(
  'relative my-8 rounded-r-lg border-l-4 px-4 py-6 text-foreground sm:mt-20 sm:mb-18 sm:ml-6 sm:pr-6 sm:pl-10',
  {
    variants: {
      variant: {
        tip: 'border-tip-accent bg-tip [--link-accent:var(--tip-accent)]',
      },
    },
    defaultVariants: {
      variant: 'tip',
    },
  },
);

const asideContentStyles =
  '[&_li]:my-1 [&_li>p]:my-2 [&>:first-child]:mt-0 [&>:is(p,ol,ul,figure)]:my-3 [&>:last-child]:mb-0';

type AsideProps = {
  children: ReactNode;
  title?: string;
  collapsible?: boolean;
} & VariantProps<typeof asideVariants>;

export function Aside({ children, title, variant, collapsible = false }: AsideProps) {
  return (
    <aside className={asideVariants({ variant })} aria-label={title || 'Tip'}>
      <span
        className="absolute -top-7 -left-7 hidden size-14 items-center justify-center rounded-full border-3 border-tip-accent bg-inherit text-tip-accent sm:flex"
        aria-hidden="true"
      >
        <LightbulbIcon />
      </span>
      {title && <div className="mb-3 font-heading text-lg font-bold text-tip-accent">{title}</div>}
      {collapsible ? (
        <CollapsibleAsideContent className={asideContentStyles}>{children}</CollapsibleAsideContent>
      ) : (
        <div className={asideContentStyles}>{children}</div>
      )}
    </aside>
  );
}
