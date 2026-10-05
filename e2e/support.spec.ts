import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';

for (const width of [375, 1440]) {
  test(`configured Telegram support at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/v1/support', (route) =>
      route.fulfill({ json: { telegramUrl: 'https://t.me/atlas_support' } }),
    );
    await page.goto('/cabinet/support');
    const dialog = page.getByRole('dialog');
    const link = dialog.getByRole('link');
    await expect(link).toHaveAttribute('href', 'https://t.me/atlas_support');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect
      .poll(() =>
        link.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
    await link.focus();
    await expect(link).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/support-${width}.png`, fullPage: true });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
}
