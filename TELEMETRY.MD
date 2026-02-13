# AI Agent Quick Reference: Debugging DyeLight with Telemetry

## TL;DR - Start Here

When given a telemetry export JSON:

1. **Check `debugReport.summary.detectedIssues`** - Auto-detected problems
2. **Look for `<REF:value_N>` references** - These point to `debugReport.valueRegistry`
3. **Follow `timeline.stateChanges`** - Chronological state mutations
4. **Find `valuesMatch: false`** - DOM/React desync points

## New Layout Forensics Fields

Telemetry now records geometry and selection state on each event (when available):

- `events[].stateSnapshot.textareaMetrics`
  - `clientWidth/clientHeight`, `offsetWidth/offsetHeight`, `scrollWidth/scrollHeight`, `scrollTop/scrollLeft`
  - `contentWidth/contentHeight` (client minus paddings)
- `events[].stateSnapshot.overlayMetrics`
  - Same metrics for the highlight overlay
- `events[].stateSnapshot.layoutDeltas`
  - `contentWidthDelta`, `contentHeightDelta`, `scrollTopDelta`, `scrollLeftDelta`
- `events[].stateSnapshot.selection`
  - `start`, `end`, `direction`
- `events[].stateSnapshot.styleOwnership`
  - `renderSetsOverlayPadding`
  - `syncStylesSetsPadding`
  - `syncStylesAdjustedPaddingSide`

These fields are the primary way to confirm visual/layout desync vs value desync.

## Capture Scope (Token-Lean by Design)

To keep reports small and fast, **full geometry snapshots are not captured on every event**.

- Geometry-heavy fields (`textareaMetrics`, `overlayMetrics`, `layoutDeltas`) are captured only for:
  - `sync` events (e.g., `syncStyles`, `syncScroll`)
  - `snapshot` events
  - `selectionChange` events
- Lighter events (e.g., many `state`/`user` events) still capture:
  - value sync state (`textareaValue`, `reactValue`, `valuesMatch`)
  - selection when available
  - anomalies and event data

Why this matters:
- Keeps telemetry exports token-lean for AI analysis
- Avoids expensive `getComputedStyle`/layout reads on high-frequency events
- Preserves enough forensic detail at the moments most relevant to layout bugs

## Common Bug Patterns

### Pattern 1: Paste Race Condition
```json
{
  "summary": {
    "detectedIssues": [{
      "severity": "critical",
      "issue": "State desynchronization between DOM and React detected",
      "occurrenceCount": 2
    }, {
      "severity": "warning", 
      "issue": "Large paste operations detected"
    }]
  }
}
```
**Diagnosis**: User's `e.preventDefault()` called too late in paste handler

**Look For**:
- Event with large `lengthDelta` (>1000 chars)
- Followed immediately (<2ms) by event with `valuesMatch: false`
- DOM value much larger than React value, then suddenly smaller
- The mismatch does NOT self-resolve on the next `syncStyles` event

**Fix**: Move `e.preventDefault()` to FIRST line of paste handler

---

### Pattern 2: Infinite Resize Loop
```json
{
  "summary": {
    "suspiciousPatterns": [
      "Excessive resize operations (500 resizes vs 10 value changes)"
    ]
  }
}
```
**Diagnosis**: ResizeObserver callback triggers another resize

**Look For**:
- Hundreds of `autoResize` events in short time
- Events with `timeSinceLastEvent` < 1ms
- Height constantly changing by small amounts

**Fix**: Debounce ResizeObserver with `requestAnimationFrame`

---

### Pattern 3: Double-Bound Event Handlers
```json
{
  "summary": {
    "detectedIssues": [{
      "severity": "warning",
      "issue": "Rapid successive events detected (possible race condition)",
      "occurrenceCount": 50
    }]
  }
}
```
**Diagnosis**: onChange and onInput both bound, or handler registered twice

**Look For**:
- Paired events <2ms apart with identical values
- Every user interaction triggers 2+ onChange events

**Fix**: Remove duplicate event bindings, use only onChange

---

### Pattern 4: Transient Mismatch (Benign — NOT a Bug)
```json
{
  "events": [
    { "type": "onChange", "stateSnapshot": { "valuesMatch": true } },
    { "type": "syncStyles", "stateSnapshot": { "valuesMatch": true }, "timeSinceLastEvent": 4 },
    { "type": "syncScroll", "stateSnapshot": { "valuesMatch": true }, "timeSinceLastEvent": 2 }
  ]
}
```
**Diagnosis**: This is **normal controlled-component behavior**, not a bug.

In controlled React components, the browser updates the DOM before React state catches up. The telemetry now skips mismatch detection during `onChange` events for this reason. If you see:
- Mismatches only on `onChange` events that resolve within 1–4ms on the next `syncStyles`
- No persistent `valuesMatch: false` on subsequent `syncStyles`/`snapshot`/`syncScroll` events

…then there is no bug. The cascade `onChange → syncStyles → syncScroll` with events 2–4ms apart is expected.

**How to tell from a REAL bug**: Real desyncs persist — `valuesMatch: false` appears on `syncStyles`, `snapshot`, or `syncScroll` events and does NOT resolve within 5ms.

---

### Pattern 5: Overlay/Textarea Geometry Divergence
```json
{
  "stateSnapshot": {
    "valuesMatch": true,
    "layoutDeltas": {
      "contentWidthDelta": 19,
      "scrollTopDelta": 0
    },
    "styleOwnership": {
      "renderSetsOverlayPadding": false,
      "syncStylesSetsPadding": true
    }
  }
}
```
**Diagnosis**: Visual alignment bug (wrap/geometry mismatch), not value desync.

**Look For**:
- `valuesMatch: true` but non-zero `contentWidthDelta` or `contentHeightDelta`
- non-zero `scrollTopDelta`/`scrollLeftDelta` that persists
- suspicious `styleOwnership` combinations (e.g., render path writing overlay padding)

**Fix**: Ensure a single owner for overlay padding/sizing and sync layout in one pipeline.

---

## Interpretation Guide (AI Root-Cause Hints)

Use this quick matrix when triaging:

| Signal | Likely Cause | Confidence |
|---|---|---|
| `valuesMatch: false` persists on non-`onChange` events | True DOM/React state desync | High |
| `valuesMatch: true` + non-zero `contentWidthDelta` | Visual wrap/geometry desync | High |
| `scrollTopDelta` or `scrollLeftDelta` persists after sync events | Scroll sync ordering issue | High |
| `styleOwnership.renderSetsOverlayPadding: true` near mismatch | Render path clobbering sync compensation | High |
| Frequent `selectionChange` around edit + geometry deltas spike | Caret/selection mapped to different visual geometry | Medium-high |
| Rapid event anomalies only, no persistent deltas | Potentially benign timing noise | Medium |

Recommended AI workflow:
1. Classify bug as **value desync** vs **geometry desync** first.
2. If geometry: inspect `layoutDeltas` + `styleOwnership` around first visible bad frame.
3. Correlate with `selectionChange` to confirm caret/selection drift.
4. Use `timeline.syncOperations` ordering to identify race windows.

## Reading Value References

### When You See This:
```json
{
  "stateSnapshot": {
    "textareaValue": "<REF:value_0>",
    "reactValue": "<REF:value_0>"
  }
}
```

### Look Here:
```json
{
  "valueRegistry": {
    "<REF:value_0>": "P11622a - ʿImrān al-Qaṭṭān; he is Ibn Dāwar...\n\n[40KB of actual text]"
  }
}
```

### Why:
- Values >1000 chars are stored once to prevent 80MB JSON files
- The reference `<REF:value_N>` is just a pointer
- Always dereference when analyzing actual content

---

## Event Categories

| Category | Meaning | Examples |
|----------|---------|----------|
| `user` | Direct user interaction | onChange (typing/paste) |
| `state` | Programmatic state change | setValue, valueMismatch |
| `sync` | Layout synchronization | syncScroll, syncStyles |
| `system` | Background/periodic | snapshot |

Additional user event:
- `selectionChange`: selection/caret updates from `onSelect` and document-level `selectionchange`

---

## Anomaly Types

| Anomaly | Severity | Meaning |
|---------|----------|---------|
| `State mismatch: DOM="X" vs React="Y"` | Critical | Controlled component desync (only flagged for non-`onChange` events) |
| `Rapid event: 1ms since last event` | Warning | Possible race condition (threshold: <2ms) |
| `Large paste detected: 40000 characters` | Info | May indicate paste bug |

---

## Step-by-Step Debugging

### Step 1: Skim the Summary
```json
"summary": {
  "description": "Found 2 issue(s) during 150 events over 3.2s",
  "detectedIssues": [...],
  "suspiciousPatterns": [...],
  "recommendations": [...]
}
```
This tells you immediately if there's a problem and what type.

### Step 2: Check Final State
```json
"finalState": {
  "textareaValue": "<REF:value_0>",
  "reactValue": "<REF:value_0>", 
  "inSync": true,
  "height": 240
}
```
If `inSync: false`, there's currently a mismatch.

### Step 3: Find the Divergence Point
```json
"timeline": {
  "stateChanges": [
    {
      "timestamp": "2026-02-02T21:51:53.146Z",
      "type": "onChange",
      "before": "<REF:value_0>",
      "after": "<REF:value_1>",
      "unexpected": false
    },
    {
      "timestamp": "2026-02-02T21:51:53.149Z",  // +3ms
      "type": "valueMismatch",
      "unexpected": true  // ← Found it!
    }
  ]
}
```
The first `unexpected: true` event is often the root cause.

### Step 4: Examine Related Events
```json
"detectedIssues": [{
  "issue": "State desynchronization",
  "relatedEvents": [45, 46, 47]  // ← Check these
}]
```
Look at `events[45]`, `events[46]`, `events[47]` for the full picture.

### Step 5: Dereference Values
```javascript
// In your analysis script:
const event = events[45];
const actualValue = event.stateSnapshot.textareaValue.startsWith('<REF:')
    ? valueRegistry[event.stateSnapshot.textareaValue]
    : event.stateSnapshot.textareaValue;

// Now analyze the actual content
console.log('Value length:', actualValue.length);
console.log('First 100 chars:', actualValue.slice(0, 100));
```

---

## Quick Scripts

### Find All Mismatches
```javascript
const mismatches = events.filter(e => !e.stateSnapshot.valuesMatch);
console.log(`Found ${mismatches.length} mismatches at:`,
    mismatches.map(e => e.timestampISO));
```

### Find Rapid Events
```javascript
const rapid = events.filter(e => e.timeSinceLastEvent !== null && e.timeSinceLastEvent < 2);
console.log(`${rapid.length} events fired <2ms apart`);
```

### Find Geometry Divergence
```javascript
const geometry = events.filter(e => {
    const d = e.stateSnapshot.layoutDeltas;
    if (!d) return false;
    return (Math.abs(d.contentWidthDelta ?? 0) > 0.5) ||
           (Math.abs(d.contentHeightDelta ?? 0) > 0.5) ||
           (Math.abs(d.scrollTopDelta ?? 0) > 0.5) ||
           (Math.abs(d.scrollLeftDelta ?? 0) > 0.5);
});
console.log(`Found ${geometry.length} geometry-divergent events`);
```

### Find Selection Drift Around Edits
```javascript
const sel = events.filter(e => e.type === 'selectionChange' || e.type === 'onChange');
sel.forEach(e => {
    const s = e.stateSnapshot.selection;
    const d = e.stateSnapshot.layoutDeltas;
    console.log(e.timestampISO, e.type, s, d);
});
```

### Analyze Paste Events
```javascript
const pastes = events.filter(e => 
    e.type === 'onChange' && 
    Math.abs(e.data.lengthDelta) > 100
);
pastes.forEach(p => {
    const next = events[events.indexOf(p) + 1];
    console.log(`Paste at ${p.timestampISO}:`);
    console.log(`  Added: ${p.data.lengthDelta} chars`);
    console.log(`  Next event: ${next.type} (+${next.timeSinceLastEvent}ms)`);
    console.log(`  Next valuesMatch: ${next.stateSnapshot.valuesMatch}`);
});
```

---

## Red Flags

| If You See... | It Usually Means... |
|---------------|---------------------|
| `valuesMatch: false` on `syncStyles`/`snapshot` right after paste | Paste handler prevents default too late |
| `valuesMatch: false` only on `onChange`, resolves on next `syncStyles` | Normal controlled-component behavior (benign) |
| `valuesMatch: true` but `contentWidthDelta != 0` | Visual/layout desync between overlay and textarea |
| `scrollTopDelta` persists after sync | Scroll synchronization mismatch |
| 100+ resize events in <1 second | Infinite ResizeObserver loop |
| Events paired <2ms apart | Double-bound handlers or race condition |
| DOM value suddenly becomes 0 chars | Unexpected state reset or clear |
| `lengthDelta: 40000` then `lengthDelta: -39988` | Raw paste → normalized value sequence |

---

## Before Filing a Bug Report

1. ✅ Exported telemetry with debug mode enabled
2. ✅ Reproduced issue 2-3 times consistently  
3. ✅ Checked `summary.detectedIssues` for auto-diagnosis
4. ✅ Identified the specific event(s) where the issue occurs
5. ✅ Dereferenced any `<REF:value_N>` values to see actual content
6. ✅ Checked related events before/after the problematic one
7. ✅ Reviewed recommendations in `summary.recommendations`
8. ✅ Checked `layoutDeltas` and `selection` around the first bad frame
9. ✅ Checked `styleOwnership` on nearby `syncStyles` events

---

## Getting Help

If the telemetry isn't clear:

1. **Simplify the reproduction** - Enable debug, paste once, export immediately
2. **Add context** - What were you doing when the bug occurred?
3. **Check metadata** - Browser version, React version might matter
4. **Share the full export** - Don't excerpt, the context matters

---

## Cheat Sheet: Common Fixes

| Problem | Fix |
|---------|-----|
| Paste race condition | Move `e.preventDefault()` to first line |
| Resize loop | Wrap callback in `requestAnimationFrame` |
| Double onChange | Remove onInput binding, use only onChange |
| State mismatch | Add immediate DOM sync in controlled mode |
| Cursor jumping | Check for multiple setValue calls |

---

## Pro Tips

1. **Enable debug BEFORE reproducing** - Can't capture events retroactively
2. **Export immediately after bug** - Events are limited to maxEvents (default: 1000)
3. **Look at `timeSinceLastEvent`** - Tight clusters (<2ms) indicate problems
4. **Check the last few events** - Often show the current broken state
5. **Compare before/after values** - What actually changed?
6. **Trust auto-detection, but verify transient issues** - Check if flagged mismatches self-resolve within a few ms before investigating deeply. The telemetry skips known benign patterns (like `onChange` mismatches), but edge cases can still trigger false positives during large pastes into empty textareas.

---

## Example: Complete Analysis

```javascript
// 1. Load the export
const data = JSON.parse(reportJSON);
const { events, valueRegistry, summary } = data.debugReport;

// 2. Check for auto-detected issues
console.log('Issues:', summary.detectedIssues);
// Output: [{ severity: 'critical', issue: 'State desynchronization' }]

// 3. Find the problematic events
const issue = summary.detectedIssues[0];
const problemEvents = issue.relatedEvents.map(i => events[i]);

// 4. Dereference values
problemEvents.forEach(event => {
    const textarea = event.stateSnapshot.textareaValue;
    const react = event.stateSnapshot.reactValue;
    
    const actualTextarea = textarea.startsWith('<REF:') 
        ? valueRegistry[textarea] 
        : textarea;
    const actualReact = react.startsWith('<REF:') 
        ? valueRegistry[react] 
        : react;
    
    console.log(`[${event.type}] DOM=${actualTextarea.length} React=${actualReact.length}`);
});

// 5. Follow the recommendation
console.log('Fix:', summary.recommendations[0]);
// Output: "State desynchronization detected. Check if e.preventDefault() 
//          is called BEFORE reading clipboard data..."
```

This analysis identified the paste bug in under 1 minute!
