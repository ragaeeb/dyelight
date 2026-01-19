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

## Lessons Learned: Component Synchronization

### 1. State Synchronization & Event Raciness
- **The Issue**: Binding both `onChange` and `onInput` to a controlled `textarea` causes double-invocation of handlers. Combined with aggressive state polling (e.g. `setInterval`), this leads to race conditions where the cursor jumps or text value reverts during rapid edits (like pasting).
- **The Fix**: Rely SOLELY on `onChange` for React inputs. It normalizes all input types (typing, paste, IME). Remove manual polling/mutation observers; let React's state be the source of truth.

### 2. Layout Fidelity for Overlays
To achieve pixel-perfect text overlays (for highlighting), the overlay `div` must exactly match the `textarea`'s text flow.
- **Border Box**: Explicitly sync `border-width`s. Copy `box-sizing: border-box`.
- **Wrapping Strategies**: You must sync `white-space`, `word-break`, `overflow-wrap`, and `tab-size`. Defaults often differ between browsers.
- **Scrollbar Compensation**: 
  - When a vertical scrollbar appears in the textarea, it subtracts from `clientWidth`. The overlay (usually `overflow: hidden`) does not shrink.
  - **Correction**: Calculate `scrollbarWidth = offsetWidth - clientWidth - borders`. Add this value to the overlay's `padding-right` (or `padding-left` for RTL).

### 3. ResizeObservation & Infinite Loops
- **The Issue**: Using `ResizeObserver` to trigger layout sync or auto-resize is robust but dangerous. If the callback updates state/style that changes the element's size (e.g., auto-resize height), it immediately re-triggers the observer.
- **The Fix**: Always debounce `ResizeObserver` callbacks using `requestAnimationFrame`. This breaks the synchronous feedback loop and batches layout thrashing.
