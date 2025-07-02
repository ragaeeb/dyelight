/**
 * @fileoverview Text utility functions for position calculations and text processing
 *
 * This module provides utilities for converting between absolute text positions
 * and line-relative positions, as well as other text processing functions used
 * by the DyeLight component for highlight positioning.
 */

/**
 * Analyzes text content and returns line information with position mappings
 * @param text - The text content to analyze
 * @returns Object containing lines array and line start positions
 * @returns returns.lines - Array of individual lines (without newline characters)
 * @returns returns.lineStarts - Array of absolute positions where each line starts
 * @example
 * ```ts
 * const text = "Hello\nWorld\nTest";
 * const { lines, lineStarts } = getLinePositions(text);
 * // lines: ["Hello", "World", "Test"]
 * // lineStarts: [0, 6, 12]
 * ```
 */
export const getLinePositions = (text: string) => {
    const lines = text.split('\n');
    const lineStarts: number[] = [];
    let position = 0;

    lines.forEach((line, index) => {
        lineStarts.push(position);
        position += line.length + (index < lines.length - 1 ? 1 : 0); // +1 for \n except last line
    });

    return { lines, lineStarts };
};

/**
 * Converts an absolute text position to line-relative coordinates
 * @param absolutePos - Zero-based absolute position in the entire text
 * @param lineStarts - Array of line start positions (from getLinePositions)
 * @returns Object containing line number and character position within that line
 * @returns returns.line - Zero-based line number
 * @returns returns.char - Zero-based character position within the line
 * @example
 * ```ts
 * const text = "Hello\nWorld\nTest";
 * const { lineStarts } = getLinePositions(text);
 * const pos = absoluteToLinePos(8, lineStarts);
 * // pos: { line: 1, char: 2 } (the 'r' in "World")
 * ```
 */
export const absoluteToLinePos = (absolutePos: number, lineStarts: number[]) => {
    for (let i = lineStarts.length - 1; i >= 0; i--) {
        if (absolutePos >= lineStarts[i]) {
            return {
                char: absolutePos - lineStarts[i],
                line: i,
            };
        }
    }
    return { char: 0, line: 0 };
};

/**
 * Determines if a string value represents a CSS color value
 * @param value - The string value to test
 * @returns True if the value appears to be a color value, false otherwise
 * @example
 * ```ts
 * isColorValue('#ff0000'); // true
 * isColorValue('rgb(255, 0, 0)'); // true
 * isColorValue('red'); // true
 * isColorValue('my-css-class'); // false (contains hyphens)
 * isColorValue('transparent'); // true
 * isColorValue('var(--primary-color)'); // true
 * ```
 */
export const isColorValue = (value: string): boolean => {
    return (
        /^(#|rgb|hsl|var\(--.*?\)|transparent|currentColor|inherit|initial|unset)/i.test(value) ||
        /^[a-z]+$/i.test(value)
    );
};
