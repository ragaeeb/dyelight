import { describe, expect, it, mock } from 'bun:test';
import type { CharacterRange } from '@/types';

await mock.restore();
await mock.module('react', () => ({
    useMemo: <T,>(factory: () => T) => factory(),
}));

const { computeHighlightedContent, useHighlightedContent } = await import('./useHighlightedContent');

describe('computeHighlightedContent', () => {
    const renderLine = (
        line: string,
        lineIndex: number,
        ranges: Array<{ className?: string; end: number; start: number; style?: React.CSSProperties }>,
        lineHighlight?: string,
    ) => ({ line, lineIndex, lineHighlight, ranges });

    it('groups highlights by line and provides range metadata', () => {
        const text = 'Hello world\nSecond line';
        const highlights: CharacterRange[] = [
            { start: 0, end: 5, className: 'primary' },
            { start: 12, end: 18, className: 'secondary' },
        ];
        const lineHighlights = { 1: 'line-accent' } satisfies Record<number, string>;

        const result = computeHighlightedContent(text, highlights, lineHighlights, renderLine);

        expect(result.length).toBe(2);
        expect(result[0]?.ranges[0]?.start).toBe(0);
        expect(result[0]?.ranges[0]?.end).toBe(5);
        expect(result[1]?.ranges[0]?.start).toBe(0);
        expect(result[1]?.ranges[0]?.end).toBe(6);
        expect(result[1]?.lineHighlight).toBe('line-accent');
    });

    it('returns empty ranges for lines without highlights', () => {
        const text = '\nEmpty first line';
        const highlights: CharacterRange[] = [];
        const lineHighlights = {} as Record<number, string>;

        const result = computeHighlightedContent(text, highlights, lineHighlights, renderLine);
        expect(result[0]?.ranges.length).toBe(0);
    });
});

describe('useHighlightedContent', () => {
    it('returns rendered highlighted lines', () => {
        const highlights: CharacterRange[] = [{ start: 0, end: 4, className: 'tag' }];
        const lineHighlights = {} as Record<number, string>;
        const renderLine = (
            line: string,
            lineIndex: number,
            ranges: Array<{ className?: string; end: number; start: number; style?: React.CSSProperties }>,
        ) => ({ line, lineIndex, ranges });

        const result = useHighlightedContent('test', highlights, lineHighlights, renderLine);
        expect(result[0]?.ranges[0]?.className).toBe('tag');
    });
});
