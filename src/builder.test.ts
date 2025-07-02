import { describe, expect, it } from 'bun:test';

import { HighlightBuilder } from './builder';

describe('builder', () => {
    describe('characters', () => {
        it('should create character highlights with className', () => {
            const result = HighlightBuilder.characters([
                { className: 'highlight-error', index: 5 },
                { className: 'highlight-warning', index: 10 },
            ]);

            expect(result).toEqual([
                { className: 'highlight-error', end: 6, start: 5, style: undefined },
                { className: 'highlight-warning', end: 11, start: 10, style: undefined },
            ]);
        });

        it('should create character highlights with inline styles', () => {
            const style = { backgroundColor: 'yellow', color: 'red' };
            const result = HighlightBuilder.characters([
                { index: 0, style },
                { index: 15, style: { fontWeight: 'bold' } },
            ]);

            expect(result).toEqual([
                { className: undefined, end: 1, start: 0, style },
                { className: undefined, end: 16, start: 15, style: { fontWeight: 'bold' } },
            ]);
        });

        it('should create character highlights with both className and style', () => {
            const result = HighlightBuilder.characters([
                { className: 'test-class', index: 7, style: { color: 'blue' } },
            ]);

            expect(result).toEqual([{ className: 'test-class', end: 8, start: 7, style: { color: 'blue' } }]);
        });

        it('should handle empty array', () => {
            const result = HighlightBuilder.characters([]);
            expect(result).toEqual([]);
        });

        it('should handle character at index 0', () => {
            const result = HighlightBuilder.characters([{ className: 'first-char', index: 0 }]);

            expect(result).toEqual([{ className: 'first-char', end: 1, start: 0, style: undefined }]);
        });

        it('should create highlights for large indices', () => {
            const result = HighlightBuilder.characters([{ className: 'large-index', index: 1000 }]);

            expect(result).toEqual([{ className: 'large-index', end: 1001, start: 1000, style: undefined }]);
        });
    });

    describe('lines', () => {
        it('should create line highlights with className', () => {
            const result = HighlightBuilder.lines([
                { className: 'error-line', line: 0 },
                { className: 'warning-line', line: 2 },
            ]);

            expect(result).toEqual({
                0: 'error-line',
                2: 'warning-line',
            });
        });

        it('should create line highlights with color', () => {
            const result = HighlightBuilder.lines([
                { color: '#ffff00', line: 1 },
                { color: 'red', line: 3 },
            ]);

            expect(result).toEqual({
                1: '#ffff00',
                3: 'red',
            });
        });

        it('should prefer className over color when both are provided', () => {
            const result = HighlightBuilder.lines([{ className: 'my-class', color: '#ff0000', line: 0 }]);

            expect(result).toEqual({
                0: 'my-class',
            });
        });

        it('should use color when className is not provided', () => {
            const result = HighlightBuilder.lines([{ color: 'blue', line: 1 }]);

            expect(result).toEqual({
                1: 'blue',
            });
        });

        it('should handle empty array', () => {
            const result = HighlightBuilder.lines([]);
            expect(result).toEqual({});
        });

        it('should use empty string when neither className nor color is provided', () => {
            const result = HighlightBuilder.lines([{ line: 0 }]);

            expect(result).toEqual({
                0: '',
            });
        });

        it('should handle multiple lines with mixed configurations', () => {
            const result = HighlightBuilder.lines([
                { className: 'class1', line: 0 },
                { color: 'yellow', line: 1 },
                { line: 2 },
                { className: 'class3', color: 'ignored', line: 3 },
            ]);

            expect(result).toEqual({
                0: 'class1',
                1: 'yellow',
                2: '',
                3: 'class3',
            });
        });
    });

    describe('pattern', () => {
        it('should highlight text matching a RegExp pattern', () => {
            const text = 'function test() { const x = 5; }';
            const pattern = /\b(function|const)\b/g;
            const result = HighlightBuilder.pattern(text, pattern, 'keyword');

            expect(result).toEqual([
                { className: 'keyword', end: 8, start: 0, style: undefined },
                { className: 'keyword', end: 23, start: 18, style: undefined },
            ]);
        });

        it('should highlight text matching a string pattern', () => {
            const text = 'hello world hello';
            const result = HighlightBuilder.pattern(text, 'hello', 'greeting');

            expect(result).toEqual([
                { className: 'greeting', end: 5, start: 0, style: undefined },
                { className: 'greeting', end: 17, start: 12, style: undefined },
            ]);
        });

        it('should work with inline styles', () => {
            const text = 'test test';
            const style = { backgroundColor: 'yellow' };
            const result = HighlightBuilder.pattern(text, /test/g, undefined, style);

            expect(result).toEqual([
                { className: undefined, end: 4, start: 0, style },
                { className: undefined, end: 9, start: 5, style },
            ]);
        });

        it('should work with both className and style', () => {
            const text = 'abc abc';
            const style = { color: 'red' };
            const result = HighlightBuilder.pattern(text, /abc/g, 'test-class', style);

            expect(result).toEqual([
                { className: 'test-class', end: 3, start: 0, style },
                { className: 'test-class', end: 7, start: 4, style },
            ]);
        });

        it('should return empty array when no matches found', () => {
            const text = 'hello world';
            const result = HighlightBuilder.pattern(text, /xyz/g, 'not-found');

            expect(result).toEqual([]);
        });

        it('should handle empty text', () => {
            const result = HighlightBuilder.pattern('', /test/g, 'empty');
            expect(result).toEqual([]);
        });

        it('should handle overlapping matches correctly', () => {
            const text = 'aaaa';
            const result = HighlightBuilder.pattern(text, /aa/g, 'overlap');

            expect(result).toEqual([
                { className: 'overlap', end: 2, start: 0, style: undefined },
                { className: 'overlap', end: 4, start: 2, style: undefined },
            ]);
        });

        it('should preserve original RegExp flags when converting from string', () => {
            const text = 'Test TEST test';
            const result = HighlightBuilder.pattern(text, 'test', 'case-sensitive');

            // String patterns are converted to global RegExp, should only match lowercase
            expect(result).toEqual([{ className: 'case-sensitive', end: 14, start: 10, style: undefined }]);
        });
    });

    describe('ranges', () => {
        it('should create range highlights with className', () => {
            const result = HighlightBuilder.ranges([
                { className: 'title-highlight', end: 5, start: 0 },
                { className: 'content-highlight', end: 20, start: 10 },
            ]);

            expect(result).toEqual([
                { className: 'title-highlight', end: 5, start: 0, style: undefined },
                { className: 'content-highlight', end: 20, start: 10, style: undefined },
            ]);
        });

        it('should create range highlights with inline styles', () => {
            const style1 = { backgroundColor: 'yellow' };
            const style2 = { color: 'red', fontWeight: 'bold' };
            const result = HighlightBuilder.ranges([
                { end: 15, start: 5, style: style1 },
                { end: 25, start: 20, style: style2 },
            ]);

            expect(result).toEqual([
                { className: undefined, end: 15, start: 5, style: style1 },
                { className: undefined, end: 25, start: 20, style: style2 },
            ]);
        });

        it('should create range highlights with both className and style', () => {
            const style = { textDecoration: 'underline' };
            const result = HighlightBuilder.ranges([{ className: 'mixed', end: 3, start: 1, style }]);

            expect(result).toEqual([{ className: 'mixed', end: 3, start: 1, style }]);
        });

        it('should handle empty array', () => {
            const result = HighlightBuilder.ranges([]);
            expect(result).toEqual([]);
        });

        it('should handle zero-length ranges', () => {
            const result = HighlightBuilder.ranges([{ className: 'cursor', end: 5, start: 5 }]);

            expect(result).toEqual([{ className: 'cursor', end: 5, start: 5, style: undefined }]);
        });

        it('should handle large ranges', () => {
            const result = HighlightBuilder.ranges([{ className: 'entire-document', end: 1000, start: 0 }]);

            expect(result).toEqual([{ className: 'entire-document', end: 1000, start: 0, style: undefined }]);
        });
    });

    describe('selection', () => {
        it('should create a single selection highlight with className', () => {
            const result = HighlightBuilder.selection(10, 25, 'selection-highlight');

            expect(result).toEqual([{ className: 'selection-highlight', end: 25, start: 10, style: undefined }]);
        });

        it('should create a single selection highlight with inline style', () => {
            const style = { backgroundColor: 'lightblue' };
            const result = HighlightBuilder.selection(5, 15, undefined, style);

            expect(result).toEqual([{ className: undefined, end: 15, start: 5, style }]);
        });

        it('should create a single selection highlight with both className and style', () => {
            const style = { border: '1px solid red' };
            const result = HighlightBuilder.selection(0, 10, 'selected', style);

            expect(result).toEqual([{ className: 'selected', end: 10, start: 0, style }]);
        });

        it('should handle zero-length selection', () => {
            const result = HighlightBuilder.selection(7, 7, 'cursor');

            expect(result).toEqual([{ className: 'cursor', end: 7, start: 7, style: undefined }]);
        });

        it('should handle selection at beginning of text', () => {
            const result = HighlightBuilder.selection(0, 5, 'start-selection');

            expect(result).toEqual([{ className: 'start-selection', end: 5, start: 0, style: undefined }]);
        });

        it('should handle large selection range', () => {
            const result = HighlightBuilder.selection(100, 2000, 'large-selection');

            expect(result).toEqual([{ className: 'large-selection', end: 2000, start: 100, style: undefined }]);
        });
    });

    describe('words', () => {
        it('should highlight specific words with className', () => {
            const text = 'function test() { const x = let y = var z; }';
            const words = ['function', 'const', 'let', 'var'];
            const result = HighlightBuilder.words(text, words, 'keyword');

            expect(result).toEqual([
                { className: 'keyword', end: 8, start: 0, style: undefined },
                { className: 'keyword', end: 23, start: 18, style: undefined },
                { className: 'keyword', end: 31, start: 28, style: undefined },
                { className: 'keyword', end: 39, start: 36, style: undefined },
            ]);
        });

        it('should highlight words with inline styles', () => {
            const text = 'TODO: fix this FIXME later';
            const words = ['TODO', 'FIXME'];
            const style = { backgroundColor: 'orange', fontWeight: 'bold' };
            const result = HighlightBuilder.words(text, words, undefined, style);

            expect(result).toEqual([
                { className: undefined, end: 4, start: 0, style },
                { className: undefined, end: 20, start: 15, style },
            ]);
        });

        it('should highlight words with both className and style', () => {
            const text = 'NOTE: important information';
            const words = ['NOTE'];
            const style = { color: 'blue' };
            const result = HighlightBuilder.words(text, words, 'note-class', style);

            expect(result).toEqual([{ className: 'note-class', end: 4, start: 0, style }]);
        });

        it('should only match whole words', () => {
            const text = 'function functionality';
            const words = ['function'];
            const result = HighlightBuilder.words(text, words, 'keyword');

            // Should only match the first "function", not the "function" in "functionality"
            expect(result).toEqual([{ className: 'keyword', end: 8, start: 0, style: undefined }]);
        });

        it('should handle words not found in text', () => {
            const text = 'hello world';
            const words = ['foo', 'bar'];
            const result = HighlightBuilder.words(text, words, 'not-found');

            expect(result).toEqual([]);
        });

        it('should handle case-sensitive matching', () => {
            const text = 'Test test TEST';
            const words = ['test'];
            const result = HighlightBuilder.words(text, words, 'lowercase');

            // Should only match the lowercase "test"
            expect(result).toEqual([{ className: 'lowercase', end: 9, start: 5, style: undefined }]);
        });

        it('should handle multiple occurrences of the same word', () => {
            const text = 'return value; return null; return undefined;';
            const words = ['return'];
            const result = HighlightBuilder.words(text, words, 'return-keyword');

            expect(result).toEqual([
                { className: 'return-keyword', end: 6, start: 0, style: undefined },
                { className: 'return-keyword', end: 20, start: 14, style: undefined },
                { className: 'return-keyword', end: 33, start: 27, style: undefined },
            ]);
        });

        it('should handle empty text', () => {
            const words = ['test'];
            const result = HighlightBuilder.words('', words, 'empty-text');

            expect(result).toEqual([]);
        });
    });
});
