import { describe, expect, it } from 'bun:test';

import { autoResize } from './domUtils';

// Mock getComputedStyle for testing
global.getComputedStyle = (() => {
    return { borderBottomWidth: '0px', borderTopWidth: '0px' };
}) as unknown as typeof getComputedStyle;

describe('domUtils', () => {
    describe('autoResize', () => {
        it('should resize textarea to fit content', () => {
            const textArea = { scrollHeight: 150, style: { height: '50px' } };

            autoResize(textArea as HTMLTextAreaElement);

            expect(textArea.style.height).toBe('150px');
        });

        it('should handle textarea with zero scrollHeight', () => {
            const textArea = { scrollHeight: 0, style: { height: '50px' } };

            autoResize(textArea as HTMLTextAreaElement);

            expect(textArea.style.height).toBe('0px');
        });
    });
});
