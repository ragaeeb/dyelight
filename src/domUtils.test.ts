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

        it('should include border height when borders are significant', () => {
            const originalGetComputedStyle = global.getComputedStyle;
            global.getComputedStyle = (() => ({
                borderBottomWidth: '2px',
                borderTopWidth: '2px',
            })) as unknown as typeof getComputedStyle;

            const textArea = { scrollHeight: 100, style: { height: '50px' } };
            autoResize(textArea as HTMLTextAreaElement);

            expect(textArea.style.height).toBe('104px'); // 100 + 2 + 2

            global.getComputedStyle = originalGetComputedStyle;
        });
    });
});
