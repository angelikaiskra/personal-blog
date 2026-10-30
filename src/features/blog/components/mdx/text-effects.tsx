import type { ReactNode } from 'react';

type TextEffectProps = {
  children: ReactNode;
};

export function HighlightedText({ children }: TextEffectProps) {
  return <span className="font-heading font-extrabold text-link-accent dark:text-accent">{children}</span>;
}

export function Strike({ children }: TextEffectProps) {
  return <s>{children}</s>;
}
