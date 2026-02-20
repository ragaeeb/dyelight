import { expect, test } from '@playwright/test';

type BidiStyles = {
    line: string | null;
    overlay: string | null;
    span: string | null;
};

type MarkerRect = {
    height: number;
    width: number;
    x: number;
    y: number;
} | null;

test('double-clicking Arabic token keeps selection mapped to the Arabic word', async ({ page }) => {
    await page.goto('/e2e/harness/index.html');

    await page.waitForFunction(() => Boolean((window as any).__dyelightHarness));
    await page.waitForFunction(() => {
        const styles = (window as any).__dyelightHarness.getBidiComputedStyles();
        return Boolean(styles?.overlay && styles?.line && styles?.span);
    });

    const styles = await page.evaluate(() => (window as any).__dyelightHarness.getBidiComputedStyles() as BidiStyles);

    expect(styles.overlay).not.toBeNull();
    expect(styles.line).toBe(styles.overlay);
    expect(styles.span).toBe('normal');

    const markerRect = await page.evaluate(() => (window as any).__dyelightHarness.getArabicMarkerRect() as MarkerRect);
    expect(markerRect).not.toBeNull();

    if (!markerRect) {
        throw new Error('Arabic marker rectangle was not available.');
    }

    await page.mouse.dblclick(markerRect.x + markerRect.width / 2, markerRect.y + markerRect.height / 2);

    await page.waitForFunction(() => {
        const selected = (window as any).__dyelightHarness.getBidiSelectionText() as string;
        return selected.length > 0;
    });

    const selectedText = await page.evaluate(() => (window as any).__dyelightHarness.getBidiSelectionText() as string);

    expect(selectedText).toContain('ظرف');
    expect(selectedText).not.toContain('(ad');
});
