import { expect, test } from '@playwright/test';

type MarkerRect = {
    height: number;
    width: number;
    x: number;
    y: number;
} | null;

const cases = [
    {
        text: 'alpha ظرف (adverbial) boundary',
        token: 'ظرف',
    },
    {
        text: 'English قبل punctuation, token',
        token: 'قبل',
    },
    {
        text: 'value 123 رقم and digits',
        token: 'رقم',
    },
    {
        text: 'diacritics مُدَرِّس around boundary',
        token: 'مُدَرِّس',
    },
];

test('mixed-script bidi matrix double-click maps to expected token', async ({ page }) => {
    await page.goto('/e2e/harness/index.html');
    await page.waitForFunction(() => Boolean((window as any).__dyelightHarness));

    for (const scenario of cases) {
        await page.evaluate(
            ({ text, token }) => {
                (window as any).__dyelightHarness.setBidiCase(text, token);
            },
            { text: scenario.text, token: scenario.token },
        );

        await page.waitForFunction(() => {
            const rect = (window as any).__dyelightHarness.getArabicMarkerRect() as MarkerRect;
            return Boolean(rect);
        });

        const markerRect = await page.evaluate(() => (window as any).__dyelightHarness.getArabicMarkerRect() as MarkerRect);
        expect(markerRect).not.toBeNull();
        if (!markerRect) {
            throw new Error('Marker rect missing');
        }

        await page.mouse.dblclick(markerRect.x + markerRect.width / 2, markerRect.y + markerRect.height / 2);

        await page.waitForFunction(() => {
            const selected = (window as any).__dyelightHarness.getBidiSelectionText() as string;
            return selected.length > 0;
        });

        const selectedText = await page.evaluate(() => (window as any).__dyelightHarness.getBidiSelectionText() as string);
        expect(selectedText).toContain(scenario.token);
    }
});
