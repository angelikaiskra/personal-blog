import type { ReactNode } from 'react';

type TextEffectProps = {
  children: ReactNode;
};

export function Strike({ children }: TextEffectProps) {
  return <s>{children}</s>;
}

export function Wave({ children }: TextEffectProps) {
  return <span>{children}</span>;
}
