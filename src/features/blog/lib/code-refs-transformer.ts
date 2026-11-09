import type { Options } from 'rehype-pretty-code';

type ShikiTransformer = NonNullable<Options['transformers']>[number];

type CodeRef = {
  id: string;
  lines: number[];
};

// Matches `{range}#id` in the fence meta
const codeRefPattern = /\{([\d\s,-]+)\}#([\w-]+)/g;

// Expands a range into line numbers: "1,3-5" → [1, 3, 4, 5]
function parseLineRange(range: string): number[] {
  const lines: number[] = [];

  for (const part of range.split(',')) {
    const [start, end = start] = part.split('-').map(Number);

    for (let line = start; line <= end; line++) {
      lines.push(line);
    }
  }

  return lines;
}

// Reads every `{range}#id` from the fence meta, e.g. "{10-12}#effect {7}#setState"
function parseCodeRefs(meta: string): CodeRef[] {
  const codeRefs: CodeRef[] = [];

  for (const match of meta.matchAll(codeRefPattern)) {
    const [, range, id] = match;
    if (!range || !id) continue;

    codeRefs.push({ id, lines: parseLineRange(range) });
  }

  return codeRefs;
}

// Tags each code line with the ids of every range it belongs to
// `CodeRef` in the article uses this attribute to find the lines to highlight
export const codeRefsTransformer: ShikiTransformer = {
  name: 'code-refs',
  line(lineElement, lineNumber) {
    const meta = this.options.meta?.__raw ?? '';
    const lineRefIds = parseCodeRefs(meta)
      .filter((codeRef) => codeRef.lines.includes(lineNumber))
      .map((codeRef) => codeRef.id);

    if (lineRefIds.length === 0) return;

    lineElement.properties['data-code-refs'] = lineRefIds.join(' ');
  },
};
