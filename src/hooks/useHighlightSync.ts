import { useCallback, useRef } from 'react';

export const syncScrollPositions = (
    textarea: Pick<HTMLTextAreaElement, 'scrollLeft' | 'scrollTop'> | null,
    highlightLayer: Pick<HTMLDivElement, 'scrollLeft' | 'scrollTop'> | null,
) => {
    if (!textarea || !highlightLayer) return;

    const { scrollLeft, scrollTop } = textarea;
    highlightLayer.scrollTop = scrollTop;
    highlightLayer.scrollLeft = scrollLeft;
};

export const syncHighlightStyles = (
    textarea: HTMLTextAreaElement | null,
    highlightLayer: HTMLDivElement | null,
    computeStyle: (element: Element) => CSSStyleDeclaration = getComputedStyle,
) => {
    if (!textarea || !highlightLayer) return;

    const computedStyle = computeStyle(textarea);

    highlightLayer.style.padding = computedStyle.padding;
    highlightLayer.style.fontSize = computedStyle.fontSize;
    highlightLayer.style.fontFamily = computedStyle.fontFamily;
    highlightLayer.style.lineHeight = computedStyle.lineHeight;
    highlightLayer.style.letterSpacing = computedStyle.letterSpacing;
    highlightLayer.style.wordSpacing = computedStyle.wordSpacing;
    highlightLayer.style.textIndent = computedStyle.textIndent;
};

/**
 * Hook for managing highlight layer synchronization
 */
export const useHighlightSync = () => {
    const highlightLayerRef = useRef<HTMLDivElement>(null);

    const syncScroll = useCallback((textareaRef: React.RefObject<HTMLTextAreaElement | null>) => {
        syncScrollPositions(textareaRef.current, highlightLayerRef.current);
    }, []);

    const syncStyles = useCallback((textareaRef: React.RefObject<HTMLTextAreaElement | null>) => {
        syncHighlightStyles(textareaRef.current, highlightLayerRef.current);
    }, []);

    return {
        highlightLayerRef,
        syncScroll,
        syncStyles,
    };
};
