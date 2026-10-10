import type { Options } from 'rehype-pretty-code';

export const prettyCodeOptions = {
  theme: {
    light: 'github-light',
    dark: 'github-dark',
  },
  keepBackground: true,
  bypassInlineCode: true,
  defaultLang: { block: 'plaintext' },
  grid: false,
} satisfies Options;
