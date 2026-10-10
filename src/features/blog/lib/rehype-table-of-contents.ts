export type TableOfContentsItem = {
  id: string;
  title: string;
  level: 2 | 3;
};

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { id?: unknown };
  children?: HastNode[];
};

function textContent(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return node.children?.map(textContent).join('') ?? '';
}

// Runs after rehypeSlug so navigation uses the rendered heading IDs.
export function rehypeTableOfContents({ items }: { items: TableOfContentsItem[] }) {
  return function transform(tree: HastNode) {
    function visit(node: HastNode) {
      if ((node.tagName === 'h2' || node.tagName === 'h3') && typeof node.properties?.id === 'string') {
        items.push({ id: node.properties.id, title: textContent(node), level: node.tagName === 'h2' ? 2 : 3 });
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
