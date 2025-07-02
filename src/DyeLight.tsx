import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import type { DyeLightProps, DyeLightRef } from './types';

import { useAutoResize } from './hooks/useAutoResize';
import { useHighlightedContent } from './hooks/useHighlightedContent';
import { useHighlightSync } from './hooks/useHighlightSync';
import { useTextareaValue } from './hooks/useTextareaValue';
import { DEFAULT_BASE_STYLE, DEFAULT_CONTAINER_STYLE, DEFAULT_HIGHLIGHT_LAYER_STYLE } from './styles';
import { isColorValue } from './textUtils';

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
const createLineElement = (content: React.ReactNode, lineIndex: number, lineHighlight?: string): React.ReactElement => {
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
const renderHighlightedLine = (
    line: string,
    lineIndex: number,
    ranges: Array<{ className?: string; end: number; start: number; style?: React.CSSProperties }>,
    lineHighlight?: string,
): React.ReactElement => {
    if (ranges.length === 0) {
        const content = line || '\u00A0';
        return createLineElement(content, lineIndex, lineHighlight);
    }

    // Sort ranges by start position
    const sortedRanges = ranges.toSorted((a, b) => a.start - b.start);

    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedRanges.forEach((range, idx) => {
        const { className, end, start, style: rangeStyle } = range;

        // Clamp range to line bounds
        const clampedStart = Math.max(0, Math.min(start, line.length));
        const clampedEnd = Math.max(clampedStart, Math.min(end, line.length));

        // Add text before highlight
        if (clampedStart > lastIndex) {
            const textBefore = line.slice(lastIndex, clampedStart);
            if (textBefore) {
                result.push(textBefore);
            }
        }

        // Add highlighted text
        if (clampedEnd > clampedStart) {
            const highlightedText = line.slice(clampedStart, clampedEnd);
            result.push(
                <span className={className} key={`highlight-${lineIndex}-${idx}`} style={rangeStyle}>
                    {highlightedText}
                </span>,
            );
        }

        lastIndex = Math.max(lastIndex, clampedEnd);
    });

    // Add remaining text
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
            defaultValue = '',
            dir = 'ltr',
            enableAutoResize = true,
            highlights = [],
            lineHighlights = {},
            onChange,
            rows = 4,
            style,
            value,
            ...props
        },
        ref,
    ) => {
        const containerRef = useRef<HTMLDivElement>(null);

        // Custom hooks for managing component logic
        const { currentValue, handleChange, handleInput, setValue, textareaRef } = useTextareaValue(
            value,
            defaultValue,
            onChange,
        );

        const { handleAutoResize, textareaHeight } = useAutoResize(enableAutoResize);

        const { highlightLayerRef, syncScroll, syncStyles } = useHighlightSync();

        const highlightedContent = useHighlightedContent(
            currentValue,
            highlights,
            lineHighlights,
            renderHighlightedLine,
        );

        // Enhanced change handler that includes auto-resize
        const handleChangeWithResize = useCallback(
            (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                handleChange(e);
                handleAutoResize(e.target);
            },
            [handleChange, handleAutoResize],
        );

        // Enhanced input handler that includes auto-resize
        const handleInputWithResize = useCallback(
            (e: React.FormEvent<HTMLTextAreaElement>) => {
                handleInput(e);
                handleAutoResize(e.currentTarget);
            },
            [handleInput, handleAutoResize],
        );

        // Enhanced setValue that includes auto-resize
        const setValueWithResize = useCallback(
            (newValue: string) => {
                setValue(newValue);
                if (textareaRef.current) {
                    handleAutoResize(textareaRef.current);
                }
            },
            [setValue, handleAutoResize, textareaRef],
        );

        // Scroll handler with ref binding
        const handleScroll = useCallback(() => {
            syncScroll(textareaRef);
        }, [syncScroll, textareaRef]);

        // Expose ref methods
        useImperativeHandle(
            ref,
            () => ({
                blur: () => textareaRef.current?.blur(),
                focus: () => textareaRef.current?.focus(),
                getValue: () => currentValue,
                select: () => textareaRef.current?.select(),
                setSelectionRange: (start: number, end: number) => textareaRef.current?.setSelectionRange(start, end),
                setValue: setValueWithResize,
            }),
            [currentValue, setValueWithResize],
        );

        // Sync styles and handle auto-resize on value changes
        useEffect(() => {
            if (textareaRef.current && enableAutoResize) {
                handleAutoResize(textareaRef.current);
            }
            syncStyles(textareaRef);
        }, [currentValue, handleAutoResize, enableAutoResize, syncStyles, textareaRef]);

        // Compute styles
        const baseTextareaStyle: React.CSSProperties = {
            ...DEFAULT_BASE_STYLE,
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
            <div ref={containerRef} style={{ ...DEFAULT_CONTAINER_STYLE, ...style }}>
                <div aria-hidden="true" ref={highlightLayerRef} style={highlightLayerStyle}>
                    {highlightedContent}
                </div>

                <textarea
                    className={className}
                    dir={dir}
                    onChange={handleChangeWithResize}
                    onInput={handleInputWithResize}
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
