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

### 4. Paste Event Handling in Controlled Components
- **The Issue**: When users paste content, calling `e.preventDefault()` AFTER reading clipboard data is too late—the browser has already inserted the raw clipboard text into the textarea DOM. This creates a race condition:
  1. Browser pastes raw content into DOM (e.g., 40KB)
  2. User's handler normalizes to smaller value (e.g., 12 chars)
  3. React's `onChange` fires with the 40KB DOM value
  4. React re-renders with the 12-char value
  5. Brief window where DOM ≠ React state, causing visible flicker and state desync
- **The Fix**: Call `e.preventDefault()` as the FIRST LINE in your paste handler, before reading clipboard data:
  ```typescript
  const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault(); // ← FIRST LINE - prevents browser from modifying DOM
      const text = e.clipboardData.getData('text');
      // ... process and normalize text
      setTextValue(normalizedText);
      // Manually update cursor position since we prevented default
      setTimeout(() => {
          target.setSelectionRange(newPos, newPos);
      }, 0);
  };
  ```
- **Anti-Pattern**: Using a ref flag (like `justPastedRef`) to suppress `onChange` doesn't prevent the race—the damage is already done when `onChange` fires with the wrong value.
- **Related Telemetry Patterns**: Look for:
  - Large `lengthDelta` in `onChange` events (e.g., 40K chars changed at once)
  - `stateSnapshot.valuesMatch: false` on non-`onChange` events (e.g., `syncStyles`) immediately after user paste events
  - Rapid events (<2ms apart) following a paste operation
  - Events where DOM value is much larger than React value, then suddenly smaller

### 5. Controlled Component Defensive Sync
- **The Issue**: React's controlled components update the DOM asynchronously via the render cycle. During rapid state changes (like paste), there's a brief window where the DOM value doesn't match React state.
- **The Fix**: In controlled mode, immediately sync the DOM value when handling state changes:
  ```typescript
  const handleChange = (newValue: string) => {
      // Immediate DOM sync for controlled components
      if (isControlled && textareaRef.current && textareaRef.current.value !== newValue) {
          textareaRef.current.value = newValue;
      }
      // ... update state
  };
  ```
- **Why**: This eliminates the async window and prevents `onChange` events from seeing stale DOM values.

## Debugging with Telemetry

### Reading Telemetry Reports
When analyzing a telemetry export from `DyeLight`:

1. **Check the Summary First**: The `summary.detectedIssues` section automatically flags common problems (state mismatches, race conditions, infinite loops).

2. **Follow the Timeline**: Look at `timeline.stateChanges` in chronological order to see the sequence of state mutations. Focus on events marked `unexpected: true`.

3. **Value Deduplication**: Large text values (>1000 chars) are stored in `valueRegistry` and referenced as `<REF:value_N>`. To see the actual value:
   ```json
   {
     "stateSnapshot": {
       "textareaValue": "<REF:value_0>",
       "reactValue": "<REF:value_0>"
     }
   }
   // Look up in:
   "valueRegistry": {
     "<REF:value_0>": "...actual 40KB text here..."
   }
   ```

4. **Common Issue Patterns**:
   - **State Mismatch**: `stateSnapshot.valuesMatch: false` on non-`onChange` events indicates DOM and React are out of sync. During `onChange`, a transient mismatch is normal (see "Known Benign Patterns" below).
   - **Rapid Events**: Events <2ms apart suggest race conditions or double-bound handlers
   - **Resize Loop**: More resize events than value changes indicates infinite `ResizeObserver` loop
   - **Large Paste**: `lengthDelta` >100 chars in a single `onChange` event suggests paste handling issues

5. **Event Categories**:
   - `user`: Direct user interactions (typing, pasting)
   - `state`: Programmatic state changes (setValue, etc.)
   - `sync`: Layout synchronization operations
   - `system`: Periodic snapshots and background tasks

### Telemetry Best Practices
- Keep `maxEvents` reasonable (default: 1000) to avoid memory bloat
- Enable debug mode only when investigating issues, not in production
- Export reports immediately after reproducing the bug
- Look for anomalies in the first few events—initial sync issues often indicate setup problems
- Check `timeSinceLastEvent` to identify performance bottlenecks

### Reducing Cognitive Complexity
When extending telemetry or similar diagnostic code:
- Extract issue detection logic into separate functions (e.g., `detectIssues()`, `detectSuspiciousPatterns()`)
- Build timelines and reports in focused utility functions
- Keep the main analysis function as a composition of smaller pieces
- Target cognitive complexity <15 (Biome's default threshold)
- Each function should do ONE thing: detect issues OR build timeline OR format report

### Known Benign Patterns
These patterns look alarming in telemetry but are **expected behavior** — do NOT treat them as bugs:

1. **`valuesMatch: false` during `onChange` events**: In controlled React components, the browser updates the textarea DOM *before* React state catches up. A transient mismatch during `onChange` is normal. The telemetry skips mismatch detection for `onChange` events for this reason. If you see mismatches **only** on `onChange` events that self-resolve within 1–4ms on the next `syncStyles` event, this is **not a bug**.

2. **Rapid `syncStyles`/`syncScroll` after `onChange`**: The normal cascade is `onChange → handleChangeWithResize → auto-resize → ResizeObserver → syncStyles → syncScroll`. Events 2–4ms apart in this sequence are expected.

3. **`valuesMatch: false` on first `syncStyles` after a large paste into an empty textarea**: During the first paste, `syncStyles` may fire (via `ResizeObserver`) before React processes the state update. This self-resolves within 1–2ms as React catches up.

**How to tell benign from real bugs**: Real state desynchronization persists across multiple events and does NOT self-resolve. If `valuesMatch: false` appears on `syncStyles`, `snapshot`, or `syncScroll` events and does **not** resolve to `true` within 5ms, investigate further.

### Common Pitfalls
1. **Forgetting to deduplicate large values**: Without deduplication, a single 40KB paste creates a 40MB JSON report after 1000 events
2. **Over-logging**: Logging every keystroke with full context creates noise. Focus on state changes and anomalies.
3. **Ignoring rapid events**: Events <2ms apart are often the smoking gun for race conditions
4. **Not checking valueRegistry**: When you see `<REF:value_N>`, always look it up—the actual value matters
5. **Dismissing "info" severity issues**: Even info-level issues can indicate patterns that become critical under load
6. **Chasing transient mismatches**: Check if a `valuesMatch: false` resolves itself on the very next event before investigating — most do (see "Known Benign Patterns")

## Testing Paste Handling
When testing paste functionality:
1. Test with large pastes (>10KB) to expose race conditions
2. Test rapid consecutive pastes to expose state management issues  
3. Enable debug mode and verify no `stateSnapshot.valuesMatch: false` events
4. Check that cursor position is correct after paste
5. Verify no visual flicker or content flash during paste

## Performance Considerations
- Debounce `ResizeObserver` callbacks with `requestAnimationFrame`
- Avoid synchronous DOM queries in tight loops
- Use `useMemo` for expensive highlight calculations
- Keep telemetry disabled in production builds
- Consider virtualizing for very large documents (>100KB)