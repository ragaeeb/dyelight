/**
 * Utility functions for building highlight objects
 */
export const HighlightBuilder = {
    /**
     * Creates highlights for individual characters using absolute positions
     */
    characters: (chars: Array<{ className?: string; index: number; style?: React.CSSProperties }>) => {
        return chars.map(({ className, index, style }) => ({
            className,
            end: index + 1,
            start: index,
            style,
        }));
    },

    /**
     * Creates line highlights
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
     */
    pattern: (text: string, pattern: RegExp | string, className?: string, style?: React.CSSProperties) => {
        const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : new RegExp(pattern.source, 'g');
        const matches = Array.from(text.matchAll(regex));

        return matches.map((match) => ({
            className,
            end: match.index! + match[0].length,
            start: match.index!,
            style,
        }));
    },

    /**
     * Creates character range highlights using absolute positions
     */
    ranges: (ranges: Array<{ className?: string; end: number; start: number; style?: React.CSSProperties }>) => {
        return ranges.map(({ className, end, start, style }) => ({
            className,
            end,
            start,
            style,
        }));
    },

    /**
     * Highlights text between specific start and end positions
     */
    selection: (start: number, end: number, className?: string, style?: React.CSSProperties) => {
        return [{ className, end, start, style }];
    },

    /**
     * Highlights entire words that match a pattern
     */
    words: (text: string, words: string[], className?: string, style?: React.CSSProperties) => {
        const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'g');
        return HighlightBuilder.pattern(text, pattern, className, style);
    },
};
