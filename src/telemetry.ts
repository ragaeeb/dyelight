import type { AIDebugReport, AITelemetryEvent } from './types';

/**
 * Detects issues from the issue registry and creates structured issue records
 */
function detectIssues(
    issueRegistry: Map<string, number>,
    events: AITelemetryEvent[],
): AIDebugReport['summary']['detectedIssues'] {
    const detectedIssues: AIDebugReport['summary']['detectedIssues'] = [];
    for (const [issueType, count] of issueRegistry.entries()) {
        const issueIndicators: Record<string, string> = {
            large_paste: 'Large paste detected',
            rapid_events: 'Rapid event',
            state_mismatch: 'State mismatch',
        };
        const indicator = issueIndicators[issueType] ?? issueType;
        const relatedEvents = events
            .map((e, i) => (e.anomalies.some((a) => a.includes(indicator)) ? i : -1))
            .filter((i) => i !== -1);
        const firstOccurrence = relatedEvents.length > 0 ? events[relatedEvents[0]].timestampISO : '';
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
    return detectedIssues;
}

/**
 * Detects suspicious patterns in the event sequence
 */
function detectSuspiciousPatterns(events: AITelemetryEvent[]): string[] {
    const suspiciousPatterns: string[] = [];

    const resizeEvents = events.filter((e) => e.type === 'autoResize');
    const valueChanges = events.filter((e) => e.type === 'onChange');
    if (resizeEvents.length > valueChanges.length * 2) {
        suspiciousPatterns.push(
            `Excessive resize operations (${resizeEvents.length} resizes vs ${valueChanges.length} value changes). ` +
                `May indicate infinite ResizeObserver loop.`,
        );
    }

    const syncEvents = events.filter((e) => e.category === 'sync');
    if (syncEvents.length > events.length * 0.3) {
        suspiciousPatterns.push(
            `High frequency of sync operations (${syncEvents.length}/${events.length} events). ` +
                `May indicate layout thrashing.`,
        );
    }

    return suspiciousPatterns;
}

/**
 * Generates recommendations based on detected issues and patterns
 */
function generateRecommendations(
    detectedIssues: AIDebugReport['summary']['detectedIssues'],
    suspiciousPatterns: string[],
): string[] {
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

    if (detectedIssues.some((i) => i.issue.includes('Large paste'))) {
        recommendations.push(
            'Large paste operations detected. Ensure e.preventDefault() is called BEFORE reading clipboard data ' +
                'in your onPaste handler to prevent the browser from inserting raw content into the DOM.',
        );
    }

    return recommendations;
}

/**
 * Builds the timeline view from events
 */
function buildTimeline(events: AITelemetryEvent[]): AIDebugReport['timeline'] {
    return {
        stateChanges: events
            .filter((e) => e.category === 'state')
            .map((e) => ({
                after: e.data.newValue,
                before: e.data.previousValue,
                timestamp: e.timestampISO,
                type: e.type,
                unexpected: e.anomalies.length > 0,
            })),

        syncOperations: events
            .filter((e) => e.category === 'sync')
            .map((e) => ({
                details: e.data,
                operation: e.type,
                success: !e.anomalies.length,
                timestamp: e.timestampISO,
            })),

        userActions: events
            .filter((e) => e.category === 'user')
            .map((e) => ({
                action: e.description,
                resultingStateChanges: events.filter(
                    (se) => se.timestamp > e.timestamp && se.timestamp < e.timestamp + 100 && se.category === 'state',
                ).length,
                timestamp: e.timestampISO,
            })),
    };
}

/**
 * Registry for deduplicating large text values
 * Stores values >1000 chars once and returns a reference key
 */
class ValueRegistry {
    private registry = new Map<string, string>();
    private reverseRegistry = new Map<string, string>();
    private nextId = 0;
    private readonly threshold = 1000; // Only deduplicate values >1KB

    /**
     * Stores a value and returns either the value itself (if small) or a reference
     */
    store(value: string): string {
        // Don't deduplicate small values
        if (value.length <= this.threshold) {
            return value;
        }

        // Check if we've already stored this exact value
        if (this.reverseRegistry.has(value)) {
            return this.reverseRegistry.get(value)!;
        }

        // Store new value
        const ref = `<REF:value_${this.nextId}>`;
        this.registry.set(ref, value);
        this.reverseRegistry.set(value, ref);
        this.nextId++;

        return ref;
    }

    /**
     * Gets the actual registry for export
     */
    getRegistry(): { [key: string]: string } {
        return Object.fromEntries(this.registry);
    }

    /**
     * Clears the registry
     */
    clear() {
        this.registry.clear();
        this.reverseRegistry.clear();
        this.nextId = 0;
    }
}

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
    private valueRegistry = new ValueRegistry();

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

        // Skip mismatch detection during onChange: the browser updates the DOM before
        // React state, so a transient mismatch is expected for controlled components.
        const isOnChangeEvent = category === 'user' && type === 'onChange';
        if (!valuesMatch && !isOnChangeEvent) {
            anomalies.push(
                `State mismatch: DOM="${textareaValue.slice(0, 50)}..." vs React="${reactValue.slice(0, 50)}..."`,
            );
            this.issueRegistry.set('state_mismatch', (this.issueRegistry.get('state_mismatch') ?? 0) + 1);
        }

        if (timeSinceLastEvent !== null && timeSinceLastEvent < 2) {
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

        // Deduplicate large values using the registry
        const deduplicatedTextareaValue = this.valueRegistry.store(textareaValue);
        const deduplicatedReactValue = this.valueRegistry.store(reactValue);

        const event: AITelemetryEvent = {
            anomalies,
            category,
            data,
            description: this.generateDescription(type, category, data),
            stateSnapshot: {
                isControlled,
                reactValue: deduplicatedReactValue,
                textareaHeight,
                textareaValue: deduplicatedTextareaValue,
                valuesMatch,
            },
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
     * @returns Complete debug report
     */
    generateAIReport(
        textareaRef: React.RefObject<HTMLTextAreaElement | null>,
        currentValue: string | undefined,
        textareaHeight: number | undefined,
        highlights: unknown[],
    ): AIDebugReport {
        const firstEvent = this.events[0];
        const lastEvent = this.events[this.events.length - 1];
        const timespan = lastEvent && firstEvent ? lastEvent.timestamp - firstEvent.timestamp : 0;

        const detectedIssues = detectIssues(this.issueRegistry, this.events);
        const suspiciousPatterns = detectSuspiciousPatterns(this.events);
        const recommendations = generateRecommendations(detectedIssues, suspiciousPatterns);
        const timeline = buildTimeline(this.events);

        // Deduplicate final state values
        const finalTextareaValue = this.valueRegistry.store(textareaRef.current?.value ?? '');
        const finalReactValue = this.valueRegistry.store(currentValue ?? '');

        return {
            events: this.events,

            finalState: {
                height: textareaHeight,
                highlights,
                inSync: (textareaRef.current?.value ?? '') === (currentValue ?? ''),
                reactValue: finalReactValue,
                scrollPosition: {
                    left: textareaRef.current?.scrollLeft ?? 0,
                    top: textareaRef.current?.scrollTop ?? 0,
                },
                textareaValue: finalTextareaValue,
            },

            metadata: {
                browser: navigator.userAgent,
                componentVersion: '1.1.3',
                generatedAt: new Date().toISOString(),
                platform: navigator.platform,
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

            valueRegistry: this.valueRegistry.getRegistry(),
        };
    }

    /**
     * Exports telemetry data in AI-optimized format with instructions
     * @param textareaRef Reference to the textarea element
     * @param currentValue Current React state value
     * @param textareaHeight Current textarea height
     * @param highlights Current highlights configuration
     * @returns JSON string containing debug report and AI instructions
     */
    exportForAI(
        textareaRef: React.RefObject<HTMLTextAreaElement | null>,
        currentValue: string | undefined,
        textareaHeight: number | undefined,
        highlights: unknown[],
    ): string {
        const report = this.generateAIReport(textareaRef, currentValue, textareaHeight, highlights);

        return JSON.stringify(
            {
                aiInstructions: {
                    commonIssues: {
                        largePaste:
                            'Large paste operations where e.preventDefault() is called AFTER clipboard data is read - ' +
                            'browser inserts raw text into DOM before React state updates',
                        rapidEvents: 'Events firing <2ms apart - possible race condition or double-bound handlers',
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
                        valueRegistry: 'Deduplicated text values - references like <REF:value_0> point to entries here',
                    },
                    purpose:
                        'This is a debug report from the DyeLight React component. ' +
                        'A textarea with highlighting overlay is experiencing synchronization issues.',
                    valueDeduplication:
                        'IMPORTANT: Text values longer than 1000 characters are stored in valueRegistry and referenced as <REF:value_N>. ' +
                        'When you see <REF:value_0> in stateSnapshot.textareaValue, look up the actual value in debugReport.valueRegistry["<REF:value_0>"]. ' +
                        'This optimization prevents the JSON from becoming huge when users paste large blocks of text. ' +
                        'Example: If textareaValue is "<REF:value_0>" and valueRegistry is {"<REF:value_0>": "...40KB of text..."}, ' +
                        'then the actual textarea value is that 40KB text.',
                    yourTask: [
                        '1. Review the summary.detectedIssues for critical problems',
                        '2. Examine timeline.stateChanges for unexpected state transitions',
                        '3. Look for patterns in events where stateSnapshot.valuesMatch is false',
                        '4. Check for rapid events (<2ms apart) that might indicate race conditions',
                        '5. If you see <REF:value_N> references, look them up in valueRegistry',
                        '6. Identify the root cause and suggest specific code fixes',
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
        this.valueRegistry.clear();
    }
}
