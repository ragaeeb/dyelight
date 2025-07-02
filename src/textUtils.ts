/**
 * Converts absolute text positions to line-relative positions
 */
export const getLinePositions = (text: string) => {
    const lines = text.split('\n');
    const lineStarts: number[] = [];
    let position = 0;

    lines.forEach((line, index) => {
        lineStarts.push(position);
        position += line.length + (index < lines.length - 1 ? 1 : 0); // +1 for \n except last line
    });

    return { lines, lineStarts };
};

/**
 * Converts absolute position to line and character index
 */
export const absoluteToLinePos = (absolutePos: number, lineStarts: number[]) => {
    for (let i = lineStarts.length - 1; i >= 0; i--) {
        if (absolutePos >= lineStarts[i]) {
            return {
                char: absolutePos - lineStarts[i],
                line: i,
            };
        }
    }
    return { char: 0, line: 0 };
};

export const isColorValue = (value: string): boolean => {
    return (
        /^(#|rgb|hsl|var\(--.*?\)|transparent|currentColor|inherit|initial|unset)/i.test(value) ||
        /^[a-z]+$/i.test(value)
    );
};
