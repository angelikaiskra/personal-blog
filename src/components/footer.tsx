export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-3xl px-4 flex items-center justify-between text-sm text-muted-fg">
        <p>© {new Date().getFullYear()} Angela Iskra</p>
        <div className="flex gap-4">
          <a
            href="https://github.com/angela-iskra"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="/feed.xml"
            className="hover:text-foreground transition-colors"
          >
            RSS
          </a>
        </div>
      </div>
    </footer>
  );
}
