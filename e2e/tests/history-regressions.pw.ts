import { expect, test } from '@playwright/test';

type SelectionSnapshot = {
    end: number;
    selectedText: string;
    start: number;
};

type ValueSnapshot = {
    domValue: string;
    stateValue: string;
};

type OverlaySnapshot = {
    overlayValue: string;
    textareaValue: string;
};

type GeometryMetrics = {
    contentWidthDelta: number;
    overlayContentWidth: number;
    overlayScrollTop: number;
    scrollTopDelta: number;
    textareaContentWidth: number;
    textareaHasVerticalScrollbar: boolean;
    textareaScrollTop: number;
} | null;

test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/harness/index.html');
    await page.waitForFunction(() => Boolean((window as any).__dyelightHarness));
});

test('programmatic setValue keeps immediate selection stable', async ({ page }) => {
    const text = 'Programmatic value with Arabic ظرف and trailing marker';
    const start = text.indexOf('ظرف');
    const end = start + 'ظرف'.length;

    const payload: [string, number, number] = [text, start, end];
    await page.evaluate(([value, from, to]: [string, number, number]) => {
        (window as any).__dyelightHarness.programmaticSetValueAndSelect(value, from, to);
    }, payload);

    await page.waitForFunction(([expectedStart, expectedEnd]) => {
        const selection = (window as any).__dyelightHarness.getProgrammaticSelectionSnapshot() as SelectionSnapshot;
        return (
            selection.start === expectedStart &&
            selection.end === expectedEnd &&
            selection.selectedText === 'ظرف'
        );
    }, [start, end]);

    const selection = await page.evaluate(
        () => (window as any).__dyelightHarness.getProgrammaticSelectionSnapshot() as SelectionSnapshot,
    );

    expect(selection.start).toBe(start);
    expect(selection.end).toBe(end);
    expect(selection.selectedText).toBe('ظرف');
});

test('controlled normalization converges DOM to normalized prop under rapid edits', async ({ page }) => {
    const input = page.locator('#controlled-race-textarea');
    await input.click();
    await input.fill('alpha12@@beta34');

    await page.waitForFunction(() => {
        const snapshot = (window as any).__dyelightHarness.getControlledRaceSnapshot() as ValueSnapshot;
        return snapshot.domValue === snapshot.stateValue;
    });

    const snapshot = await page.evaluate(
        () => (window as any).__dyelightHarness.getControlledRaceSnapshot() as ValueSnapshot,
    );
    expect(snapshot.stateValue).toBe('alpha@beta');
    expect(snapshot.domValue).toBe('alpha@beta');
});

test('large paste path converges to normalized controlled value', async ({ page }) => {
    const large = `PASTE ${'x '.repeat(8000)}END`;

    await page.evaluate((text) => {
        (window as any).__dyelightHarness.pasteLargeText(text);
    }, large);

    await page.waitForFunction(() => {
        const snapshot = (window as any).__dyelightHarness.getPasteSnapshot() as ValueSnapshot;
        return (
            snapshot.domValue === snapshot.stateValue &&
            snapshot.stateValue.includes('PASTE') &&
            snapshot.stateValue.includes('END')
        );
    });

    const snapshot = await page.evaluate(() => (window as any).__dyelightHarness.getPasteSnapshot() as ValueSnapshot);
    expect(snapshot.stateValue.includes('PASTE')).toBeTruthy();
    expect(snapshot.stateValue.includes('END')).toBeTruthy();
    expect(snapshot.domValue).toBe(snapshot.stateValue);
});

test('uncontrolled DOM mutation keeps overlay text synchronized', async ({ page }) => {
    const mutated = 'Uncontrolled mutation with Arabic ظرف and extra line\nSecond line';
    const input = page.locator('#uncontrolled-textarea');
    await input.click();
    await input.fill(mutated);

    await page.waitForFunction(() => {
        const snapshot = (window as any).__dyelightHarness.getUncontrolledSnapshot() as OverlaySnapshot;
        return snapshot.textareaValue === snapshot.overlayValue;
    });

    const snapshot = await page.evaluate(
        () => (window as any).__dyelightHarness.getUncontrolledSnapshot() as OverlaySnapshot,
    );
    expect(snapshot.textareaValue).toBe(mutated);
    expect(snapshot.overlayValue).toBe(mutated);
});

test('overlapping highlight edits never duplicate rendered overlay text', async ({ page }) => {
    const updated = 'Questioner ظرف overlap check updated';
    await page.evaluate((value) => {
        (window as any).__dyelightHarness.setOverlapValue(value);
    }, updated);

    await page.waitForFunction(() => {
        const snapshot = (window as any).__dyelightHarness.getOverlapSnapshot() as OverlaySnapshot;
        return snapshot.textareaValue === snapshot.overlayValue;
    });

    const snapshot = await page.evaluate(() => (window as any).__dyelightHarness.getOverlapSnapshot() as OverlaySnapshot);
    expect(snapshot.overlayValue).toBe(updated);
    expect(snapshot.textareaValue).toBe(updated);
});

test('typing into highlighted overlap textarea does not duplicate characters', async ({ page }) => {
    const input = page.locator('#overlap-textarea');
    const typed = 'abc123ظرفXYZ';

    await input.click();
    await input.fill('');
    await input.pressSequentially(typed);

    await page.waitForFunction(() => {
        const snapshot = (window as any).__dyelightHarness.getOverlapSnapshot() as OverlaySnapshot;
        return snapshot.textareaValue === snapshot.overlayValue;
    });

    const snapshot = await page.evaluate(() => (window as any).__dyelightHarness.getOverlapSnapshot() as OverlaySnapshot);
    expect(snapshot.textareaValue).toBe(typed);
    expect(snapshot.overlayValue).toBe(typed);
});

test('selectionchange-driven scroll sync remains within tolerance', async ({ page }) => {
    await page.evaluate(() => (window as any).__dyelightHarness.setLongText());
    await page.waitForFunction(() => {
        const metrics = (window as any).__dyelightHarness.getGeometryMetrics() as GeometryMetrics;
        return Boolean(metrics?.textareaHasVerticalScrollbar);
    });

    await page.evaluate(() => (window as any).__dyelightHarness.scrollGeometryTo(240));
    await page.evaluate(() => (window as any).__dyelightHarness.selectGeometryRange(24, 72));

    await page.waitForFunction(() => {
        const metrics = (window as any).__dyelightHarness.getGeometryMetrics() as GeometryMetrics;
        return Boolean(metrics && Math.abs(metrics.scrollTopDelta) < 8.5);
    });

    const metrics = await page.evaluate(() => (window as any).__dyelightHarness.getGeometryMetrics() as GeometryMetrics);
    expect(metrics).not.toBeNull();
    if (!metrics) {
        throw new Error('Missing geometry metrics');
    }
    expect(Math.abs(metrics.scrollTopDelta)).toBeLessThan(8.5);
});
