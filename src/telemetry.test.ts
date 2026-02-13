import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { AIOptimizedTelemetry } from './telemetry';

type TelemetryInternals = {
    events: Array<{ description: string; stateSnapshot: Record<string, unknown>; anomalies: string[]; type: string }>;
    issueRegistry: Map<string, number>;
    valueRegistry: { getRegistry: () => Record<string, string> };
};

const makeTextarea = (value: string) =>
    ({
        clientHeight: 100,
        clientWidth: 200,
        offsetHeight: 120,
        offsetWidth: 220,
        scrollHeight: 400,
        scrollLeft: 0,
        scrollTop: 25,
        scrollWidth: 300,
        selectionDirection: 'none',
        selectionEnd: value.length,
        selectionStart: value.length,
        value,
    }) as unknown as HTMLTextAreaElement;

const makeOverlay = () =>
    ({
        clientHeight: 96,
        clientWidth: 200,
        offsetHeight: 116,
        offsetWidth: 220,
        scrollHeight: 390,
        scrollLeft: 0,
        scrollTop: 24,
        scrollWidth: 295,
    }) as unknown as HTMLDivElement;

describe('AIOptimizedTelemetry', () => {
    let originalGetComputedStyle: typeof getComputedStyle;

    beforeEach(() => {
        originalGetComputedStyle = global.getComputedStyle;
        global.getComputedStyle = ((element: Element) => {
            if ('value' in (element as unknown as Record<string, unknown>)) {
                return {
                    borderBottomWidth: '1px',
                    borderLeftWidth: '1px',
                    borderRightWidth: '1px',
                    borderTopWidth: '1px',
                    paddingBottom: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                } as unknown as CSSStyleDeclaration;
            }

            return {
                borderBottomWidth: '0px',
                borderLeftWidth: '0px',
                borderRightWidth: '0px',
                borderTopWidth: '0px',
                paddingBottom: '8px',
                paddingLeft: '12px',
                paddingRight: '31px',
                paddingTop: '8px',
            } as unknown as CSSStyleDeclaration;
        }) as unknown as typeof getComputedStyle;
    });

    afterEach(() => {
        global.getComputedStyle = originalGetComputedStyle;
    });

    it('does not record when disabled and supports setEnabled toggling', () => {
        const telemetry = new AIOptimizedTelemetry(false, 5);
        const textarea = makeTextarea('abc');

        telemetry.record('snapshot', 'system', {}, { current: textarea }, 'abc', 100, true);
        expect((telemetry as unknown as TelemetryInternals).events.length).toBe(0);

        telemetry.setEnabled(true);
        telemetry.record('snapshot', 'system', {}, { current: textarea }, 'abc', 100, true);
        expect((telemetry as unknown as TelemetryInternals).events.length).toBe(1);
    });

    it('captures geometry only for sync/system/selection events (token-lean)', () => {
        const telemetry = new AIOptimizedTelemetry(true, 10);
        const textarea = makeTextarea('hello');
        const overlay = makeOverlay();

        telemetry.record(
            'syncStyles',
            'sync',
            { scrollbarWidth: 19 },
            { current: textarea },
            'hello',
            120,
            true,
            {
                highlightLayer: overlay,
                styleOwnership: {
                    renderSetsOverlayPadding: false,
                    syncStylesAdjustedPaddingSide: 'right',
                    syncStylesSetsPadding: true,
                },
            },
        );
        telemetry.record('setValue', 'state', { newValue: 'world' }, { current: textarea }, 'world', 120, true);
        telemetry.record(
            'selectionChange',
            'user',
            { start: 1, end: 3 },
            { current: textarea },
            'hello',
            120,
            true,
            { highlightLayer: overlay },
        );

        const events = (telemetry as unknown as TelemetryInternals).events;
        const syncSnapshot = events[0]?.stateSnapshot;
        const stateSnapshot = events[1]?.stateSnapshot;
        const selectionSnapshot = events[2]?.stateSnapshot;

        expect(syncSnapshot?.textareaMetrics).toBeDefined();
        expect(syncSnapshot?.overlayMetrics).toBeDefined();
        expect(syncSnapshot?.layoutDeltas).toBeDefined();
        expect(syncSnapshot?.styleOwnership).toEqual({
            renderSetsOverlayPadding: false,
            syncStylesAdjustedPaddingSide: 'right',
            syncStylesSetsPadding: true,
        });

        expect(stateSnapshot?.textareaMetrics).toBeUndefined();
        expect(stateSnapshot?.overlayMetrics).toBeUndefined();
        expect(stateSnapshot?.layoutDeltas).toBeUndefined();
        expect(stateSnapshot?.selection).toBeDefined();

        expect(selectionSnapshot?.selection).toBeDefined();
    });

    it('tracks anomalies for mismatch, rapid events, and large paste', () => {
        const telemetry = new AIOptimizedTelemetry(true, 20);
        const textarea = makeTextarea('x'.repeat(200));

        telemetry.record('valueMismatch', 'state', {}, { current: textarea }, 'short', 100, true);
        telemetry.record('onChange', 'user', { valueLength: 200 }, { current: textarea }, '', 100, true);

        const events = (telemetry as unknown as TelemetryInternals).events;
        expect(events[0]?.anomalies.some((a) => a.includes('State mismatch'))).toBeTrue();
        expect(events[1]?.anomalies.some((a) => a.includes('Rapid event'))).toBeTrue();
        expect(events[1]?.anomalies.some((a) => a.includes('Large paste'))).toBeTrue();
    });

    it('generates issue summary, suspicious patterns, timeline, and recommendations', () => {
        const telemetry = new AIOptimizedTelemetry(true, 200);
        const textarea = makeTextarea('a'.repeat(1500));
        const overlay = makeOverlay();

        telemetry.record('valueMismatch', 'state', { previousValue: 'x', newValue: 'y' }, { current: textarea }, 'small', 100, true);
        for (let i = 0; i < 11; i++) {
            telemetry.record('syncStyles', 'sync', { padding: '8px 12px' }, { current: textarea }, textarea.value, 100, true, {
                highlightLayer: overlay,
                styleOwnership: { syncStylesSetsPadding: true, syncStylesAdjustedPaddingSide: 'right' },
            });
        }
        telemetry.record('onChange', 'user', { valueLength: textarea.value.length }, { current: textarea }, '', 100, true);
        telemetry.record('autoResize', 'sync', { beforeHeight: 1, afterHeight: 2 }, { current: textarea }, textarea.value, 100, true);
        telemetry.record('autoResize', 'sync', { beforeHeight: 2, afterHeight: 3 }, { current: textarea }, textarea.value, 100, true);
        telemetry.record('autoResize', 'sync', { beforeHeight: 3, afterHeight: 4 }, { current: textarea }, textarea.value, 100, true);
        telemetry.record('mystery', 'sync', {}, { current: textarea }, textarea.value, 100, true, { highlightLayer: overlay });

        const report = telemetry.generateAIReport({ current: textarea }, textarea.value, 100, []);

        expect(report.summary.detectedIssues.length).toBeGreaterThan(0);
        expect(report.summary.detectedIssues.some((issue) => issue.severity === 'critical')).toBeTrue();
        expect(report.summary.detectedIssues.some((issue) => issue.severity === 'warning')).toBeTrue();
        expect(report.summary.suspiciousPatterns.some((pattern) => pattern.includes('Excessive resize operations'))).toBeTrue();
        expect(report.summary.suspiciousPatterns.some((pattern) => pattern.includes('High frequency of sync operations'))).toBeTrue();
        expect(report.summary.suspiciousPatterns.some((pattern) => pattern.includes('geometry deltas'))).toBeTrue();
        expect(report.summary.recommendations.some((rec) => rec.includes('debounced with requestAnimationFrame'))).toBeTrue();
        expect(report.summary.recommendations.some((rec) => rec.includes('debouncing onChange handlers'))).toBeTrue();
        expect(report.summary.recommendations.some((rec) => rec.includes('e.preventDefault()'))).toBeTrue();

        expect(report.timeline.syncOperations.length).toBeGreaterThan(0);
        expect(report.timeline.userActions.length).toBeGreaterThan(0);
        expect(report.timeline.stateChanges.length).toBeGreaterThan(0);
        expect(report.finalState.inSync).toBeTrue();
        expect(report.metadata.componentVersion.length).toBeGreaterThan(0);
    });

    it('deduplicates large values and enforces maxEvents retention', () => {
        const telemetry = new AIOptimizedTelemetry(true, 2);
        const largeValue = 'L'.repeat(1200);
        const textarea = makeTextarea(largeValue);

        telemetry.record('snapshot', 'system', {}, { current: textarea }, largeValue, 100, true);
        telemetry.record('snapshot', 'system', {}, { current: textarea }, largeValue, 100, true);
        telemetry.record('snapshot', 'system', {}, { current: textarea }, largeValue, 100, true);

        const events = (telemetry as unknown as TelemetryInternals).events;
        const registry = (telemetry as unknown as TelemetryInternals).valueRegistry.getRegistry();
        const refs = Object.keys(registry);

        expect(events.length).toBe(2);
        expect(refs.length).toBe(1);
        expect(events[0]?.stateSnapshot.textareaValue).toBe(refs[0]);
        expect(events[1]?.stateSnapshot.reactValue).toBe(refs[0]);
    });

    it('exports AI payload and clears internal state', () => {
        const telemetry = new AIOptimizedTelemetry(true, 10);
        const textarea = makeTextarea('hello');

        telemetry.record('setValue', 'state', { previousValue: 'a', newValue: 'b' }, { current: textarea }, 'hello', 100, true);

        const exported = telemetry.exportForAI({ current: textarea }, 'hello', 100, []);
        const parsed = JSON.parse(exported) as {
            aiInstructions: { keyFields: Record<string, string>; yourTask: string[] };
            debugReport: { events: unknown[] };
        };

        expect(parsed.aiInstructions.keyFields['events[].stateSnapshot.layoutDeltas']).toBeDefined();
        expect(parsed.aiInstructions.yourTask.length).toBeGreaterThan(0);
        expect(parsed.debugReport.events.length).toBeGreaterThan(0);

        telemetry.clear();
        const internals = telemetry as unknown as TelemetryInternals;
        expect(internals.events.length).toBe(0);
        expect(internals.issueRegistry.size).toBe(0);
        expect(Object.keys(internals.valueRegistry.getRegistry()).length).toBe(0);
    });
});
