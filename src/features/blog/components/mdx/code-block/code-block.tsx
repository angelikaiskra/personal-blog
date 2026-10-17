import { Children, type ReactNode } from 'react';

import { CodeBlockTabs } from './code-block-tabs';

type CodeBlockProps = {
  tabs: string;
  children: ReactNode;
};

export function CodeBlock({ tabs, children }: CodeBlockProps) {
  const panels = Children.toArray(children).filter((child) => typeof child !== 'string' || child.trim() !== '');
  const examples = tabs.split(',').map((label, index) => ({
    label: label.trim(),
    content: panels[index],
  }));

  return <CodeBlockTabs examples={examples} />;
}
