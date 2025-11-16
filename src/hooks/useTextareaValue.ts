import { useCallback, useEffect, useRef, useState } from 'react';

export const syncValueWithDOM = (
    textarea: HTMLTextAreaElement | null,
    currentValue: string,
    isControlled: boolean,
    setInternalValue: (value: string) => void,
    onChange?: (value: string) => void,
) => {
    if (!textarea) {
        return;
    }

    const domValue = textarea.value;
    if (domValue !== currentValue) {
        if (!isControlled) {
            setInternalValue(domValue);
        }
        onChange?.(domValue);
    }
};

export const handleChangeValue = (
    newValue: string,
    isControlled: boolean,
    setInternalValue: (value: string) => void,
    onChange?: (value: string) => void,
) => {
    if (!isControlled) {
        setInternalValue(newValue);
    }

    onChange?.(newValue);
};

export const handleInputValue = (
    newValue: string,
    currentValue: string,
    isControlled: boolean,
    setInternalValue: (value: string) => void,
    onChange?: (value: string) => void,
) => {
    if (newValue === currentValue) {
        return;
    }

    if (!isControlled) {
        setInternalValue(newValue);
    }

    onChange?.(newValue);
};

export const applySetValue = (
    textarea: HTMLTextAreaElement | null,
    newValue: string,
    isControlled: boolean,
    setInternalValue: (value: string) => void,
    onChange?: (value: string) => void,
) => {
    if (!textarea) {
        return;
    }

    textarea.value = newValue;

    if (!isControlled) {
        setInternalValue(newValue);
    }

    onChange?.(newValue);
};

/**
 * Hook for managing textarea value state and synchronization
 * Handles both controlled and uncontrolled modes, plus programmatic changes
 */
export const useTextareaValue = (value?: string, defaultValue = '', onChange?: (value: string) => void) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [internalValue, setInternalValue] = useState(value ?? defaultValue);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const syncValueWithDOMCallback = useCallback(() => {
        syncValueWithDOM(textareaRef.current, currentValue, isControlled, setInternalValue, onChange);
    }, [currentValue, isControlled, onChange]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            handleChangeValue(e.target.value, isControlled, setInternalValue, onChange);
        },
        [isControlled, onChange],
    );

    const handleInput = useCallback(
        (e: React.FormEvent<HTMLTextAreaElement>) => {
            handleInputValue(e.currentTarget.value, currentValue, isControlled, setInternalValue, onChange);
        },
        [currentValue, isControlled, onChange],
    );

    const setValue = useCallback(
        (newValue: string) => {
            applySetValue(textareaRef.current, newValue, isControlled, setInternalValue, onChange);
        },
        [isControlled, onChange],
    );

    useEffect(() => {
        syncValueWithDOMCallback();
    }, [syncValueWithDOMCallback]);

    useEffect(() => {
        if (isControlled && textareaRef.current && textareaRef.current.value !== value) {
            textareaRef.current.value = value;
        }
    }, [isControlled, value]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        const observer = new MutationObserver(() => {
            syncValueWithDOMCallback();
        });

        observer.observe(textarea, { attributeFilter: ['value'], attributes: true });

        const intervalId = setInterval(() => {
            if (textarea.value !== currentValue) {
                syncValueWithDOMCallback();
            }
        }, 100);

        return () => {
            observer.disconnect();
            clearInterval(intervalId);
        };
    }, [currentValue, syncValueWithDOMCallback]);

    return { currentValue: currentValue, handleChange, handleInput, setValue, textareaRef };
};
