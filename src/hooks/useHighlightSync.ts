/**
 * @fileoverview Hook for managing highlight layer synchronization
 */

import { useCallback, useRef } from 'react';
import type { AIOptimizedTelemetry } from '../telemetry';

/**
 * Synchronizes scroll positions between textarea and highlight layer
 * @param textarea The textarea element
 * @param highlightLayer The highlight overlay element
 */
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

/**
 * Synchronizes styles between textarea and highlight layer for pixel-perfect alignment
 * @param textarea The textarea element
 * @param highlightLayer The highlight overlay element
 * @param computeStyle Function to compute styles (defaults to getComputedStyle)
 */
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
    highlightLayer.style.fontKerning = computedStyle.fontKerning;
    highlightLayer.style.fontFeatureSettings = computedStyle.fontFeatureSettings;
    highlightLayer.style.fontVariantLigatures = computedStyle.fontVariantLigatures;
    highlightLayer.style.lineHeight = computedStyle.lineHeight;
    highlightLayer.style.letterSpacing = computedStyle.letterSpacing;
    highlightLayer.style.wordSpacing = computedStyle.wordSpacing;
    highlightLayer.style.textIndent = computedStyle.textIndent;
    highlightLayer.style.textAlign = computedStyle.textAlign;
    highlightLayer.style.writingMode = computedStyle.writingMode;
    highlightLayer.style.unicodeBidi = computedStyle.unicodeBidi;

    highlightLayer.style.direction = computedStyle.direction;
    highlightLayer.style.whiteSpace = computedStyle.whiteSpace;
    highlightLayer.style.wordBreak = computedStyle.wordBreak;
    highlightLayer.style.overflowWrap = computedStyle.overflowWrap;
    highlightLayer.style.tabSize = computedStyle.tabSize;

    highlightLayer.style.borderTopWidth = computedStyle.borderTopWidth;
    highlightLayer.style.borderRightWidth = computedStyle.borderRightWidth;
    highlightLayer.style.borderBottomWidth = computedStyle.borderBottomWidth;
    highlightLayer.style.borderLeftWidth = computedStyle.borderLeftWidth;
    highlightLayer.style.borderTopStyle = computedStyle.borderTopStyle;
    highlightLayer.style.borderRightStyle = computedStyle.borderRightStyle;
    highlightLayer.style.borderBottomStyle = computedStyle.borderBottomStyle;
    highlightLayer.style.borderLeftStyle = computedStyle.borderLeftStyle;
    highlightLayer.style.borderColor = 'transparent';

    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
    const scrollbarWidth = textarea.offsetWidth - textarea.clientWidth - borderLeft - borderRight;

    if (scrollbarWidth > 0) {
        const isRTL = computedStyle.direction === 'rtl';
        if (isRTL) {
            const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
            highlightLayer.style.paddingLeft = `${paddingLeft + scrollbarWidth}px`;
        } else {
            const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
            highlightLayer.style.paddingRight = `${paddingRight + scrollbarWidth}px`;
        }
    }
};

/**
 * Hook for managing highlight layer synchronization
 * Provides functions to sync scroll and styles between textarea and overlay
 *
 * @param telemetry Optional telemetry collector for debugging
 * @param textareaRef Optional textarea reference for telemetry
 * @param getCurrentValue Optional function to get current value for telemetry
 * @param getHeight Optional function to get current height for telemetry
 * @param isControlled Whether the component is in controlled mode
 * @returns Object containing highlight layer ref and sync functions
 */
export const useHighlightSync = (
    telemetry?: AIOptimizedTelemetry,
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>,
    getCurrentValue?: () => string,
    getHeight?: () => number | undefined,
    isControlled?: boolean,
) => {
    const highlightLayerRef = useRef<HTMLDivElement>(null);
    const syncFrameId = useRef<number | undefined>(undefined);

    /**
     * Synchronizes scroll position between textarea and highlight layer
     * @param textareaRefParam The textarea ref to sync from
     */
    const syncScroll = useCallback(
        (textareaRefParam: React.RefObject<HTMLTextAreaElement | null>) => {
            const before = {
                scrollLeft: highlightLayerRef.current?.scrollLeft,
                scrollTop: highlightLayerRef.current?.scrollTop,
            };

            syncScrollPositions(textareaRefParam.current, highlightLayerRef.current);

            const after = {
                scrollLeft: highlightLayerRef.current?.scrollLeft,
                scrollTop: highlightLayerRef.current?.scrollTop,
            };

            telemetry?.record(
                'syncScroll',
                'sync',
                {
                    after,
                    before,
                    changed: before.scrollTop !== after.scrollTop || before.scrollLeft !== after.scrollLeft,
                },
                textareaRef ?? textareaRefParam,
                getCurrentValue?.() ?? '',
                getHeight?.(),
                isControlled ?? false,
                { highlightLayer: highlightLayerRef.current },
            );
        },
        [telemetry, textareaRef, getCurrentValue, getHeight, isControlled],
    );

    /**
     * Synchronizes styles between textarea and highlight layer
     * @param textareaRefParam The textarea ref to sync from
     */
    const syncStyles = useCallback(
        (textareaRefParam: React.RefObject<HTMLTextAreaElement | null>) => {
            if (!textareaRefParam.current || !highlightLayerRef.current) {
                return;
            }

            const computedStyle = getComputedStyle(textareaRefParam.current);
            const scrollbarWidth =
                textareaRefParam.current.offsetWidth -
                textareaRefParam.current.clientWidth -
                (parseFloat(computedStyle.borderLeftWidth) || 0) -
                (parseFloat(computedStyle.borderRightWidth) || 0);
            const adjustedPaddingSide = scrollbarWidth > 0 ? (computedStyle.direction === 'rtl' ? 'left' : 'right') : null;

            syncHighlightStyles(textareaRefParam.current, highlightLayerRef.current);

            telemetry?.record(
                'syncStyles',
                'sync',
                {
                    direction: computedStyle.direction,
                    fontSize: computedStyle.fontSize,
                    padding: computedStyle.padding,
                    renderSetsOverlayPadding: false,
                    scrollbarWidth,
                    syncStylesAdjustedPaddingSide: adjustedPaddingSide,
                },
                textareaRef ?? textareaRefParam,
                getCurrentValue?.() ?? '',
                getHeight?.(),
                isControlled ?? false,
                {
                    highlightLayer: highlightLayerRef.current,
                    styleOwnership: {
                        renderSetsOverlayPadding: false,
                        syncStylesAdjustedPaddingSide: adjustedPaddingSide,
                        syncStylesSetsPadding: true,
                    },
                },
            );
        },
        [telemetry, textareaRef, getCurrentValue, getHeight, isControlled],
    );

    /**
     * Schedules a single-frame layout sync so style and scroll updates are applied together.
     */
    const syncLayout = useCallback(
        (textareaRefParam: React.RefObject<HTMLTextAreaElement | null>) => {
            if (syncFrameId.current !== undefined) {
                cancelAnimationFrame(syncFrameId.current);
            }

            syncFrameId.current = requestAnimationFrame(() => {
                syncStyles(textareaRefParam);
                syncScroll(textareaRefParam);
                syncFrameId.current = undefined;
            });
        },
        [syncStyles, syncScroll],
    );

    const cancelPendingSync = useCallback(() => {
        if (syncFrameId.current === undefined) {
            return;
        }

        cancelAnimationFrame(syncFrameId.current);
        syncFrameId.current = undefined;
    }, []);

    return { cancelPendingSync, highlightLayerRef, syncLayout, syncScroll, syncStyles };
};
