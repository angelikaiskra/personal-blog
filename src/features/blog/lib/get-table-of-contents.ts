export type TableOfContentsItem = {
  id: string;
  title: string;
};

export function getTableOfContents(content: string): TableOfContentsItem[] {
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].replace(/[*_`]/g, '').trim());
  const ids = new Map<string, number>();

  return headings.map((title) => {
    const baseId = slugify(title);
    const occurrence = ids.get(baseId) ?? 0;
    ids.set(baseId, occurrence + 1);

    return { id: occurrence === 0 ? baseId : `${baseId}-${occurrence}`, title };
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
