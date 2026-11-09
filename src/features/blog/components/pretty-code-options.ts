import type { Options } from 'rehype-pretty-code';

import { codeRefsTransformer } from '../lib/code-refs-transformer';

export const prettyCodeOptions = {
  theme: {
    light: 'github-light',
    dark: 'github-dark',
  },
  keepBackground: true,
  bypassInlineCode: true,
  defaultLang: { block: 'plaintext' },
  grid: false,
  transformers: [codeRefsTransformer],
} satisfies Options;
