/**
 * @fileoverview Type definitions for the DyeLight component
 *
 * This module contains all TypeScript type definitions used by the DyeLight
 * component, including props interfaces, ref methods, and highlight configurations.
 * These types provide comprehensive type safety and IntelliSense support.
 */

import React from 'react';

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
 *     />
 *   );
 * };
 * ```
 */
export interface DyeLightProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    /** CSS class name for the textarea element */
    className?: string;
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
}

/**
 * Methods exposed by the DyeLight component through its ref
 * Provides programmatic access to common textarea operations
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
 *   return <DyeLight ref={dyeLightRef} />;
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
};
