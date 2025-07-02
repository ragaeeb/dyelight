import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for managing textarea value state and synchronization
 * Handles both controlled and uncontrolled modes, plus programmatic changes
 */
export const useTextareaValue = (value?: string, defaultValue = '', onChange?: (value: string) => void) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [internalValue, setInternalValue] = useState(value ?? defaultValue);

    const currentValue = value !== undefined ? value : internalValue;

    /**
     * Syncs the current value with the actual DOM value
     * This is crucial for handling programmatic value changes
     */
    const syncValueWithDOM = useCallback(() => {
        if (textareaRef.current) {
            const domValue = textareaRef.current.value;
            if (domValue !== currentValue) {
                if (value === undefined) {
                    // Uncontrolled mode - update internal state
                    setInternalValue(domValue);
                }
                // Notify parent of the change
                onChange?.(domValue);
            }
        }
    }, [currentValue, value, onChange]);

    /**
     * Handles textarea value changes
     */
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;

            if (value === undefined) {
                setInternalValue(newValue);
            }

            onChange?.(newValue);
        },
        [value, onChange],
    );

    /**
     * Handles input events to catch programmatic changes
     */
    const handleInput = useCallback(
        (e: React.FormEvent<HTMLTextAreaElement>) => {
            const newValue = e.currentTarget.value;

            // Check if this is a programmatic change (value differs from our state)
            if (newValue !== currentValue) {
                if (value === undefined) {
                    setInternalValue(newValue);
                }
                onChange?.(newValue);
            }
        },
        [currentValue, value, onChange],
    );

    /**
     * Programmatically sets the textarea value
     */
    const setValue = useCallback(
        (newValue: string) => {
            if (textareaRef.current) {
                textareaRef.current.value = newValue;

                // Update internal state
                if (value === undefined) {
                    setInternalValue(newValue);
                }

                // Notify parent
                onChange?.(newValue);
            }
        },
        [value, onChange],
    );

    // Sync with DOM value on mount and when external changes occur
    useEffect(() => {
        syncValueWithDOM();
    }, [syncValueWithDOM]);

    // Handle controlled value changes
    useEffect(() => {
        if (value !== undefined && textareaRef.current && textareaRef.current.value !== value) {
            textareaRef.current.value = value;
        }
    }, [value]);

    // Use a MutationObserver to detect programmatic value changes
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const observer = new MutationObserver(() => {
            syncValueWithDOM();
        });

        // Watch for attribute changes (like value attribute)
        observer.observe(textarea, {
            attributeFilter: ['value'],
            attributes: true,
        });

        // Also use a polling mechanism as a fallback
        const intervalId = setInterval(() => {
            if (textarea.value !== currentValue) {
                syncValueWithDOM();
            }
        }, 100);

        return () => {
            observer.disconnect();
            clearInterval(intervalId);
        };
    }, [currentValue, syncValueWithDOM]);

    return {
        currentValue,
        handleChange,
        handleInput,
        setValue,
        textareaRef,
    };
};
