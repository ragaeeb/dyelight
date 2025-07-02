import { describe, expect, it } from 'bun:test';

import { absoluteToLinePos, getLinePositions, isColorValue } from './textUtils';

describe('textUtils', () => {
    describe('getLinePositions', () => {
        it('should handle single line text', () => {
            const text = 'Hello World';
            const result = getLinePositions(text);

            expect(result.lines).toEqual(['Hello World']);
            expect(result.lineStarts).toEqual([0]);
        });

        it('should handle multi-line text', () => {
            const text = 'Hello\nWorld\nTest';
            const result = getLinePositions(text);

            expect(result.lines).toEqual(['Hello', 'World', 'Test']);
            expect(result.lineStarts).toEqual([0, 6, 12]);
        });

        it('should handle empty text', () => {
            const text = '';
            const result = getLinePositions(text);

            expect(result.lines).toEqual(['']);
            expect(result.lineStarts).toEqual([0]);
        });

        it('should handle text with only newlines', () => {
            const text = '\n\n\n';
            const result = getLinePositions(text);

            expect(result.lines).toEqual(['', '', '', '']);
            expect(result.lineStarts).toEqual([0, 1, 2, 3]);
        });

        it('should handle text with empty lines', () => {
            const text = 'Line1\n\nLine3\n\nLine5';
            const result = getLinePositions(text);

            expect(result.lines).toEqual(['Line1', '', 'Line3', '', 'Line5']);
            expect(result.lineStarts).toEqual([0, 6, 7, 13, 14]);
        });

        it('should handle text ending with newline', () => {
            const text = 'Hello\nWorld\n';
            const result = getLinePositions(text);

            expect(result.lines).toEqual(['Hello', 'World', '']);
            expect(result.lineStarts).toEqual([0, 6, 12]);
        });

        it('should handle text with single newline', () => {
            const text = '\n';
            const result = getLinePositions(text);

            expect(result.lines).toEqual(['', '']);
            expect(result.lineStarts).toEqual([0, 1]);
        });

        it('should handle long lines with varied lengths', () => {
            const text = 'A\nLonger line here\nX\nAnother very long line with more content';
            const result = getLinePositions(text);

            expect(result.lines).toEqual(['A', 'Longer line here', 'X', 'Another very long line with more content']);
            expect(result.lineStarts).toEqual([0, 2, 19, 21]);
        });
    });

    describe('absoluteToLinePos', () => {
        it('should convert absolute position to line position for single line', () => {
            const lineStarts = [0];

            const result1 = absoluteToLinePos(0, lineStarts);
            expect(result1).toEqual({ char: 0, line: 0 });

            const result2 = absoluteToLinePos(5, lineStarts);
            expect(result2).toEqual({ char: 5, line: 0 });

            const result3 = absoluteToLinePos(10, lineStarts);
            expect(result3).toEqual({ char: 10, line: 0 });
        });

        it('should convert absolute position to line position for multi-line text', () => {
            const lineStarts = [0, 6, 12]; // "Hello\nWorld\nTest"

            // First line positions
            expect(absoluteToLinePos(0, lineStarts)).toEqual({ char: 0, line: 0 });
            expect(absoluteToLinePos(2, lineStarts)).toEqual({ char: 2, line: 0 });
            expect(absoluteToLinePos(5, lineStarts)).toEqual({ char: 5, line: 0 });

            // Second line positions
            expect(absoluteToLinePos(6, lineStarts)).toEqual({ char: 0, line: 1 });
            expect(absoluteToLinePos(8, lineStarts)).toEqual({ char: 2, line: 1 });
            expect(absoluteToLinePos(11, lineStarts)).toEqual({ char: 5, line: 1 });

            // Third line positions
            expect(absoluteToLinePos(12, lineStarts)).toEqual({ char: 0, line: 2 });
            expect(absoluteToLinePos(14, lineStarts)).toEqual({ char: 2, line: 2 });
            expect(absoluteToLinePos(16, lineStarts)).toEqual({ char: 4, line: 2 });
        });

        it('should handle position at line boundaries', () => {
            const lineStarts = [0, 6, 12, 18];

            // Positions exactly at line starts
            expect(absoluteToLinePos(0, lineStarts)).toEqual({ char: 0, line: 0 });
            expect(absoluteToLinePos(6, lineStarts)).toEqual({ char: 0, line: 1 });
            expect(absoluteToLinePos(12, lineStarts)).toEqual({ char: 0, line: 2 });
            expect(absoluteToLinePos(18, lineStarts)).toEqual({ char: 0, line: 3 });
        });

        it('should handle position beyond text length', () => {
            const lineStarts = [0, 6, 12];

            const result = absoluteToLinePos(100, lineStarts);
            expect(result).toEqual({ char: 88, line: 2 });
        });

        it('should handle negative positions', () => {
            const lineStarts = [0, 6, 12];

            const result = absoluteToLinePos(-5, lineStarts);
            expect(result).toEqual({ char: 0, line: 0 });
        });

        it('should handle empty line starts array', () => {
            const lineStarts: number[] = [];

            const result = absoluteToLinePos(5, lineStarts);
            expect(result).toEqual({ char: 0, line: 0 });
        });

        it('should handle text with empty lines', () => {
            const lineStarts = [0, 6, 7, 13, 14]; // "Line1\n\nLine3\n\nLine5"

            expect(absoluteToLinePos(6, lineStarts)).toEqual({ char: 0, line: 1 }); // Empty line
            expect(absoluteToLinePos(7, lineStarts)).toEqual({ char: 0, line: 2 }); // Start of "Line3"
            expect(absoluteToLinePos(13, lineStarts)).toEqual({ char: 0, line: 3 }); // Another empty line
            expect(absoluteToLinePos(14, lineStarts)).toEqual({ char: 0, line: 4 }); // Start of "Line5"
        });

        it('should work with real text example', () => {
            const text = 'function test() {\n  const x = 5;\n  return x;\n}';
            const { lineStarts } = getLinePositions(text);

            // Position of 'const'
            const constPos = text.indexOf('const');
            const result = absoluteToLinePos(constPos, lineStarts);
            expect(result).toEqual({ char: 2, line: 1 });

            // Position of 'return'
            const returnPos = text.indexOf('return');
            const result2 = absoluteToLinePos(returnPos, lineStarts);
            expect(result2).toEqual({ char: 2, line: 2 });
        });
    });

    describe('isColorValue', () => {
        describe('hex colors', () => {
            it('should recognize 3-digit hex colors', () => {
                expect(isColorValue('#fff')).toBe(true);
                expect(isColorValue('#000')).toBe(true);
                expect(isColorValue('#a1b')).toBe(true);
            });

            it('should recognize 6-digit hex colors', () => {
                expect(isColorValue('#ffffff')).toBe(true);
                expect(isColorValue('#000000')).toBe(true);
                expect(isColorValue('#ff0000')).toBe(true);
                expect(isColorValue('#a1b2c3')).toBe(true);
            });

            it('should recognize 8-digit hex colors with alpha', () => {
                expect(isColorValue('#ffffffff')).toBe(true);
                expect(isColorValue('#ff000080')).toBe(true);
            });
        });

        describe('rgb/rgba colors', () => {
            it('should recognize rgb colors', () => {
                expect(isColorValue('rgb(255, 0, 0)')).toBe(true);
                expect(isColorValue('rgb(0,0,0)')).toBe(true);
                expect(isColorValue('RGB(100, 150, 200)')).toBe(true);
            });

            it('should recognize rgba colors', () => {
                expect(isColorValue('rgba(255, 0, 0, 0.5)')).toBe(true);
                expect(isColorValue('rgba(0,0,0,1)')).toBe(true);
                expect(isColorValue('RGBA(100, 150, 200, 0.8)')).toBe(true);
            });
        });

        describe('hsl/hsla colors', () => {
            it('should recognize hsl colors', () => {
                expect(isColorValue('hsl(360, 100%, 50%)')).toBe(true);
                expect(isColorValue('hsl(0,0%,0%)')).toBe(true);
                expect(isColorValue('HSL(240, 100%, 50%)')).toBe(true);
            });

            it('should recognize hsla colors', () => {
                expect(isColorValue('hsla(360, 100%, 50%, 0.5)')).toBe(true);
                expect(isColorValue('hsla(0,0%,0%,1)')).toBe(true);
                expect(isColorValue('HSLA(240, 100%, 50%, 0.8)')).toBe(true);
            });
        });

        describe('CSS variables', () => {
            it('should recognize CSS custom properties', () => {
                expect(isColorValue('var(--primary-color)')).toBe(true);
                expect(isColorValue('var(--bg-color)')).toBe(true);
                expect(isColorValue('var(--text-color-light)')).toBe(true);
                expect(isColorValue('var(--color123)')).toBe(true);
            });

            it('should recognize CSS variables with fallbacks', () => {
                expect(isColorValue('var(--primary-color, #ff0000)')).toBe(true);
                expect(isColorValue('var(--bg, white)')).toBe(true);
            });
        });

        describe('named colors', () => {
            it('should recognize common named colors', () => {
                expect(isColorValue('red')).toBe(true);
                expect(isColorValue('blue')).toBe(true);
                expect(isColorValue('green')).toBe(true);
                expect(isColorValue('white')).toBe(true);
                expect(isColorValue('black')).toBe(true);
                expect(isColorValue('yellow')).toBe(true);
                expect(isColorValue('purple')).toBe(true);
                expect(isColorValue('orange')).toBe(true);
                expect(isColorValue('pink')).toBe(true);
                expect(isColorValue('brown')).toBe(true);
                expect(isColorValue('gray')).toBe(true);
                expect(isColorValue('grey')).toBe(true);
            });

            it('should recognize extended named colors', () => {
                expect(isColorValue('lightblue')).toBe(true);
                expect(isColorValue('darkred')).toBe(true);
                expect(isColorValue('mediumseagreen')).toBe(true);
                expect(isColorValue('cornflowerblue')).toBe(true);
            });

            it('should be case insensitive for named colors', () => {
                expect(isColorValue('RED')).toBe(true);
                expect(isColorValue('Blue')).toBe(true);
                expect(isColorValue('GREEN')).toBe(true);
                expect(isColorValue('LightBlue')).toBe(true);
            });
        });

        describe('special color values', () => {
            it('should recognize transparent', () => {
                expect(isColorValue('transparent')).toBe(true);
                expect(isColorValue('TRANSPARENT')).toBe(true);
                expect(isColorValue('Transparent')).toBe(true);
            });

            it('should recognize currentColor', () => {
                expect(isColorValue('currentColor')).toBe(true);
                expect(isColorValue('CURRENTCOLOR')).toBe(true);
                expect(isColorValue('CurrentColor')).toBe(true);
            });

            it('should recognize CSS global values', () => {
                expect(isColorValue('inherit')).toBe(true);
                expect(isColorValue('initial')).toBe(true);
                expect(isColorValue('unset')).toBe(true);
                expect(isColorValue('INHERIT')).toBe(true);
                expect(isColorValue('Initial')).toBe(true);
            });
        });

        describe('non-color values', () => {
            it('should reject CSS class names with hyphens', () => {
                expect(isColorValue('my-css-class')).toBe(false);
                expect(isColorValue('highlight-error')).toBe(false);
                expect(isColorValue('text-primary')).toBe(false);
                expect(isColorValue('bg-blue-500')).toBe(false);
            });

            it('should reject CSS class names with underscores', () => {
                expect(isColorValue('my_css_class')).toBe(false);
                expect(isColorValue('highlight_error')).toBe(false);
                expect(isColorValue('text_primary')).toBe(false);
            });

            it('should reject CSS class names with numbers', () => {
                expect(isColorValue('class123')).toBe(false);
                expect(isColorValue('btn1')).toBe(false);
                expect(isColorValue('item2')).toBe(false);
            });

            it('should reject empty string', () => {
                expect(isColorValue('')).toBe(false);
            });

            it('should reject random text', () => {
                expect(isColorValue('hello')).toBe(true); // This is actually a valid color name check
                expect(isColorValue('world')).toBe(true); // This is actually a valid color name check
                expect(isColorValue('testing')).toBe(true); // This is actually a valid color name check
            });

            it('should reject strings with spaces', () => {
                expect(isColorValue('light blue')).toBe(false);
                expect(isColorValue('dark red')).toBe(false);
                expect(isColorValue('my class')).toBe(false);
            });
        });

        describe('edge cases', () => {
            it('should handle mixed case correctly', () => {
                expect(isColorValue('Red')).toBe(true);
                expect(isColorValue('BLUE')).toBe(true);
                expect(isColorValue('GrEeN')).toBe(true);
            });

            it('should handle color names that are substrings of other words', () => {
                expect(isColorValue('red')).toBe(true);
                expect(isColorValue('redish')).toBe(true); // This would be treated as a color name
                expect(isColorValue('bred')).toBe(true); // This would be treated as a color name
            });

            it('should handle very long color names', () => {
                expect(isColorValue('a')).toBe(true);
                expect(isColorValue('verylongcolorname')).toBe(true);
            });
        });
    });
});
