/**
 * @fileoverview Type definitions for the DyeLight component
 *
 * This module contains all TypeScript type definitions used by the DyeLight
 * component, including props interfaces, ref methods, and highlight configurations.
 * These types provide comprehensive type safety and IntelliSense support.
 */

import type React from 'react';

/**
 * Represents a character range to highlight in the entire text using absolute positions
 * @example
 * ```tsx
 * const highlight: CharacterRange = {
 *   start: 0,
 *   end: 5,
 *   className: 'highlight-keyword',
 *   style: { backgroundColor: 'yellow', fontWeight: 'bold' }
 * };
 * ```
 */
export type CharacterRange = {
    /** Optional CSS class name to apply to the highlighted range */
    className?: string;
    /** Zero-based end index in the entire text (exclusive) */
    end: number;
    /** Zero-based start index in the entire text (inclusive) */
    start: number;
    /** Optional inline styles to apply to the highlighted range */
    style?: React.CSSProperties;
};

/**
 * Props for the DyeLight component
 * Extends standard textarea props while replacing onChange with a simplified version
 * @example
 * ```tsx
 * const MyEditor = () => {
 *   const [code, setCode] = useState('const x = 1;');
 *
 *   const highlights = HighlightBuilder.pattern(
 *     code,
 *     /\b(const|let|var)\b/g,
 *     'keyword-highlight'
 *   );
 *
 *   const lineHighlights = HighlightBuilder.lines([
 *     { line: 0, className: 'current-line' }
 *   ]);
 *
 *   return (
 *     <DyeLight
 *       value={code}
 *       onChange={setCode}
 *       highlights={highlights}
 *       lineHighlights={lineHighlights}
 *       enableAutoResize={true}
 *       rows={10}
 *       className="my-editor"
 *       placeholder="Enter your code here..."
 *       debug={true}
 *     />
 *   );
 * };
 * ```
 */
export interface DyeLightProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    /** CSS class name for the textarea element */
    className?: string;
    /** CSS class name for the container wrapper element */
    containerClassName?: string;
    /** Default value for uncontrolled usage */
    defaultValue?: string;
    /** Text direction - supports left-to-right and right-to-left */
    dir?: 'ltr' | 'rtl';
    /** Enable automatic height adjustment based on content */
    enableAutoResize?: boolean;
    /** Character range highlights using absolute positions in the entire text */
    highlights?: CharacterRange[];
    /** Line-level highlights mapped by line number (0-based) to CSS color/class */
    lineHighlights?: { [lineNumber: number]: string };
    /** Callback fired when the textarea value changes */
    onChange?: (value: string) => void;
    /** Number of visible text lines */
    rows?: number;
    /** Controlled value */
    value?: string;

    /** Enable debug mode to collect telemetry data */
    debug?: boolean;
    /** Maximum number of telemetry events to retain in memory */
    debugMaxEvents?: number;
}

/**
 * Methods exposed by the DyeLight component through its ref
 * Provides programmatic access to common textarea operations and debug features
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const dyeLightRef = useRef<DyeLightRef>(null);
 *
 *   const handleFocus = () => {
 *     dyeLightRef.current?.focus();
 *   };
 *
 *   const handleGetValue = () => {
 *     const value = dyeLightRef.current?.getValue();
 *     console.log('Current value:', value);
 *   };
 *
 *   const handleExportDebug = async () => {
 *     const report = dyeLightRef.current?.exportForAI();
 *     if (report) {
 *       await navigator.clipboard.writeText(report);
 *       alert('Debug report copied to clipboard');
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <DyeLight ref={dyeLightRef} debug={true} />
 *       <button onClick={handleExportDebug}>Export Debug Report</button>
 *     </>
 *   );
 * };
 * ```
 */
export type DyeLightRef = {
    /** Removes focus from the textarea */
    blur: () => void;
    /** Sets focus to the textarea */
    focus: () => void;
    /** Gets the current value of the textarea */
    getValue: () => string;
    /** Selects all text in the textarea */
    select: () => void;
    /** Sets the selection range in the textarea */
    setSelectionRange: (start: number, end: number) => void;
    /** Sets the value of the textarea programmatically */
    setValue: (value: string) => void;
    /** Scrolls the character position into view with an optional pixel offset */
    scrollToPosition: (pos: number, offset?: number, behavior?: ScrollBehavior) => void;

    /**
     * Exports AI-optimized debug report as JSON string (requires debug mode)
     * The report includes value deduplication - large text values are stored once
     * in a valueRegistry and referenced as <REF:value_N> to reduce JSON size
     */
    exportForAI: () => string;
};

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
        /** Actual value in the textarea DOM element (may be <REF:value_N> if deduplicated) */
        textareaValue: string;
        /** Value in React state (may be <REF:value_N> if deduplicated) */
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
            /** Previous value (may be <REF:value_N>) */
            before: unknown;
            /** New value (may be <REF:value_N>) */
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
        /** Current textarea DOM value (may be <REF:value_N>) */
        textareaValue: string;
        /** Current React state value (may be <REF:value_N>) */
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

    /**
     * Value registry for deduplicated text values
     * Large text values (>1000 chars) are stored here once and referenced as <REF:value_N>
     * This dramatically reduces JSON size when the same large text appears in many events
     */
    valueRegistry: { [key: string]: string };
};
