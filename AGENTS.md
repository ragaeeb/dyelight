# Agent Guidelines

## Toolchain
- Use `bun` for all project scripts (e.g., `bun run build`, `bun test`, `bun run storybook`).
- Bundles are produced with the upstream [`tsdown`](https://tsdown.dev) CLI configured in `tsdown.config.ts`; keep that file, `tsconfig.json`, and `tsconfig.build.json` aligned when tweaking build behaviour.
- Linting and formatting rely on Biome. Run `bun run lint` / `bun run format` and follow `biome.json` when adjusting rules.
- Storybook lives under `.storybook/` with stories colocated next to components (e.g., `src/DyeLight.stories.tsx`). Add or update stories when component APIs change.

## Repository structure
- `src/DyeLight.tsx` is the primary exported component. Hooks live under `src/hooks/` with matching `.test.tsx` files.
- `src/index.ts` re-exports public APIs; keep its surface stable and documented.
- Tests use Bun's `bun:test` runner with Testing Library helpers. Prefer DOM-level assertions and avoid browser-only APIs.
- Configuration files:
  - `tsdown.config.ts` – bundler entrypoints and externals.
  - `biome.json` – lint/format rules.
  - `.storybook/` – development playground config.

## Coding conventions
- Write TypeScript (ES modules) with React function components.
- Keep hooks pure, memoize derived values where possible, and avoid side effects in render.
- Prefer descriptive prop names and exhaustive object literals; avoid optional chaining in tight loops.
- Maintain comprehensive unit tests alongside code changes. When modifying hooks/components, update the paired test file.
- Use Testing Library queries (e.g., `screen.getByRole`) and Bun's `mock.module` when stubbing modules.

## Dependency management
- When updating dependencies, prefer the latest stable tags (`bun update --latest`) and re-run `bun run build` plus `bun test`.
- Document any registry/network limitations in your summary if upgrades fail.
