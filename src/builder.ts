/**
 * @fileoverview HighlightBuilder - Utility functions for creating highlight objects
 *
 * This module provides a convenient API for building highlight configurations
 * for the DyeLight component. It includes methods for creating character-level
 * highlights, line-level highlights, pattern-based highlights, and more.
 */

import type React from 'react';

/**
 * Utility functions for building highlight objects for the DyeLight component
 * Provides a fluent API for creating various types of text highlights
 */
export const HighlightBuilder = {
    /**
     * Creates highlights for individual characters using absolute positions
     * @param chars - Array of character highlight configurations
     * @param chars[].index - Zero-based character index in the text
     * @param chars[].className - Optional CSS class name to apply
     * @param chars[].style - Optional inline styles to apply
     * @returns Array of character range highlights
     * @example
     * ```tsx
     * // Highlight characters at positions 5, 10, and 15
     * const highlights = HighlightBuilder.characters([
     *   { index: 5, className: 'highlight-error' },
     *   { index: 10, className: 'highlight-warning' },
     *   { index: 15, style: { backgroundColor: 'yellow' } }
     * ]);
     * ```
     */
    characters: (chars: Array<{ className?: string; index: number; style?: React.CSSProperties }>) => {
        return chars.map(({ className, index, style }) => ({ className, end: index + 1, start: index, style }));
    },

    /**
     * Creates line highlights for entire lines
     * @param lines - Array of line highlight configurations
     * @param lines[].line - Zero-based line number
     * @param lines[].className - Optional CSS class name to apply to the line
     * @param lines[].color - Optional color value (CSS color, hex, rgb, etc.)
     * @returns Object mapping line numbers to highlight values
     * @example
     * ```tsx
     * // Highlight lines 0 and 2 with different styles
     * const lineHighlights = HighlightBuilder.lines([
     *   { line: 0, className: 'error-line' },
     *   { line: 2, color: '#ffff00' }
     * ]);
     * ```
     */
    lines: (lines: Array<{ className?: string; color?: string; line: number }>) => {
        const result: { [lineNumber: number]: string } = {};
        lines.forEach(({ className, color, line }) => {
            result[line] = className || color || '';
        });
        return result;
    },

    /**
     * Highlights text matching a pattern using absolute positions
     * @param text - The text to search within
     * @param pattern - Regular expression or string pattern to match
     * @param className - Optional CSS class name to apply to matches
     * @param style - Optional inline styles to apply to matches
     * @returns Array of character range highlights for all matches
     * @example
     * ```tsx
     * // Highlight all JavaScript keywords
     * const highlights = HighlightBuilder.pattern(
     *   code,
     *   /\b(function|const|let|var|if|else|for|while)\b/g,
     *   'keyword-highlight'
     * );
     *
     * // Highlight all email addresses
     * const emailHighlights = HighlightBuilder.pattern(
     *   text,
     *   /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
     *   'email-highlight'
     * );
     * ```
     */
    pattern: (text: string, pattern: RegExp | string, className?: string, style?: React.CSSProperties) => {
        const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : new RegExp(pattern.source, 'g');
        const matches = Array.from(text.matchAll(regex));

        return matches.map((match) => ({ className, end: match.index! + match[0].length, start: match.index!, style }));
    },

    /**
     * Creates character range highlights using absolute positions
     * @param ranges - Array of character range configurations
     * @param ranges[].start - Zero-based start index (inclusive)
     * @param ranges[].end - Zero-based end index (exclusive)
     * @param ranges[].className - Optional CSS class name to apply
     * @param ranges[].style - Optional inline styles to apply
     * @returns Array of character range highlights
     * @example
     * ```tsx
     * // Highlight specific ranges in the text
     * const highlights = HighlightBuilder.ranges([
     *   { start: 0, end: 5, className: 'title-highlight' },
     *   { start: 10, end: 20, style: { backgroundColor: 'yellow' } },
     *   { start: 25, end: 30, className: 'error-highlight' }
     * ]);
     * ```
     */
    ranges: (ranges: Array<{ className?: string; end: number; start: number; style?: React.CSSProperties }>) => {
        return ranges.map(({ className, end, start, style }) => ({ className, end, start, style }));
    },

    /**
     * Highlights text between specific start and end positions
     * Convenience method for highlighting a single selection range
     * @param start - Zero-based start index (inclusive)
     * @param end - Zero-based end index (exclusive)
     * @param className - Optional CSS class name to apply
     * @param style - Optional inline styles to apply
     * @returns Array containing a single character range highlight
     * @example
     * ```tsx
     * // Highlight a selection from position 10 to 25
     * const selectionHighlight = HighlightBuilder.selection(
     *   10,
     *   25,
     *   'selection-highlight'
     * );
     * ```
     */
    selection: (start: number, end: number, className?: string, style?: React.CSSProperties) => {
        return [{ className, end, start, style }];
    },

    /**
     * Highlights entire words that match specific terms
     * @param text - The text to search within
     * @param words - Array of words to highlight
     * @param className - Optional CSS class name to apply to matched words
     * @param style - Optional inline styles to apply to matched words
     * @returns Array of character range highlights for all matched words
     * @example
     * ```tsx
     * // Highlight specific programming keywords
     * const highlights = HighlightBuilder.words(
     *   sourceCode,
     *   ['function', 'const', 'let', 'var', 'return'],
     *   'keyword'
     * );
     *
     * // Highlight important terms with custom styling
     * const termHighlights = HighlightBuilder.words(
     *   document,
     *   ['TODO', 'FIXME', 'NOTE'],
     *   undefined,
     *   { backgroundColor: 'orange', fontWeight: 'bold' }
     * );
     * ```
     */
    words: (text: string, words: string[], className?: string, style?: React.CSSProperties) => {
        const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'g');
        return HighlightBuilder.pattern(text, pattern, className, style);
    },
};
