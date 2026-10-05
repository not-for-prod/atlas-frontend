import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
for (const width of [375, 863, 864, 1119, 1120, 1140, 1280, 1440]) {
  test(`public pages share aligned containers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const gutter = width < 864 ? 16 : 24;
    const expectedLeft = Math.max(0, (width - 1120) / 2) + gutter;
    const expectedWidth = Math.min(width, 1120) - 2 * gutter;
    let headerHeight: number | undefined;
    for (const route of ['/', '/account']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      for (const selector of ['header', 'main', 'main > :first-child', 'footer']) {
        const bounds = await page.locator(selector).boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeCloseTo(expectedLeft, 1);
        expect(bounds!.width).toBeCloseTo(expectedWidth, 1);
      }
      const header = (await page.locator('header').boundingBox())!;
      if (headerHeight === undefined) headerHeight = header.height;
      expect(header.height).toBeCloseTo(headerHeight, 1);
      expect((await page.locator('main').boundingBox())!.y).toBeCloseTo(header.y + header.height + 8, 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Перейти к содержимому' })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('main')).toBeFocused();
      await page.locator('main').blur();
      await page.evaluate(() => window.scrollTo(0, 0));
      if (width === 375 || width === 1280) {
        await mkdir('artifacts/screenshots', { recursive: true });
        await page.screenshot({
          path: `artifacts/screenshots/public-layout-${route === '/' ? 'landing' : 'auth'}-${width}.png`,
        });
      }
    }
  });
}

for (const width of [1100, 1280]) {
  test(`short and scrolling pages retain container geometry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1400 });
    let landing: { x: number; width: number } | undefined;
    for (const route of ['/', '/account']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const bounds = (await page.locator('main').boundingBox())!;
      if (landing === undefined) landing = bounds;
      expect(bounds.x).toBeCloseTo(landing.x, 1);
      expect(bounds.width).toBeCloseTo(landing.width, 1);
      const scrolls = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight);
      expect(scrolls).toBe(route === '/');
    }
  });
}
