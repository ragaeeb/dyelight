import { useCallback, useState } from 'react';

import { autoResize } from '@/domUtils';

/**
 * Hook for managing textarea auto-resize functionality
 */
export const useAutoResize = (enableAutoResize: boolean) => {
    const [textareaHeight, setTextareaHeight] = useState<number | undefined>();

    /**
     * Handles automatic resizing of the textarea based on content
     */
    const handleAutoResize = useCallback(
        (element: HTMLTextAreaElement) => {
            if (!enableAutoResize) return;

            autoResize(element);
            setTextareaHeight(element.scrollHeight);
        },
        [enableAutoResize],
    );

    return {
        handleAutoResize,
        textareaHeight,
    };
};
