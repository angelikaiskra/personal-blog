import type { ReactNode } from 'react';

type TipProps = {
  children: ReactNode;
};

export function Tip({ children }: TipProps) {
  return <aside className="border-foreground/30 text-muted-fg my-6 border-l-2 pl-4">{children}</aside>;
}
