import { expect, test } from '@playwright/test';

type GeometryMetrics = {
    contentWidthDelta: number;
    overlayContentWidth: number;
    overlayScrollTop: number;
    scrollTopDelta: number;
    textareaContentWidth: number;
    textareaHasVerticalScrollbar: boolean;
    textareaScrollTop: number;
} | null;

const CONTENT_WIDTH_EPSILON = 0.51;
const SCROLL_TOP_EPSILON = 8.5;

const assertGeometryAligned = async (readMetrics: () => Promise<GeometryMetrics>) => {
    const metrics = await readMetrics();
    expect(metrics).not.toBeNull();

    if (!metrics) {
        throw new Error('Geometry metrics were unavailable.');
    }

    expect(Math.abs(metrics.contentWidthDelta)).toBeLessThan(CONTENT_WIDTH_EPSILON);
    expect(Math.abs(metrics.scrollTopDelta)).toBeLessThan(SCROLL_TOP_EPSILON);
};

test('overlay and textarea remain aligned across scrollbar and selection transitions', async ({ page }) => {
    await page.goto('/e2e/harness/index.html');
    await page.waitForFunction(() => Boolean((window as any).__dyelightHarness));

    const readMetrics = async () =>
        page.evaluate(() => (window as any).__dyelightHarness.getGeometryMetrics() as GeometryMetrics);

    await page.waitForFunction(() => {
        const metrics = (window as any).__dyelightHarness.getGeometryMetrics() as GeometryMetrics;
        return metrics !== null && Math.abs(metrics.contentWidthDelta) < 0.51;
    });

    await assertGeometryAligned(readMetrics);

    await page.evaluate(() => (window as any).__dyelightHarness.setLongText());
    await page.waitForFunction(() => {
        const metrics = (window as any).__dyelightHarness.getGeometryMetrics() as GeometryMetrics;
        return Boolean(
            metrics?.textareaHasVerticalScrollbar &&
                Math.abs((metrics?.contentWidthDelta ?? 1)) < 0.51,
        );
    });

    await assertGeometryAligned(readMetrics);

    await page.evaluate(() => (window as any).__dyelightHarness.scrollGeometryTo(240));
    await page.waitForFunction(() => {
        const metrics = (window as any).__dyelightHarness.getGeometryMetrics() as GeometryMetrics;
        return Boolean(
            metrics?.textareaScrollTop >= 200 &&
                Math.abs((metrics?.scrollTopDelta ?? 10_000)) < 8.5,
        );
    });

    await assertGeometryAligned(readMetrics);

    await page.evaluate(() => (window as any).__dyelightHarness.selectGeometryRange(24, 72));
    await page.waitForFunction(() => {
        const metrics = (window as any).__dyelightHarness.getGeometryMetrics() as GeometryMetrics;
        return (
            Math.abs(metrics?.contentWidthDelta ?? 1) < 0.51 &&
            Math.abs((metrics?.scrollTopDelta ?? 10_000)) < 8.5
        );
    });

    await assertGeometryAligned(readMetrics);

    await page.evaluate(() => (window as any).__dyelightHarness.setShortText());
    await page.waitForFunction(() => {
        const metrics = (window as any).__dyelightHarness.getGeometryMetrics() as GeometryMetrics;
        return Boolean(
            !metrics?.textareaHasVerticalScrollbar &&
                Math.abs((metrics?.contentWidthDelta ?? 1)) < 0.51 &&
                Math.abs((metrics?.scrollTopDelta ?? 10_000)) < 8.5,
        );
    });

    await assertGeometryAligned(readMetrics);
});
