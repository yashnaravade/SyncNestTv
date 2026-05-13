# Release Note: SyncNestTv TypeScript Upgrade

## Release Summary

- **Release date:** 2026-05-13
- **Commit:** c561779
- **Branch:** master
- **Scope:** Upgrade monorepo TypeScript and framework dependencies, and update repository ignore rules.

## Key Changes

- Upgraded **TypeScript** to `^7.0.0` for both `apps/api` and `apps/web`
- Updated **NestJS** packages in `apps/api` to the latest compatible versions
- Upgraded **Next.js**, **React**, and **React DOM** in `apps/web`
- Updated frontend tooling:
  - `tailwindcss`
  - `postcss`
  - `autoprefixer`
  - `eslint`
  - `eslint-config-next`
- Added `.claude/` and `social_streaming_platform_v2.md` to `.gitignore`
- Applied TypeScript configuration fixes for modern package resolution and NestJS decorators

## Files Changed

- `.gitignore`
- `apps/api/package.json`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `tsconfig.base.json`

## Notes

- No separate pull request was created because the changes were pushed directly to `master`.
- The repository now ignores local Claude settings and the social streaming service documentation file.
- Verify both applications locally after pulling the update.

## Recommended Verification

1. Run `pnpm install`
2. Start development servers for both apps:
   - `pnpm --filter apps/api dev`
   - `pnpm --filter apps/web dev`
3. Confirm API endpoints and frontend pages render successfully
