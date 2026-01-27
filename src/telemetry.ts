/**
 * @fileoverview AI-Optimized Telemetry System for DyeLight
 *
 * This format is specifically designed to be parsed by LLMs for debugging.
 * It includes rich context, clear narratives, and structured anomaly detection.
 */

import React from 'react';

/**
 * Represents a single telemetry event with full context
 */
export type AITelemetryEvent = {
    /** Unix timestamp in milliseconds */
    timestamp: number;
    /** ISO 8601 formatted timestamp */
    timestampISO: string;
    /** Milliseconds since the last event, or null for first event */
    timeSinceLastEvent: number | null;
    /** Event type identifier */
    type: string;
    /** Event category for grouping and analysis */
    category: 'state' | 'dom' | 'sync' | 'user' | 'system';
    /** Human-readable description of the event */
    description: string;
    /** Event-specific data payload */
    data: Record<string, unknown>;
    /** Complete state snapshot at the time of this event */
    stateSnapshot: {
        /** Actual value in the textarea DOM element */
        textareaValue: string;
        /** Value in React state */
        reactValue: string;
        /** Whether DOM and React state are synchronized */
        valuesMatch: boolean;
        /** Current height of the textarea in pixels */
        textareaHeight: number | undefined;
        /** Whether the component is in controlled mode */
        isControlled: boolean;
    };
    /** Detected anomalies or issues at this event */
    anomalies: string[];
};

/**
 * Complete AI-readable debug report structure
 */
export type AIDebugReport = {
    /** Metadata about the report and environment */
    metadata: {
        /** When this report was generated */
        generatedAt: string;
        /** DyeLight version */
        componentVersion: string;
        /** Total number of events recorded */
        totalEvents: number;
        /** Time range covered by events */
        timespan: {
            /** ISO timestamp of first event */
            start: string;
            /** ISO timestamp of last event */
            end: string;
            /** Duration in milliseconds */
            durationMs: number;
        };
        /** Browser user agent string */
        browser: string;
        /** Platform identifier */
        platform: string;
        /** React version */
        reactVersion: string;
    };

    /** Analysis summary with detected issues */
    summary: {
        /** High-level description of findings */
        description: string;
        /** List of detected issues sorted by severity */
        detectedIssues: Array<{
            /** Issue severity level */
            severity: 'critical' | 'warning' | 'info';
            /** Issue description */
            issue: string;
            /** When this issue first occurred */
            firstOccurrence: string;
            /** How many times this issue occurred */
            occurrenceCount: number;
            /** Event indices where this issue occurred */
            relatedEvents: number[];
        }>;
        /** Suspicious patterns detected in event sequences */
        suspiciousPatterns: string[];
        /** Recommended actions to resolve issues */
        recommendations: string[];
    };

    /** Different views of the event timeline */
    timeline: {
        /** User interactions and their impacts */
        userActions: Array<{
            /** When the action occurred */
            timestamp: string;
            /** What the user did */
            action: string;
            /** Number of state changes triggered */
            resultingStateChanges: number;
        }>;
        /** All state mutations in chronological order */
        stateChanges: Array<{
            /** When the change occurred */
            timestamp: string;
            /** Type of state change */
            type: string;
            /** Previous value */
            before: unknown;
            /** New value */
            after: unknown;
            /** Whether this change was unexpected */
            unexpected: boolean;
        }>;
        /** Synchronization operations between textarea and overlay */
        syncOperations: Array<{
            /** When the sync occurred */
            timestamp: string;
            /** Type of synchronization */
            operation: string;
            /** Whether sync was successful */
            success: boolean;
            /** Additional sync details */
            details: Record<string, unknown>;
        }>;
    };

    /** Complete chronological list of all events */
    events: AITelemetryEvent[];

    /** Final state at time of export */
    finalState: {
        /** Current textarea DOM value */
        textareaValue: string;
        /** Current React state value */
        reactValue: string;
        /** Whether values are synchronized */
        inSync: boolean;
        /** Current height in pixels */
        height: number | undefined;
        /** Current scroll position */
        scrollPosition: { top: number; left: number };
        /** Current highlights configuration */
        highlights: unknown[];
    };
};

/**
 * AI-optimized telemetry collector for the DyeLight component.
 * Records events with full context and generates comprehensive debug reports
 * that can be analyzed by AI language models.
 */
export class AIOptimizedTelemetry {
    private events: AITelemetryEvent[] = [];
    private maxEvents = 1000;
    private enabled = false;
    private lastEventTimestamp: number | null = null;
    private issueRegistry = new Map<string, number>();

    /**
     * Creates a new telemetry instance
     * @param enabled Whether telemetry collection is initially enabled
     * @param maxEvents Maximum number of events to retain in memory
     */
    constructor(enabled = false, maxEvents = 1000) {
        this.enabled = enabled;
        this.maxEvents = maxEvents;
    }

    /**
     * Enable or disable telemetry collection
     * @param enabled Whether to enable telemetry
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    /**
     * Records an event with full context for AI analysis
     * @param type Event type identifier
     * @param category Event category for grouping
     * @param data Event-specific data
     * @param textareaRef Reference to the textarea element
     * @param currentValue Current React state value
     * @param textareaHeight Current textarea height
     * @param isControlled Whether component is in controlled mode
     */
    record(
        type: string,
        category: 'state' | 'dom' | 'sync' | 'user' | 'system',
        data: Record<string, unknown>,
        textareaRef: React.RefObject<HTMLTextAreaElement | null>,
        currentValue: string | undefined,
        textareaHeight: number | undefined,
        isControlled: boolean,
    ) {
        if (!this.enabled) {
            return;
        }

        const now = Date.now();
        const timeSinceLastEvent = this.lastEventTimestamp ? now - this.lastEventTimestamp : null;

        const textareaValue = textareaRef.current?.value ?? '';
        const reactValue = currentValue ?? '';
        const valuesMatch = textareaValue === reactValue;

        const anomalies: string[] = [];

        if (!valuesMatch) {
            anomalies.push(`State mismatch: DOM="${textareaValue}" vs React="${reactValue}"`);
            this.issueRegistry.set('state_mismatch', (this.issueRegistry.get('state_mismatch') ?? 0) + 1);
        }

        if (timeSinceLastEvent !== null && timeSinceLastEvent < 5) {
            anomalies.push(`Rapid event: ${timeSinceLastEvent}ms since last event`);
            this.issueRegistry.set('rapid_events', (this.issueRegistry.get('rapid_events') ?? 0) + 1);
        }

        if (category === 'user' && type === 'onChange') {
            const lengthDelta = Math.abs(textareaValue.length - reactValue.length);
            if (lengthDelta > 100) {
                anomalies.push(`Large paste detected: ${lengthDelta} characters changed`);
                this.issueRegistry.set('large_paste', (this.issueRegistry.get('large_paste') ?? 0) + 1);
            }
        }

        const event: AITelemetryEvent = {
            anomalies,
            category,
            data,
            description: this.generateDescription(type, category, data),
            stateSnapshot: { isControlled, reactValue, textareaHeight, textareaValue, valuesMatch },
            timeSinceLastEvent,
            timestamp: now,
            timestampISO: new Date(now).toISOString(),
            type,
        };

        this.events.push(event);
        this.lastEventTimestamp = now;

        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }
    }

    /**
     * Generates a human-readable description for an event
     * @param type Event type
     * @param category Event category
     * @param data Event data
     * @returns Human-readable description
     */
    private generateDescription(type: string, category: string, data: Record<string, unknown>): string {
        switch (type) {
            case 'onChange':
                return `User typed/pasted text. New length: ${data.valueLength}`;
            case 'autoResize':
                return `Textarea auto-resized from ${data.beforeHeight}px to ${data.afterHeight}px`;
            case 'syncScroll':
                return `Synchronized scroll position to top:${(data as any).after?.scrollTop ?? 0}`;
            case 'syncStyles':
                return `Synchronized styles (padding, font, borders) between textarea and overlay`;
            case 'valueMismatch':
                return `CRITICAL: DOM value differs from React state`;
            case 'setValue':
                return `Programmatic value change via ref.setValue()`;
            case 'snapshot':
                return `Periodic state snapshot for debugging`;
            default:
                return `${category} event: ${type}`;
        }
    }

    /**
     * Generates a comprehensive AI-readable debug report
     * @param textareaRef Reference to the textarea element
     * @param currentValue Current React state value
     * @param textareaHeight Current textarea height
     * @param highlights Current highlights configuration
     * @param lineHighlights Current line highlights configuration
     * @returns Complete debug report
     */
    generateAIReport(
        textareaRef: React.RefObject<HTMLTextAreaElement | null>,
        currentValue: string | undefined,
        textareaHeight: number | undefined,
        highlights: unknown[],
        lineHighlights: Record<number, string>,
    ): AIDebugReport {
        const firstEvent = this.events[0];
        const lastEvent = this.events[this.events.length - 1];
        const timespan = lastEvent && firstEvent ? lastEvent.timestamp - firstEvent.timestamp : 0;

        const detectedIssues: AIDebugReport['summary']['detectedIssues'] = [];

        for (const [issueType, count] of this.issueRegistry.entries()) {
            const relatedEvents = this.events
                .map((e, i) => (e.anomalies.some((a) => a.includes(issueType)) ? i : -1))
                .filter((i) => i !== -1);

            const firstOccurrence = relatedEvents.length > 0 ? this.events[relatedEvents[0]].timestampISO : '';

            let severity: 'critical' | 'warning' | 'info' = 'info';
            let issue = issueType;

            if (issueType === 'state_mismatch') {
                severity = 'critical';
                issue = 'State desynchronization between DOM and React detected';
            } else if (issueType === 'rapid_events') {
                severity = count > 10 ? 'warning' : 'info';
                issue = 'Rapid successive events detected (possible race condition)';
            } else if (issueType === 'large_paste') {
                severity = 'warning';
                issue = 'Large paste operations detected (may trigger sync issues)';
            }

            detectedIssues.push({ firstOccurrence, issue, occurrenceCount: count, relatedEvents, severity });
        }

        detectedIssues.sort((a, b) => {
            const severityOrder = { critical: 0, info: 2, warning: 1 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });

        const suspiciousPatterns: string[] = [];

        const resizeEvents = this.events.filter((e) => e.type === 'autoResize');
        const valueChanges = this.events.filter((e) => e.type === 'onChange');
        if (resizeEvents.length > valueChanges.length * 2) {
            suspiciousPatterns.push(
                `Excessive resize operations (${resizeEvents.length} resizes vs ${valueChanges.length} value changes). ` +
                    `May indicate infinite ResizeObserver loop.`,
            );
        }

        const syncEvents = this.events.filter((e) => e.category === 'sync');
        if (syncEvents.length > this.events.length * 0.3) {
            suspiciousPatterns.push(
                `High frequency of sync operations (${syncEvents.length}/${this.events.length} events). ` +
                    `May indicate layout thrashing.`,
            );
        }

        const recommendations: string[] = [];

        if (detectedIssues.some((i) => i.issue.includes('desynchronization'))) {
            recommendations.push(
                'State desynchronization detected. Check if multiple onChange handlers are bound or ' +
                    'if external code is modifying the textarea DOM directly.',
            );
        }

        if (suspiciousPatterns.some((p) => p.includes('ResizeObserver'))) {
            recommendations.push(
                'Possible infinite ResizeObserver loop. Ensure resize operations are debounced with requestAnimationFrame.',
            );
        }

        if (detectedIssues.some((i) => i.issue.includes('race condition'))) {
            recommendations.push(
                'Rapid events detected. Consider debouncing onChange handlers or checking for double-bound event listeners.',
            );
        }

        const timeline = {
            stateChanges: this.events
                .filter((e) => e.category === 'state')
                .map((e) => ({
                    after: e.data.newValue,
                    before: e.data.previousValue,
                    timestamp: e.timestampISO,
                    type: e.type,
                    unexpected: e.anomalies.length > 0,
                })),

            syncOperations: this.events
                .filter((e) => e.category === 'sync')
                .map((e) => ({
                    details: e.data,
                    operation: e.type,
                    success: !e.anomalies.length,
                    timestamp: e.timestampISO,
                })),
            userActions: this.events
                .filter((e) => e.category === 'user')
                .map((e) => ({
                    action: e.description,
                    resultingStateChanges: this.events.filter(
                        (se) =>
                            se.timestamp > e.timestamp && se.timestamp < e.timestamp + 100 && se.category === 'state',
                    ).length,
                    timestamp: e.timestampISO,
                })),
        };

        return {
            events: this.events,

            finalState: {
                height: textareaHeight,
                highlights,
                inSync: (textareaRef.current?.value ?? '') === (currentValue ?? ''),
                reactValue: currentValue ?? '',
                scrollPosition: {
                    left: textareaRef.current?.scrollLeft ?? 0,
                    top: textareaRef.current?.scrollTop ?? 0,
                },
                textareaValue: textareaRef.current?.value ?? '',
            },
            metadata: {
                browser: navigator.userAgent,
                componentVersion: '1.1.3',
                generatedAt: new Date().toISOString(),
                platform: navigator.platform,
                reactVersion: (React as any).version ?? 'unknown',
                timespan: {
                    durationMs: timespan,
                    end: lastEvent?.timestampISO ?? '',
                    start: firstEvent?.timestampISO ?? '',
                },
                totalEvents: this.events.length,
            },

            summary: {
                description:
                    detectedIssues.length > 0
                        ? `Found ${detectedIssues.length} issue(s) during ${this.events.length} recorded events over ${(timespan / 1000).toFixed(1)}s`
                        : `No issues detected during ${this.events.length} events over ${(timespan / 1000).toFixed(1)}s`,
                detectedIssues,
                recommendations,
                suspiciousPatterns,
            },

            timeline,
        };
    }

    /**
     * Exports telemetry data in AI-optimized format with instructions
     * @param textareaRef Reference to the textarea element
     * @param currentValue Current React state value
     * @param textareaHeight Current textarea height
     * @param highlights Current highlights configuration
     * @param lineHighlights Current line highlights configuration
     * @returns JSON string containing debug report and AI instructions
     */
    exportForAI(
        textareaRef: React.RefObject<HTMLTextAreaElement | null>,
        currentValue: string | undefined,
        textareaHeight: number | undefined,
        highlights: unknown[],
        lineHighlights: Record<number, string>,
    ): string {
        const report = this.generateAIReport(textareaRef, currentValue, textareaHeight, highlights, lineHighlights);

        return JSON.stringify(
            {
                aiInstructions: {
                    commonIssues: {
                        rapidEvents: 'Events firing <5ms apart - possible race condition or double-bound handlers',
                        resizeLoop: 'Excessive resize operations - likely infinite ResizeObserver loop',
                        stateMismatch:
                            'DOM value differs from React state - likely caused by multiple onChange handlers or direct DOM manipulation',
                    },
                    keyFields: {
                        'events[].anomalies': 'Issues detected at each event',
                        'events[].stateSnapshot': 'Full state at each event for comparison',
                        finalState: 'Current state at time of export',
                        'summary.detectedIssues': 'Automatically detected problems, sorted by severity',
                        'timeline.stateChanges': 'Chronological view of all state mutations',
                    },
                    purpose:
                        'This is a debug report from the DyeLight React component. ' +
                        'A textarea with highlighting overlay is experiencing synchronization issues.',
                    yourTask: [
                        '1. Review the summary.detectedIssues for critical problems',
                        '2. Examine timeline.stateChanges for unexpected state transitions',
                        '3. Look for patterns in events where stateSnapshot.valuesMatch is false',
                        '4. Check for rapid events (<5ms apart) that might indicate race conditions',
                        '5. Identify the root cause and suggest specific code fixes',
                    ],
                },
                debugReport: report,
            },
            null,
            2,
        );
    }

    /**
     * Clears all recorded events and issue registry
     */
    clear() {
        this.events = [];
        this.issueRegistry.clear();
        this.lastEventTimestamp = null;
    }
}
