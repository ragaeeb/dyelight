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

    /** Exports AI-optimized debug report as JSON string (requires debug mode) */
    exportForAI: () => string;
};
