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

    it('compensates for scrollbar in LTR mode', () => {
        const highlight = { style: {} as Record<string, string> } as unknown as HTMLDivElement;
        const textarea = {
            clientWidth: 100,
            offsetWidth: 120, // 20px scrollbar (assuming 0 borders for simplicity)
        } as unknown as HTMLTextAreaElement;

        const styleSnapshot: Record<string, string> = {
            borderLeftWidth: '0px',
            borderRightWidth: '0px',
            direction: 'ltr',
            paddingRight: '10px',
        };

        syncHighlightStyles(textarea, highlight, () => styleSnapshot as unknown as CSSStyleDeclaration);

        // Scrollbar = 120 - 100 - 0 - 0 = 20
        // PaddingRight = 10 + 20 = 30
        expect(highlight.style.paddingRight).toBe('30px');
    });

    it('compensates for scrollbar in RTL mode', () => {
        const highlight = { style: {} as Record<string, string> } as unknown as HTMLDivElement;
        const textarea = {
            clientWidth: 100,
            offsetWidth: 120, // 20px scrollbar
        } as unknown as HTMLTextAreaElement;

        const styleSnapshot: Record<string, string> = {
            borderLeftWidth: '0px',
            borderRightWidth: '0px',
            direction: 'rtl',
            paddingLeft: '10px',
            paddingRight: '10px',
        };

        syncHighlightStyles(textarea, highlight, () => styleSnapshot as unknown as CSSStyleDeclaration);

        // Scrollbar = 20
        // RTL -> adjust paddingLeft
        // PaddingLeft = 10 + 20 = 30
        expect(highlight.style.paddingLeft).toBe('30px');
        // PaddingRight should remain untouched (or synced from snapshot, which is 10px)
        // Note: The function copies *all* properties first, then overrides one.
        // But our mock highlight.style is empty initially.
        // The implementation does: highlightLayer.style.paddingLeft = ...
        // It relies on generic copy loop first?
        // Wait, syncHighlightStyles loop copies ALL properties from computedStyle to highlight.style.
        // Then overrides.
        // In our test, valid 'styleSnapshot' should likely contain all synced props to be realistic,
        // but for this specific expectation, checking the override is enough.
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
