/**
 * @fileoverview Hook for managing textarea auto-resize functionality
 */

import { useCallback, useState } from 'react';
import { autoResize } from '@/domUtils';
import type { AIOptimizedTelemetry } from '../telemetry';

/**
 * Creates an auto-resize handler function
 * @param enableAutoResize Whether auto-resize is enabled
 * @param setTextareaHeight Function to update textarea height state
 * @param resize The resize function to use (defaults to autoResize)
 * @returns Handler function that resizes the textarea
 */
export const createAutoResizeHandler = (
    enableAutoResize: boolean,
    setTextareaHeight: (height: number | undefined) => void,
    resize: (element: HTMLTextAreaElement) => void = autoResize,
) => {
    return (element: HTMLTextAreaElement) => {
        if (!enableAutoResize) {
            return;
        }

        resize(element);
        setTextareaHeight(element.scrollHeight);
    };
};

/**
 * Hook for managing textarea auto-resize functionality
 * Automatically adjusts textarea height based on content
 *
 * @param enableAutoResize Whether to enable automatic resizing
 * @param telemetry Optional telemetry collector for debugging
 * @param textareaRef Optional textarea reference for telemetry
 * @param getCurrentValue Optional function to get current value for telemetry
 * @param isControlled Whether the component is in controlled mode
 * @returns Object containing resize handler and current height
 */
export const useAutoResize = (
    enableAutoResize: boolean,
    telemetry?: AIOptimizedTelemetry,
    textareaRef?: React.RefObject<HTMLTextAreaElement>,
    getCurrentValue?: () => string,
    isControlled?: boolean,
) => {
    const [textareaHeight, setTextareaHeight] = useState<number | undefined>();

    /**
     * Handles automatic resizing of the textarea based on content
     * Records telemetry data if telemetry is enabled
     */
    const handleAutoResize = useCallback(
        (element: HTMLTextAreaElement) => {
            if (!enableAutoResize) {
                return;
            }

            const beforeHeight = element.scrollHeight;

            autoResize(element);

            const afterHeight = element.scrollHeight;

            telemetry?.record(
                'autoResize',
                'system',
                { afterHeight, beforeHeight, changed: beforeHeight !== afterHeight, textLength: element.value.length },
                textareaRef ?? { current: element },
                getCurrentValue?.() ?? element.value,
                afterHeight,
                isControlled ?? false,
            );

            setTextareaHeight(element.scrollHeight);
        },
        [enableAutoResize, telemetry, textareaRef, getCurrentValue, isControlled],
    );

    return { handleAutoResize, textareaHeight };
};
