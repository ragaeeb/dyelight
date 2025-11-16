import { useCallback, useState } from 'react';

import { autoResize } from '@/domUtils';

export const createAutoResizeHandler = (
    enableAutoResize: boolean,
    setTextareaHeight: (height: number | undefined) => void,
    resize: (element: HTMLTextAreaElement) => void = autoResize,
) => {
    return (element: HTMLTextAreaElement) => {
        if (!enableAutoResize) return;

        resize(element);
        setTextareaHeight(element.scrollHeight);
    };
};

/**
 * Hook for managing textarea auto-resize functionality
 */
export const useAutoResize = (enableAutoResize: boolean) => {
    const [textareaHeight, setTextareaHeight] = useState<number | undefined>();

    /**
     * Handles automatic resizing of the textarea based on content
     */
    const handleAutoResize = useCallback(
        createAutoResizeHandler(enableAutoResize, setTextareaHeight),
        [enableAutoResize, setTextareaHeight],
    );

    return {
        handleAutoResize,
        textareaHeight,
    };
};
