import { useCallback, useRef } from 'react';

export const syncScrollPositions = (
    textarea: Pick<HTMLTextAreaElement, 'scrollLeft' | 'scrollTop'> | null,
    highlightLayer: Pick<HTMLDivElement, 'scrollLeft' | 'scrollTop'> | null,
) => {
    if (!textarea || !highlightLayer) {
        return;
    }

    const { scrollLeft, scrollTop } = textarea;
    highlightLayer.scrollTop = scrollTop;
    highlightLayer.scrollLeft = scrollLeft;
};

export const syncHighlightStyles = (
    textarea: HTMLTextAreaElement | null,
    highlightLayer: HTMLDivElement | null,
    computeStyle: (element: Element) => CSSStyleDeclaration = getComputedStyle,
) => {
    if (!textarea || !highlightLayer) {
        return;
    }

    const computedStyle = computeStyle(textarea);

    highlightLayer.style.padding = computedStyle.padding;
    highlightLayer.style.fontSize = computedStyle.fontSize;
    highlightLayer.style.fontFamily = computedStyle.fontFamily;
    highlightLayer.style.lineHeight = computedStyle.lineHeight;
    highlightLayer.style.letterSpacing = computedStyle.letterSpacing;
    highlightLayer.style.wordSpacing = computedStyle.wordSpacing;
    highlightLayer.style.textIndent = computedStyle.textIndent;

    // Sync wrapping strategies to ensure identical layout
    highlightLayer.style.whiteSpace = computedStyle.whiteSpace;
    highlightLayer.style.wordBreak = computedStyle.wordBreak;
    highlightLayer.style.overflowWrap = computedStyle.overflowWrap;
    highlightLayer.style.tabSize = computedStyle.tabSize;

    // Sync border width and style to ensure box-model matches, but keep transparent
    highlightLayer.style.borderTopWidth = computedStyle.borderTopWidth;
    highlightLayer.style.borderRightWidth = computedStyle.borderRightWidth;
    highlightLayer.style.borderBottomWidth = computedStyle.borderBottomWidth;
    highlightLayer.style.borderLeftWidth = computedStyle.borderLeftWidth;
    highlightLayer.style.borderTopStyle = computedStyle.borderTopStyle;
    highlightLayer.style.borderRightStyle = computedStyle.borderRightStyle;
    highlightLayer.style.borderBottomStyle = computedStyle.borderBottomStyle;
    highlightLayer.style.borderLeftStyle = computedStyle.borderLeftStyle;
    highlightLayer.style.borderColor = 'transparent';

    // Calculate scrollbar width to ensure content width is identical
    // offsetWidth includes borders, padding, and scrollbar
    // clientWidth includes padding but excludes borders and scrollbar
    // scrollbarWidth = offsetWidth - clientWidth - (borderLeft + borderRight)
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
    const scrollbarWidth = textarea.offsetWidth - textarea.clientWidth - borderLeft - borderRight;

    if (scrollbarWidth > 0) {
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        highlightLayer.style.paddingRight = `${paddingRight + scrollbarWidth}px`;
    } else {
        highlightLayer.style.paddingRight = computedStyle.paddingRight;
    }
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

    return { highlightLayerRef, syncScroll, syncStyles };
};
