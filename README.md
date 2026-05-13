# SyncNestTv

StreamTogether is a self-hosted social streaming platform monorepo scaffold. It includes a Next.js web app, a NestJS API, shared TypeScript packages, workspace tooling, and a local Docker Compose setup for PostgreSQL and Redis.

## What is included

- `apps/web` — Next.js 14 App Router starter app with Tailwind CSS and basic UI scaffolding
- `apps/api` — NestJS starter API with TypeScript strict mode and a minimal controller/service setup
- `packages/shared` — shared types/constants package for cross-app reuse
- `pnpm` workspaces and `turbo` config for monorepo orchestration
- ESLint + Prettier configured across the repo
- `docker-compose.yml` with PostgreSQL and Redis for local development

## Quickstart

```bash
pnpm install
pnpm dev
```

> The repo is configured for workspace-based development. Run package-specific commands from the package directory if needed.

## Workspace commands

- `pnpm install` — install dependencies for the whole monorepo
- `pnpm dev` — run `turbo run dev` across workspaces
- `pnpm build` — run `turbo run build`
- `pnpm lint` — run `turbo run lint`
- `pnpm start` — run `turbo run start`

## Package commands

### `apps/web`

- `pnpm dev` — start Next.js development server
- `pnpm build` — build the web app
- `pnpm start` — start the web app in production mode
- `pnpm lint` — run Next.js linting

### `apps/api`

- `pnpm start:dev` — start NestJS in watch mode
- `pnpm build` — build the API
- `pnpm lint` — lint source files

## Local services

Use Docker Compose to run local infrastructure:

```bash
docker compose up -d
```

This starts:

- PostgreSQL
- Redis

## Notes

- The monorepo uses `pnpm` and `turbo` for workspace management.
- The current setup is intentionally a skeleton with no production features yet.
- Development dependencies were updated for compatibility with the current TypeScript and ESLint toolchain.
