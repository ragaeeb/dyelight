import { describe, expect, it } from 'bun:test';

import { createLineElement, renderHighlightedLine, DyeLight } from './DyeLight';

describe('createLineElement', () => {
    it('returns element with class when highlight is class name', () => {
        const element = createLineElement('content', 0, 'line-class');
        expect(element.type).toBe('div');
        expect(element.props.className).toBe('line-class');
    });

    it('applies inline style when highlight is color value', () => {
        const element = createLineElement('content', 1, 'rgba(0,0,0,0.1)');
        expect(element.props.style).toEqual({ backgroundColor: 'rgba(0,0,0,0.1)' });
    });
});

describe('renderHighlightedLine', () => {
    it('creates spans for highlight ranges and preserves ordering', () => {
        const line = 'Hello world';
        const ranges = [
            { start: 6, end: 11, className: 'secondary' },
            { start: 0, end: 5, className: 'primary' },
        ];

        const element = renderHighlightedLine(line, 0, ranges, undefined);
        const children = Array.isArray(element.props.children)
            ? (element.props.children as any[])
            : [element.props.children];
        const spans = children.filter((child) => child && child.type === 'span');

        expect(spans[0]?.props.className).toBe('primary');
        expect(spans[0]?.props.children).toBe('Hello');
        expect(spans[1]?.props.className).toBe('secondary');
        expect(spans[1]?.props.children).toBe('world');
    });
});

describe('DyeLight metadata', () => {
    it('exposes displayName', () => {
        expect(DyeLight.displayName).toBe('DyeLight');
    });
});
