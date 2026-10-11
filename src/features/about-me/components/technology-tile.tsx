import type { ComponentPropsWithoutRef, ComponentType } from 'react';
import { cva } from 'class-variance-authority';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export type TechnologyTileSize = 'small' | 'medium' | 'big';

export type TechnologyIcon = ComponentType<ComponentPropsWithoutRef<'svg'>>;

const tileVariants = cva(
  'flex flex-col items-center justify-center rounded-xl bg-surface text-center dark:bg-muted-hover',
  {
    variants: {
      size: {
        small: 'gap-y-2 p-2',
        medium: 'gap-y-4 p-3',
        big: 'gap-y-5 p-4 md:row-span-2',
      } satisfies Record<TechnologyTileSize, string>,
    },
  },
);

const iconVariants = cva('', {
  variants: {
    size: {
      small: 'size-8',
      medium: 'size-9',
      big: 'size-10 md:size-12',
    } satisfies Record<TechnologyTileSize, string>,
  },
});

const labelVariants = {
  small: 'small',
  medium: 'base',
  big: 'base',
} as const satisfies Record<TechnologyTileSize, 'small' | 'base'>;

type TechnologyTileProps = {
  icon: TechnologyIcon;
  label: string;
  size: TechnologyTileSize;
  iconClassName?: string;
} & Omit<ComponentPropsWithoutRef<'li'>, 'children'>;

export function TechnologyTile({ icon: Icon, label, size, className, iconClassName, ...props }: TechnologyTileProps) {
  return (
    <li className={cn(tileVariants({ size }), className)} {...props}>
      <Icon className={cn(iconVariants({ size }), iconClassName)} />
      <Text as="span" variant={labelVariants[size]}>
        {label}
      </Text>
    </li>
  );
}
