# Angela Iskra's site

This repository contains the source code for [angelaiskra.com](https://angelaiskra.com).

Built with **Next.js, React, TypeScript and Tailwind CSS**. Articles use MDX and
Content Collections, with Shiki syntax highlighting.

## Prerequisites

- Node.js **22.22.1+**
- pnpm
- Git

## Run locally

Use pnpm from the repository root:

```bash
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

## Commands

| Command                    | Purpose                    |
| -------------------------- | -------------------------- |
| `pnpm build`               | Build for production       |
| `pnpm start`               | Serve the production build |
| `pnpm lint`                | Run ESLint                 |
| `pnpm typecheck`           | Check TypeScript           |
| `pnpm lint:prettier-check` | Check formatting           |

## Husky

Git hooks are set up by the `prepare` script during `pnpm install`:

- **Pre-commit:** runs `lint-staged` with `eslint` and `prettier --write`.
- **Pre-push:** runs `pnpm typecheck`.
