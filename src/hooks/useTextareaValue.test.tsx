import { describe, expect, it, mock } from 'bun:test';

type UseStateSetter<T> = (value: T) => void;

type StateTracker = {
    lastSet?: string;
};

const state: StateTracker = {};

await mock.restore();
await mock.module('react', () => ({
    useState: (initial: string): [string, UseStateSetter<string>] => {
        state.lastSet = initial;
        return [initial, (value: string) => {
            state.lastSet = value;
        }];
    },
    useRef: <T,>(value: T) => ({ current: value }),
    useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    useEffect: () => undefined,
}));

const {
    applySetValue,
    handleChangeValue,
    handleInputValue,
    syncValueWithDOM,
    useTextareaValue,
} = await import('./useTextareaValue');

describe('textarea value helpers', () => {
    it('handleChangeValue updates uncontrolled state and notifies listeners', () => {
        const changes: string[] = [];
        handleChangeValue('next', false, (value) => changes.push(value), (value) => changes.push(`event:${value}`));
        expect(changes).toEqual(['next', 'event:next']);
    });

    it('handleInputValue respects controlled state', () => {
        const changes: string[] = [];
        handleInputValue('programmatic', 'current', true, () => changes.push('internal'), (value) => changes.push(value));
        expect(changes).toEqual(['programmatic']);
    });

    it('applySetValue writes to textarea and updates state', () => {
        const textarea = { value: 'start' } as unknown as HTMLTextAreaElement;
        const updates: string[] = [];
        applySetValue(textarea, 'set', false, (value) => updates.push(value), (value) => updates.push(`event:${value}`));
        expect(textarea.value).toBe('set');
        expect(updates).toEqual(['set', 'event:set']);
    });

    it('syncValueWithDOM mirrors DOM changes', () => {
        const textarea = { value: 'from-dom' } as unknown as HTMLTextAreaElement;
        const updates: string[] = [];
        syncValueWithDOM(textarea, 'state', false, (value) => updates.push(value), (value) => updates.push(`event:${value}`));
        expect(updates).toEqual(['from-dom', 'event:from-dom']);
    });
});

describe('useTextareaValue', () => {
    it('returns handlers and current value', () => {
        state.lastSet = undefined;
        const { currentValue, handleChange, handleInput, setValue, textareaRef } = useTextareaValue(undefined, 'initial');

        expect(currentValue).toBe('initial');
        expect(typeof handleChange).toBe('function');
        expect(typeof handleInput).toBe('function');
        expect(typeof setValue).toBe('function');
        expect(textareaRef.current).toBeNull();

        textareaRef.current = { value: 'initial' } as unknown as HTMLTextAreaElement;
        setValue('manual');
        expect(state.lastSet).toBe('manual');
    });
});
