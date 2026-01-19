import { describe, expect, it } from 'bun:test';

import { createLineElement, DyeLight, renderHighlightedLine } from './DyeLight';

describe('createLineElement', () => {
    it('returns element with class when highlight is class name', () => {
        const element = createLineElement('content', 0, 'line-class');
        expect(element.type).toBe('div');
        expect((element.props as any).className).toBe('line-class');
    });

    it('applies inline style when highlight is color value', () => {
        const element = createLineElement('content', 1, 'rgba(0,0,0,0.1)');
        expect((element.props as any).style).toEqual({ backgroundColor: 'rgba(0,0,0,0.1)' });
    });
});

describe('renderHighlightedLine', () => {
    it('creates spans for highlight ranges and preserves ordering', () => {
        const line = 'Hello world';
        const ranges = [
            { className: 'secondary', end: 11, start: 6 },
            { className: 'primary', end: 5, start: 0 },
        ];

        const element = renderHighlightedLine(line, 0, ranges, undefined);
        const children = Array.isArray((element.props as any).children)
            ? ((element.props as any).children as any[])
            : [(element.props as any).children];
        const spans = children.filter((child) => child && child.type === 'span');

        expect(spans[0]?.props.className).toBe('primary');
        expect(spans[0]?.props.children).toBe('Hello');
        expect(spans[1]?.props.className).toBe('secondary');
        expect(spans[1]?.props.children).toBe('world');
    });

    it('does not duplicate text when highlight ranges overlap', () => {
        const line = 'Questioner';
        const ranges = [
            { className: 'outer', end: 10, start: 0 },
            { className: 'inner', end: 10, start: 7 },
        ];

        const element = renderHighlightedLine(line, 0, ranges, undefined);
        const children = Array.isArray((element.props as any).children)
            ? ((element.props as any).children as any[])
            : [(element.props as any).children];

        const flattenText = (child: any) => {
            if (typeof child === 'string') {
                return child;
            }
            if (child?.props?.children) {
                return child.props.children as string;
            }
            return '';
        };

        const renderedText = children.map(flattenText).join('');
        expect(renderedText).toBe(line);
    });
});

describe('DyeLight metadata', () => {
    it('exposes displayName', () => {
        expect(DyeLight.displayName).toBe('DyeLight');
    });
});
