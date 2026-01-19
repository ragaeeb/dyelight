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
            borderBottomStyle: 'solid',
            borderBottomWidth: '1px',
            borderLeftStyle: 'solid',
            borderLeftWidth: '1px',
            borderRightStyle: 'solid',
            borderRightWidth: '1px',
            borderTopStyle: 'solid',
            borderTopWidth: '1px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            letterSpacing: '0.5px',
            lineHeight: '1.6',
            overflowWrap: 'break-word',
            padding: '12px',
            tabSize: '4',
            textIndent: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            wordSpacing: '1px',
        };

        syncHighlightStyles(
            {} as HTMLTextAreaElement,
            highlight,
            () => styleSnapshot as unknown as CSSStyleDeclaration,
        );

        // The function forces borderColor to transparent, so we expect that override
        const expectedStyles = { ...styleSnapshot, borderColor: 'transparent' };

        expect(highlight.style).toEqual(expectedStyles);
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
