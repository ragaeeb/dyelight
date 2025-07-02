import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { autoResize } from './domUtils';
import type { DyeLightProps, DyeLightRef } from './types';
import { absoluteToLinePos, getLinePositions, isColorValue } from './textUtils';
import { DEFAULT_BASE_STYLE, DEFAULT_CONTAINER_STYLE, DEFAULT_HIGHLIGHT_LAYER_STYLE } from './styles';

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
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const [text, setText] = useState('Hello world\nSecond line');
 *
 *   // Highlight characters 0-5 (absolute positions)
 *   const highlights = HighlightBuilder.ranges([
 *     { start: 0, end: 5, className: 'bg-yellow-200' },
 *     { start: 12, end: 18, className: 'bg-blue-200' }
 *   ]);
 *
 *   // Highlight keywords automatically
 *   const keywordHighlights = HighlightBuilder.pattern(
 *     text,
 *     /\b(function|const|let)\b/g,
 *     'text-blue-600'
 *   );
 *
 *   // Optional line highlights
 *   const lineHighlights = HighlightBuilder.lines([
 *     { line: 1, className: 'bg-red-100' }
 *   ]);
 *
 *   return (
 *     <DyeLight
 *       value={text}
 *       onChange={setText}
 *       highlights={[...highlights, ...keywordHighlights]}
 *       lineHighlights={lineHighlights}
 *     />
 *   );
 * };
 * ```
 */
const DyeLight = forwardRef<DyeLightRef, DyeLightProps>(
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
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const highlightLayerRef = useRef<HTMLDivElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);

        const [internalValue, setInternalValue] = useState(value ?? defaultValue);
        const [textareaHeight, setTextareaHeight] = useState<number | undefined>();

        const currentValue = value !== undefined ? value : internalValue;

        const handleAutoResize = useCallback(
            (element: HTMLTextAreaElement) => {
                if (!enableAutoResize) return;

                autoResize(element);
                setTextareaHeight(element.scrollHeight);
            },
            [enableAutoResize],
        );

        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newValue = e.target.value;

                if (value === undefined) {
                    setInternalValue(newValue);
                }

                onChange?.(newValue);
                handleAutoResize(e.target);
            },
            [value, onChange, handleAutoResize],
        );

        const syncScroll = useCallback(() => {
            if (textareaRef.current && highlightLayerRef.current) {
                const { scrollLeft, scrollTop } = textareaRef.current;
                highlightLayerRef.current.scrollTop = scrollTop;
                highlightLayerRef.current.scrollLeft = scrollLeft;
            }
        }, []);

        const syncStyles = useCallback(() => {
            if (!textareaRef.current || !highlightLayerRef.current) return;

            const computedStyle = getComputedStyle(textareaRef.current);
            const highlightLayer = highlightLayerRef.current;

            highlightLayer.style.padding = computedStyle.padding;
            highlightLayer.style.fontSize = computedStyle.fontSize;
            highlightLayer.style.fontFamily = computedStyle.fontFamily;
            highlightLayer.style.lineHeight = computedStyle.lineHeight;
            highlightLayer.style.letterSpacing = computedStyle.letterSpacing;
            highlightLayer.style.wordSpacing = computedStyle.wordSpacing;
            highlightLayer.style.textIndent = computedStyle.textIndent;
        }, []);

        useImperativeHandle(
            ref,
            () => ({
                blur: () => textareaRef.current?.blur(),
                focus: () => textareaRef.current?.focus(),
                getValue: () => currentValue,
                select: () => textareaRef.current?.select(),
                setSelectionRange: (start: number, end: number) => textareaRef.current?.setSelectionRange(start, end),
                setValue: (newValue: string) => {
                    if (value === undefined) {
                        setInternalValue(newValue);
                    }
                    if (textareaRef.current) {
                        textareaRef.current.value = newValue;
                        handleAutoResize(textareaRef.current);
                    }
                },
            }),
            [currentValue, value, handleAutoResize],
        );

        useEffect(() => {
            if (textareaRef.current && enableAutoResize) {
                handleAutoResize(textareaRef.current);
            }
            syncStyles();
        }, [currentValue, handleAutoResize, enableAutoResize, syncStyles]);

        const highlightedContent = useMemo(() => {
            const { lines, lineStarts } = getLinePositions(currentValue);

            // Group highlights by line
            const highlightsByLine: {
                [lineIndex: number]: Array<{
                    className?: string;
                    end: number;
                    start: number;
                    style?: React.CSSProperties;
                }>;
            } = {};

            highlights.forEach((highlight) => {
                const startPos = absoluteToLinePos(highlight.start, lineStarts);
                const endPos = absoluteToLinePos(highlight.end - 1, lineStarts);

                // Handle highlights that span multiple lines
                for (let lineIndex = startPos.line; lineIndex <= endPos.line; lineIndex++) {
                    if (!highlightsByLine[lineIndex]) {
                        highlightsByLine[lineIndex] = [];
                    }

                    const lineStart = lineStarts[lineIndex];

                    // Calculate highlight range within this line
                    const rangeStart = Math.max(highlight.start - lineStart, 0);
                    const rangeEnd = Math.min(highlight.end - lineStart, lines[lineIndex].length);

                    if (rangeEnd > rangeStart) {
                        highlightsByLine[lineIndex].push({
                            className: highlight.className,
                            end: rangeEnd,
                            start: rangeStart,
                            style: highlight.style,
                        });
                    }
                }
            });

            return lines.map((line, lineIndex) => {
                const lineHighlight = lineHighlights[lineIndex];
                const ranges = highlightsByLine[lineIndex] || [];

                return renderHighlightedLine(line, lineIndex, ranges, lineHighlight);
            });
        }, [currentValue, highlights, lineHighlights]);

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
                    onChange={handleChange}
                    onScroll={syncScroll}
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

export default DyeLight;
