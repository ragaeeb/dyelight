import { useCallback, useRef } from 'react';

/**
 * Hook for managing highlight layer synchronization
 */
export const useHighlightSync = () => {
    const highlightLayerRef = useRef<HTMLDivElement>(null);

    /**
     * Synchronizes scroll position between textarea and highlight layer
     */
    const syncScroll = useCallback((textareaRef: React.RefObject<HTMLTextAreaElement | null>) => {
        if (textareaRef.current && highlightLayerRef.current) {
            const { scrollLeft, scrollTop } = textareaRef.current;
            highlightLayerRef.current.scrollTop = scrollTop;
            highlightLayerRef.current.scrollLeft = scrollLeft;
        }
    }, []);

    /**
     * Synchronizes computed styles from textarea to highlight layer
     */
    const syncStyles = useCallback((textareaRef: React.RefObject<HTMLTextAreaElement | null>) => {
        if (!textareaRef.current || !highlightLayerRef.current) return;

        const computedStyle = getComputedStyle(textareaRef.current);
        const highlightLayer = highlightLayerRef.current;

        highlightLayer.style.padding = computedStyle.padding;
        highlightLayer.style.fontSize = computedStyle.fontSize;
        highlightLayer.style.fontFamily = computedStyle.fontFamily;
        highlightLayer.style.lineHeight = computedStyle.lineHeight;
        highlightLayer.style.letterSpacing = computedStyle.letterSpacing;
        highlightLayer.style.wordSpacing = computedStyle.wordSpacing;
        highlightLayer.style.textIndent = computedStyle.textIndent;
    }, []);

    return {
        highlightLayerRef,
        syncScroll,
        syncStyles,
    };
};
