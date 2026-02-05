/**
 * @fileoverview Hook for managing textarea value state and synchronization
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AIOptimizedTelemetry } from '../telemetry';

/**
 * Synchronizes the textarea DOM value with React state
 * @param textarea The textarea DOM element
 * @param currentValue Current React state value
 * @param isControlled Whether the component is in controlled mode
 * @param setInternalValue Function to update internal state
 * @param onChange Optional onChange callback
 */
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

    if (isControlled) {
        return;
    }

    const domValue = textarea.value;
    if (domValue !== currentValue) {
        setInternalValue(domValue);
        onChange?.(domValue);
    }
};

/**
 * Handles value changes from user input
 * @param newValue New value from user input
 * @param currentValue Current React state value
 * @param isControlled Whether the component is in controlled mode
 * @param setInternalValue Function to update internal state
 * @param onChange Optional onChange callback
 */
export const handleChangeValue = (
    newValue: string,
    currentValue: string,
    isControlled: boolean,
    setInternalValue: (value: string) => void,
    onChange?: (value: string) => void,
    setRenderValue?: (value: string) => void,
) => {
    if (newValue === currentValue) {
        return;
    }

    if (isControlled) {
        setRenderValue?.(newValue);
    } else {
        setInternalValue(newValue);
    }

    onChange?.(newValue);
};

/**
 * Applies a programmatic value change via setValue
 * @param textarea The textarea DOM element
 * @param newValue New value to set
 * @param isControlled Whether the component is in controlled mode
 * @param setInternalValue Function to update internal state
 * @param onChange Optional onChange callback
 */
export const applySetValue = (
    textarea: HTMLTextAreaElement | null,
    newValue: string,
    isControlled: boolean,
    setInternalValue: (value: string) => void,
    onChange?: (value: string) => void,
    setRenderValue?: (value: string) => void,
) => {
    if (!textarea) {
        return;
    }

    textarea.value = newValue;

    if (isControlled) {
        setRenderValue?.(newValue);
    } else {
        setInternalValue(newValue);
    }

    onChange?.(newValue);
};

/**
 * Hook for managing textarea value state and synchronization
 * Handles both controlled and uncontrolled modes, plus programmatic changes
 *
 * @param value Controlled value (optional)
 * @param defaultValue Default value for uncontrolled mode
 * @param onChange Callback when value changes
 * @param telemetry Optional telemetry collector for debugging
 * @param textareaRef Optional external textarea ref
 * @param getHeight Optional function to get current textarea height
 * @returns Object containing current value, change handler, setValue function, and textarea ref
 */
export const useTextareaValue = (
    value?: string,
    defaultValue = '',
    onChange?: (value: string) => void,
    telemetry?: AIOptimizedTelemetry,
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>,
    getHeight?: () => number | undefined,
) => {
    const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [internalValue, setInternalValue] = useState(value ?? defaultValue);
    const [renderValue, setRenderValue] = useState(value ?? defaultValue);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? renderValue : internalValue;
    const actualTextareaRef = textareaRef ?? internalTextareaRef;

    const syncValueWithDOMCallback = useCallback(() => {
        syncValueWithDOM(actualTextareaRef.current, currentValue, isControlled, setInternalValue, onChange);
    }, [currentValue, isControlled, onChange, actualTextareaRef]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;

            telemetry?.record(
                'onChange',
                'user',
                {
                    lengthDelta: newValue.length - currentValue.length,
                    newValue,
                    previousValue: currentValue,
                    valueLength: newValue.length,
                },
                actualTextareaRef,
                currentValue,
                getHeight?.(),
                isControlled,
            );

            handleChangeValue(newValue, currentValue, isControlled, setInternalValue, onChange, setRenderValue);
        },
        [currentValue, isControlled, onChange, telemetry, actualTextareaRef, getHeight],
    );

    const setValue = useCallback(
        (newValue: string) => {
            telemetry?.record(
                'setValue',
                'state',
                { newValue, previousValue: currentValue },
                actualTextareaRef,
                currentValue,
                getHeight?.(),
                isControlled,
            );

            applySetValue(actualTextareaRef.current, newValue, isControlled, setInternalValue, onChange, setRenderValue);
        },
        [isControlled, onChange, telemetry, actualTextareaRef, getHeight, currentValue],
    );

    useEffect(() => {
        syncValueWithDOMCallback();
    }, [syncValueWithDOMCallback]);

    useEffect(() => {
        if (!isControlled) {
            return;
        }

        const nextValue = value ?? '';
        if (nextValue !== renderValue) {
            setRenderValue(nextValue);
        }
    }, [isControlled, value, renderValue]);

    useEffect(() => {
        if (actualTextareaRef.current && actualTextareaRef.current.value !== currentValue) {
            telemetry?.record(
                'valueMismatch',
                'state',
                { domValue: actualTextareaRef.current.value, stateValue: currentValue },
                actualTextareaRef,
                currentValue,
                getHeight?.(),
                isControlled,
            );
        }
    }, [currentValue, isControlled, telemetry, actualTextareaRef, getHeight]);

    return { currentValue, handleChange, setValue, textareaRef: actualTextareaRef };
};
