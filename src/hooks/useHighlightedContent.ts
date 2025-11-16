import { useMemo } from 'react';

import type { CharacterRange } from '@/types';

import { absoluteToLinePos, getLinePositions } from '@/textUtils';

export const computeHighlightedContent = (
    text: string,
    highlights: CharacterRange[],
    lineHighlights: { [lineNumber: number]: string },
    renderHighlightedLine: (
        line: string,
        lineIndex: number,
        ranges: Array<{ className?: string; end: number; start: number; style?: React.CSSProperties }>,
        lineHighlight?: string,
    ) => React.ReactElement,
) => {
    const { lines, lineStarts } = getLinePositions(text);

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

        for (let lineIndex = startPos.line; lineIndex <= endPos.line; lineIndex++) {
            if (!highlightsByLine[lineIndex]) {
                highlightsByLine[lineIndex] = [];
            }

            const lineStart = lineStarts[lineIndex];

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
};

/**
 * Hook for computing highlighted content from text and highlight ranges
 */
export const useHighlightedContent = (
    text: string,
    highlights: CharacterRange[],
    lineHighlights: { [lineNumber: number]: string },
    renderHighlightedLine: (
        line: string,
        lineIndex: number,
        ranges: Array<{ className?: string; end: number; start: number; style?: React.CSSProperties }>,
        lineHighlight?: string,
    ) => React.ReactElement,
) => {
    /**
     * Computes the highlighted content by processing text and highlight ranges
     * Groups highlights by line and renders each line with appropriate highlighting
     */
    const highlightedContent = useMemo(
        () => computeHighlightedContent(text, highlights, lineHighlights, renderHighlightedLine),
        [text, highlights, lineHighlights, renderHighlightedLine],
    );

    return highlightedContent;
};
