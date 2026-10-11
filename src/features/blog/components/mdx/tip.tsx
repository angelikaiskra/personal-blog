import type { ReactNode } from 'react';

type TipProps = {
  children: ReactNode;
};

export function Tip({ children }: TipProps) {
  return <aside className="my-6 border-l-2 border-foreground/30 pl-4 text-muted-fg">{children}</aside>;
}
