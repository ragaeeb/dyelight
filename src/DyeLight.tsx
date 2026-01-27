import type React from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useAutoResize } from './hooks/useAutoResize';
import { useHighlightedContent } from './hooks/useHighlightedContent';
import { useHighlightSync } from './hooks/useHighlightSync';
import { useTextareaValue } from './hooks/useTextareaValue';
import { DEFAULT_BASE_STYLE, DEFAULT_CONTAINER_STYLE, DEFAULT_HIGHLIGHT_LAYER_STYLE } from './styles';
import { AIOptimizedTelemetry } from './telemetry';
import { isColorValue } from './textUtils';
import type { DyeLightProps, DyeLightRef } from './types';

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
        return <div key={lineIndex}>{content}</div>;
    }

    const isColor = isColorValue(lineHighlight);
    return (
        <div
            className={isColor ? undefined : lineHighlight}
            key={lineIndex}
            style={isColor ? { backgroundColor: lineHighlight } : undefined}
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
                    style={rangeStyle}
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

        const { highlightLayerRef, syncScroll, syncStyles } = useHighlightSync(
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
                handleAutoResize(e.target);
            },
            [handleChange, handleAutoResize],
        );

        const setValueWithResize = useCallback(
            (newValue: string) => {
                setValue(newValue);
                if (textareaRef.current) {
                    handleAutoResize(textareaRef.current);
                }
            },
            [setValue, handleAutoResize, textareaRef],
        );

        useEffect(() => {}, []);

        const handleScroll = useCallback(() => {
            syncScroll(textareaRef);
        }, [syncScroll, textareaRef]);

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
                    return telemetry.exportForAI(textareaRef, currentValue, textareaHeight, highlights, lineHighlights);
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
            [
                currentValue,
                setValueWithResize,
                highlightLayerRef,
                textareaRef,
                telemetry,
                textareaHeight,
                highlights,
                lineHighlights,
            ],
        );

        useEffect(() => {
            if (textareaRef.current && enableAutoResize) {
                handleAutoResize(textareaRef.current);
            }
            syncStyles(textareaRef);
        }, [currentValue, handleAutoResize, enableAutoResize, syncStyles, textareaRef]);

        useEffect(() => {
            if (!textareaRef.current) {
                return;
            }

            const textarea = textareaRef.current;
            let rafId: number;

            const observer = new ResizeObserver(() => {
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    syncStyles(textareaRef);
                    if (enableAutoResize) {
                        handleAutoResize(textarea);
                    }
                });
            });

            observer.observe(textarea);
            return () => {
                observer.disconnect();
                cancelAnimationFrame(rafId);
            };
        }, [textareaRef, syncStyles, handleAutoResize, enableAutoResize]);

        const baseTextareaStyle: React.CSSProperties = {
            ...DEFAULT_BASE_STYLE,
            color: currentValue ? 'transparent' : 'inherit',
            height: textareaHeight ? `${textareaHeight}px` : undefined,
            resize: enableAutoResize ? 'none' : 'vertical',
        };

        const highlightLayerStyle: React.CSSProperties = {
            ...DEFAULT_HIGHLIGHT_LAYER_STYLE,
            direction: dir,
            height: textareaHeight ? `${textareaHeight}px` : undefined,
            padding: textareaRef.current ? getComputedStyle(textareaRef.current).padding : '8px 12px',
        };

        return (
            <div className={containerClassName} ref={containerRef} style={{ ...DEFAULT_CONTAINER_STYLE, ...style }}>
                <div aria-hidden="true" ref={highlightLayerRef} style={highlightLayerStyle}>
                    {highlightedContent}
                </div>

                <textarea
                    className={className}
                    dir={dir}
                    onChange={handleChangeWithResize}
                    onScroll={handleScroll}
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
