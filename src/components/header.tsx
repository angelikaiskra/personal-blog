import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projekty" },
  { href: "/about", label: "O mnie" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-semibold text-foreground hover:text-accent transition-colors"
        >
          angela iskra
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm text-muted-fg hover:text-foreground rounded-md hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
