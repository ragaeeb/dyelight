import { describe, expect, it, mock } from 'bun:test';

await mock.restore();
await mock.module('react', () => ({
    useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    useRef: <T,>(value: T) => ({ current: value }),
}));

const { syncScrollPositions, syncHighlightStyles, useHighlightSync } = await import('./useHighlightSync');

describe('syncScrollPositions', () => {
    it('aligns scroll offsets', () => {
        const textarea = { scrollLeft: 12, scrollTop: 45 } as unknown as HTMLTextAreaElement;
        const highlight = { scrollLeft: 0, scrollTop: 0 } as unknown as HTMLDivElement;

        syncScrollPositions(textarea, highlight);

        expect(highlight.scrollTop).toBe(45);
        expect(highlight.scrollLeft).toBe(12);
    });

    it('does nothing when refs are missing', () => {
        const highlight = { scrollLeft: 0, scrollTop: 0 } as unknown as HTMLDivElement;
        syncScrollPositions(null, highlight);
        expect(highlight.scrollTop).toBe(0);
        expect(highlight.scrollLeft).toBe(0);
    });
});

describe('syncHighlightStyles', () => {
    it('copies styles from textarea', () => {
        const highlight = { style: {} as Record<string, string> } as unknown as HTMLDivElement;
        const styleSnapshot: Record<string, string> = {
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            letterSpacing: '0.5px',
            lineHeight: '1.6',
            padding: '12px',
            textIndent: '4px',
            wordSpacing: '1px',
        };

        syncHighlightStyles(
            {} as HTMLTextAreaElement,
            highlight,
            () => styleSnapshot as unknown as CSSStyleDeclaration,
        );

        expect(highlight.style).toEqual(styleSnapshot);
    });
});

describe('useHighlightSync', () => {
    it('provides ref and callbacks', () => {
        const { highlightLayerRef, syncScroll, syncStyles } = useHighlightSync();
        expect(highlightLayerRef.current).toBeNull();
        expect(typeof syncScroll).toBe('function');
        expect(typeof syncStyles).toBe('function');
    });
});
