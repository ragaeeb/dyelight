import { describe, expect, it, mock } from 'bun:test';

type UseStateSetter<T> = (value: T) => void;

type MockedReactState<T> = { lastSet?: T };

const state: MockedReactState<number | undefined> = {};

await mock.restore();
await mock.module('react', () => ({
    useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    useRef: <T,>(value: T) => ({ current: value }),
    useState: (initial: number | undefined): [number | undefined, UseStateSetter<number | undefined>] => {
        state.lastSet = initial;
        return [
            initial,
            (value: number | undefined) => {
                state.lastSet = value;
            },
        ];
    },
}));

const { createAutoResizeHandler, useAutoResize } = await import('./useAutoResize');

global.getComputedStyle = (() => {
    return { borderBottomWidth: '0px', borderTopWidth: '0px' };
}) as unknown as typeof getComputedStyle;

describe('createAutoResizeHandler', () => {
    it('updates height when auto resize is enabled', () => {
        const heights: Array<number | undefined> = [];
        const resizeCalls: HTMLTextAreaElement[] = [];
        const handler = createAutoResizeHandler(
            true,
            (height) => heights.push(height),
            (element) => {
                resizeCalls.push(element);
                element.style.height = `${element.scrollHeight}px`;
            },
        );

        const textarea = {
            scrollHeight: 120,
            style: { height: '' } as Record<string, string>,
        } as unknown as HTMLTextAreaElement;

        handler(textarea);

        expect(resizeCalls.length).toBe(1);
        expect(textarea.style.height).toBe('120px');
        expect(heights).toEqual([120]);
    });

    it('skips updates when disabled', () => {
        const heights: Array<number | undefined> = [];
        const handler = createAutoResizeHandler(false, (height) => heights.push(height));
        const textarea = {
            scrollHeight: 200,
            style: { height: '' } as Record<string, string>,
        } as unknown as HTMLTextAreaElement;

        handler(textarea);

        expect(textarea.style.height).toBe('');
        expect(heights.length).toBe(0);
    });
});

describe('useAutoResize', () => {
    it('provides stable API surface', () => {
        state.lastSet = undefined;
        const { handleAutoResize, textareaHeight } = useAutoResize(true);
        expect(typeof handleAutoResize).toBe('function');
        expect(textareaHeight).toBeUndefined();

        const textarea = {
            scrollHeight: 80,
            style: { height: '' } as Record<string, string>,
        } as unknown as HTMLTextAreaElement;

        handleAutoResize(textarea);
        expect(state.lastSet).toBe(80);
    });
});
