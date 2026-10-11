<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## Project

Personal portfolio and frontend development blog built with Next.js App Router, React, TypeScript, Tailwind CSS,
Content Collections, and MDX. The homepage includes a procedural Three.js voxel cat rendered with React Three Fiber.

## Project map

- `src/app/`: route pages, layouts, metadata, and global theme styles. Keep route components thin; compose feature views.
- `src/features/blog/`: blog views, MDX rendering, code blocks, and table-of-contents behavior.
- `src/features/home/`: homepage view and the voxel cat.
- `src/features/about-me/`: about-page view and technology components.
- `src/components/ui/`, `icons/`, and `providers/`: shared UI primitives, icons, and application providers.
- `src/config/`: site links and post categories. `src/lib/`: shared utilities and hooks.
- `content/posts/`: MDX articles and colocated assets; `content-collections.ts` defines their schema and derived data.
- `.content-collections/`: generated content data and types. `.next/`: generated Next.js output. Do not edit either by hand.

## Commands

Use pnpm. Run commands from the repository root.

| Purpose                     | Command                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| Install locked dependencies | `pnpm install --frozen-lockfile`                                  |
| Development server          | `pnpm dev`                                                        |
| Production build            | `pnpm build`                                                      |
| Serve production build      | `pnpm start`                                                      |
| Type check                  | `pnpm typecheck`                                                  |
| Repository lint             | `pnpm lint`                                                       |
| Repository formatting check | `pnpm lint:prettier-check`                                        |
| Check selected files        | `pnpm exec eslint <files>` / `pnpm exec prettier <files> --check` |
| Format selected files       | `pnpm exec prettier <files> --write`                              |

Content Collections runs through the Next.js integration during development and builds. On a fresh checkout, missing
generated content types may require running `pnpm dev` or `pnpm build` before type checking.
The pre-commit hook runs lint-staged; pre-push runs type checking. Repository-wide fix/format commands modify files;
prefer explicit file paths when fixing a focused change.

## Working rules

- Inspect the relevant implementation before editing. Preserve unrelated staged and working-tree edits;
  do not stage, stash, commit, or revert unrelated files.
- Keep changes within the requested scope.
- Propose the approach before implementation unless the user has already authorized it.
- Prefer existing components and dependencies, feature-local ownership, and a small number of cohesive modules. Extract
  shared abstractions when there is a concrete reuse case; avoid speculative components and unnecessary helper files.

## Code and UI conventions

- Use strict TypeScript and existing import aliases: `@/*` for `src/*`, `@content/*` for `content/*`.
  Follow the configured ESLint rules, including inline type imports for mixed imports.
- Keep Server Components as the default. Add client boundaries for interaction and browser APIs; keep MDX compilation
  and server-only content work out of client modules.
- Use existing UI primitives, `cn()` for class composition, and existing `cva` variants where appropriate.
- Prefer Tailwind for JSX-owned styling and semantic theme tokens from `src/app/globals.css`.
- Preserve responsive layouts, light/dark themes, keyboard behavior, and reduced-motion handling when changing UI.
  Refactors should preserve existing appearance and smooth animation unless a behavior change is requested.
- Follow `.prettierrc`; MDX articles have their own width and prose settings.

## MDX and content

- Keep MDX rendering in `src/features/blog/`; register custom components in `components/mdx-component-map.ts`.
- Keep article typography in the MDX renderer and Shiki-generated code-block styling in `mdx/code-block.css`.
- Follow `content-collections.ts` for frontmatter and `src/config/categories.ts` for category keys. Preserve publication
  flags and existing slugs unless changing them is part of the task. Article assets live beside their post in `assets/`;
  inspect `PostImage` before changing asset paths or supported formats.

## Verification

After changes, run:

1. pnpm lint
2. pnpm typecheck

Skip visual checks.
Report any checks that fail or could not run.
