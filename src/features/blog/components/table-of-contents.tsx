import { Heading } from '@/components/ui/heading';
import type { TableOfContentsItem } from '@/features/blog/lib/get-table-of-contents';

type TableOfContentsProps = {
  items: TableOfContentsItem[];
};

export function TableOfContents({ items }: TableOfContentsProps) {
  return (
    <aside className="hidden max-w-62.5 lg:block">
      <nav aria-label="Table Of Contents" className="lg:sticky lg:top-41">
        <Heading variant="h2" as="h2" className="text-sm font-semibold tracking-wide uppercase">
          Table Of Contents
        </Heading>
        <ol className="border-border mt-3 space-y-2 border-l pl-4 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-muted-fg hover:text-foreground transition-colors">
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
