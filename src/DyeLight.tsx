import type React from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import { useAutoResize } from './hooks/useAutoResize';
import { useHighlightedContent } from './hooks/useHighlightedContent';
import { useHighlightSync } from './hooks/useHighlightSync';
import { useTextareaValue } from './hooks/useTextareaValue';
import { DEFAULT_BASE_STYLE, DEFAULT_CONTAINER_STYLE, DEFAULT_HIGHLIGHT_LAYER_STYLE } from './styles';
import { AIOptimizedTelemetry } from './telemetry';
import { isColorValue } from './textUtils';
import type { DyeLightProps, DyeLightRef } from './types';

const BIDI_LINE_STYLE: React.CSSProperties = {
    unicodeBidi: 'inherit',
};

const BIDI_SPAN_STYLE: React.CSSProperties = {
    unicodeBidi: 'normal',
};

/**
 * @fileoverview DyeLight - A React textarea component with advanced text highlighting capabilities
 *
 * This component provides a textarea with overlay-based text highlighting that supports:
 * - Character-level highlighting using absolute text positions
 * - Line-level highlighting with CSS classes or color values
 * - Automatic height adjustment based on content
 * - Synchronized scrolling between textarea and highlight layer
 * - Both controlled and uncontrolled usage patterns
 * - RTL text direction support
 */

/**
 * Creates a line element with optional highlighting
 */
export const createLineElement = (
    content: React.ReactNode,
    lineIndex: number,
    lineHighlight?: string,
): React.ReactElement => {
    if (!lineHighlight) {
        return (
            <div key={lineIndex} style={BIDI_LINE_STYLE}>
                {content}
            </div>
        );
    }

    const isColor = isColorValue(lineHighlight);
    return (
        <div
            className={isColor ? undefined : lineHighlight}
            key={lineIndex}
            style={isColor ? { ...BIDI_LINE_STYLE, backgroundColor: lineHighlight } : BIDI_LINE_STYLE}
        >
            {content}
        </div>
    );
};

/**
 * Renders a single line with character-level highlights and optional line-level highlighting
 */
export const renderHighlightedLine = (
    line: string,
    lineIndex: number,
    ranges: Array<{
        absoluteStart: number;
        className?: string;
        end: number;
        start: number;
        style?: React.CSSProperties;
    }>,
    lineHighlight?: string,
): React.ReactElement => {
    if (ranges.length === 0) {
        const content = line || '\u00A0';
        return createLineElement(content, lineIndex, lineHighlight);
    }

    const sortedRanges = ranges.toSorted((a, b) => a.start - b.start);

    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedRanges.forEach((range, idx) => {
        const { className, end, start, style: rangeStyle } = range;

        const clampedStart = Math.max(0, Math.min(start, line.length));
        const clampedEnd = Math.max(clampedStart, Math.min(end, line.length));

        if (clampedEnd <= lastIndex) {
            return;
        }

        const effectiveStart = Math.max(clampedStart, lastIndex);

        if (effectiveStart > lastIndex) {
            const textBefore = line.slice(lastIndex, effectiveStart);
            if (textBefore) {
                result.push(textBefore);
            }
        }

        if (clampedEnd > effectiveStart) {
            const highlightedText = line.slice(effectiveStart, clampedEnd);
            result.push(
                <span
                    className={className}
                    key={`highlight-${lineIndex}-${idx.toString()}`}
                    style={rangeStyle ? { ...rangeStyle, ...BIDI_SPAN_STYLE } : BIDI_SPAN_STYLE}
                    data-range-start={range.absoluteStart}
                >
                    {highlightedText}
                </span>,
            );
        }

        lastIndex = Math.max(lastIndex, clampedEnd);
    });

    if (lastIndex < line.length) {
        const textAfter = line.slice(lastIndex);
        if (textAfter) {
            result.push(textAfter);
        }
    }

    const content = result.length === 0 ? '\u00A0' : result;
    return createLineElement(content, lineIndex, lineHighlight);
};

/**
 * Builds the base style object for the highlight overlay.
 * Padding is intentionally omitted here so syncStyles can preserve scrollbar compensation.
 */
export const getHighlightLayerStyle = (
    dir: React.CSSProperties['direction'],
    textareaHeight?: number,
): React.CSSProperties => ({
    ...DEFAULT_HIGHLIGHT_LAYER_STYLE,
    direction: dir,
    height: textareaHeight ? `${textareaHeight}px` : undefined,
});

/**
 * A textarea component with support for highlighting character ranges using absolute positions
 * and optional line-level highlighting. Perfect for syntax highlighting, error indication,
 * and text annotation without the complexity of line-based positioning.
 */
export const DyeLight = forwardRef<DyeLightRef, DyeLightProps>(
    (
        {
            className = '',
            containerClassName = '',
            defaultValue = '',
            dir = 'ltr',
            enableAutoResize = true,
            highlights = [],
            lineHighlights = {},
            onChange,
            onScroll: onScrollProp,
            onSelect: onSelectProp,
            rows = 4,
            style,
            value,
            debug = false,
            debugMaxEvents = 1000,
            ...props
        },
        ref,
    ) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const textareaHeightRef = useRef<number | undefined>(undefined);

        const telemetry = useMemo(() => new AIOptimizedTelemetry(debug, debugMaxEvents), [debug, debugMaxEvents]);

        useEffect(() => {
            telemetry.setEnabled(debug);
        }, [debug, telemetry]);

        const isControlled = value !== undefined;
        const getHeight = useCallback(() => textareaHeightRef.current, []);

        const { currentValue, handleChange, setValue, textareaRef } = useTextareaValue(
            value,
            defaultValue,
            onChange,
            telemetry,
            undefined,
            getHeight,
        );
        const currentValueRef = useRef(currentValue);

        const getCurrentValue = useCallback(() => currentValue, [currentValue]);

        const { handleAutoResize, textareaHeight } = useAutoResize(
            enableAutoResize,
            telemetry,
            textareaRef,
            getCurrentValue,
            isControlled,
        );

        useEffect(() => {
            textareaHeightRef.current = textareaHeight;
        }, [textareaHeight]);

        useLayoutEffect(() => {
            currentValueRef.current = currentValue;
        }, [currentValue]);

        const { cancelPendingSync, highlightLayerRef, syncLayout } = useHighlightSync(
            telemetry,
            textareaRef,
            getCurrentValue,
            getHeight,
            isControlled,
        );

        const highlightedContent = useHighlightedContent(
            currentValue,
            highlights,
            lineHighlights,
            renderHighlightedLine,
        );

        const handleChangeWithResize = useCallback(
            (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                handleChange(e);
            },
            [handleChange],
        );

        const setValueWithResize = useCallback(
            (newValue: string) => {
                setValue(newValue);
                if (textareaRef.current) {
                    handleAutoResize(textareaRef.current);
                }
                syncLayout(textareaRef);
            },
            [setValue, handleAutoResize, textareaRef, syncLayout],
        );

        const handleScroll = useCallback(
            (e: React.UIEvent<HTMLTextAreaElement>) => {
                onScrollProp?.(e);
                syncLayout(textareaRef);
            },
            [onScrollProp, syncLayout, textareaRef],
        );

        const handleSelect = useCallback(
            (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
                const target = e.currentTarget;
                telemetry.record(
                    'selectionChange',
                    'user',
                    {
                        direction: target.selectionDirection,
                        end: target.selectionEnd,
                        source: 'onSelect',
                        start: target.selectionStart,
                    },
                    textareaRef,
                    currentValue,
                    textareaHeight,
                    isControlled,
                    { highlightLayer: highlightLayerRef.current },
                );

                syncLayout(textareaRef);
                onSelectProp?.(e);
            },
            [onSelectProp, telemetry, textareaRef, currentValue, textareaHeight, isControlled, highlightLayerRef, syncLayout],
        );

        useEffect(() => {
            const textarea = textareaRef.current;
            if (!textarea) {
                return;
            }

            const recordSelectionChange = () => {
                telemetry.record(
                    'selectionChange',
                    'user',
                    {
                        direction: textarea.selectionDirection,
                        end: textarea.selectionEnd,
                        source: 'document.selectionchange',
                        start: textarea.selectionStart,
                    },
                    textareaRef,
                    currentValueRef.current,
                    textareaHeightRef.current,
                    isControlled,
                    { highlightLayer: highlightLayerRef.current },
                );
            };

            const onDocumentSelectionChange = () => {
                if (document.activeElement !== textarea) {
                    return;
                }
                recordSelectionChange();
                syncLayout(textareaRef);
            };

            document.addEventListener('selectionchange', onDocumentSelectionChange);
            return () => {
                document.removeEventListener('selectionchange', onDocumentSelectionChange);
            };
        }, [telemetry, textareaRef, isControlled, highlightLayerRef, syncLayout]);

        useEffect(() => {
            if (!debug) {
                return;
            }

            const intervalId = setInterval(() => {
                telemetry.record('snapshot', 'system', {}, textareaRef, currentValue, textareaHeight, isControlled);
            }, 1000);

            return () => clearInterval(intervalId);
        }, [debug, telemetry, textareaRef, currentValue, textareaHeight, isControlled]);

        useImperativeHandle(
            ref,
            () => ({
                blur: () => textareaRef.current?.blur(),
                exportForAI: () => {
                    return telemetry.exportForAI(textareaRef, currentValue, textareaHeight, highlights);
                },
                focus: () => textareaRef.current?.focus(),
                getValue: () => currentValue,
                scrollToPosition: (pos: number, offset = 40, behavior: ScrollBehavior = 'auto') => {
                    if (highlightLayerRef.current && textareaRef.current) {
                        const span = highlightLayerRef.current.querySelector(`[data-range-start="${pos.toString()}"]`);
                        if (span instanceof HTMLElement) {
                            const textarea = textareaRef.current;
                            const spanTop = span.offsetTop;
                            if (behavior === 'smooth') {
                                textarea.scrollTo({ behavior: 'smooth', top: spanTop - offset });
                            } else {
                                textarea.scrollTop = spanTop - offset;
                            }
                        }
                    }
                },
                select: () => textareaRef.current?.select(),
                setSelectionRange: (start: number, end: number) => textareaRef.current?.setSelectionRange(start, end),
                setValue: setValueWithResize,
            }),
            [currentValue, setValueWithResize, highlightLayerRef, textareaRef, telemetry, textareaHeight, highlights],
        );

        const layoutStyleKey = useMemo(() => {
            if (!style) {
                return '';
            }

            return Object.entries(style as Record<string, unknown>)
                .toSorted(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}:${String(value)}`)
                .join(';');
        }, [style]);

        const layoutSyncKey = useMemo(
            () => `${dir}|${className}|${rows.toString()}|${layoutStyleKey}`,
            [dir, className, rows, layoutStyleKey],
        );

        useLayoutEffect(() => {
            void layoutSyncKey;
            if (textareaRef.current && enableAutoResize) {
                handleAutoResize(textareaRef.current);
            }
            syncLayout(textareaRef);
        }, [layoutSyncKey, handleAutoResize, enableAutoResize, syncLayout, textareaRef]);

        useLayoutEffect(() => {
            if (!textareaRef.current) {
                return;
            }

            if (enableAutoResize) {
                handleAutoResize(textareaRef.current);
            }
            syncLayout(textareaRef);
        }, [currentValue, enableAutoResize, handleAutoResize, syncLayout, textareaRef]);

        useEffect(() => {
            if (!textareaRef.current) {
                return;
            }

            const textarea = textareaRef.current;

            const observer = new ResizeObserver(() => {
                if (enableAutoResize) {
                    handleAutoResize(textarea);
                }
                syncLayout(textareaRef);
            });

            observer.observe(textarea);
            return () => {
                observer.disconnect();
            };
        }, [textareaRef, syncLayout, handleAutoResize, enableAutoResize]);

        useEffect(() => {
            return () => {
                cancelPendingSync();
            };
        }, [cancelPendingSync]);

        const baseTextareaStyle: React.CSSProperties = {
            ...DEFAULT_BASE_STYLE,
            color: currentValue ? 'transparent' : 'inherit',
            height: textareaHeight ? `${textareaHeight}px` : undefined,
            resize: enableAutoResize ? 'none' : 'vertical',
        };

        const highlightLayerStyle = getHighlightLayerStyle(dir, textareaHeight);

        return (
            <div className={containerClassName} ref={containerRef} style={{ ...DEFAULT_CONTAINER_STYLE, ...style }}>
                <div aria-hidden="true" dir={dir} ref={highlightLayerRef} style={highlightLayerStyle}>
                    {highlightedContent}
                </div>

                <textarea
                    className={className}
                    dir={dir}
                    onChange={handleChangeWithResize}
                    onScroll={handleScroll}
                    onSelect={handleSelect}
                    ref={textareaRef}
                    rows={rows}
                    style={baseTextareaStyle}
                    value={currentValue}
                    {...props}
                />
            </div>
        );
    },
);

DyeLight.displayName = 'DyeLight';
