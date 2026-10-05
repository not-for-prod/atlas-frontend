import { mkdir } from 'node:fs/promises';
import messages from '../dictionaries/ru.json';
import { test, expect } from './fixtures/cabinet';

for (const width of [375, 1440]) {
  test(`notification preference persists at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let enabled = true;
    await page.route('**/v1/notifications/settings', async (route) => {
      if (route.request().method() === 'PUT') {
        enabled = route.request().postDataJSON().enabled;
        await route.fulfill({ json: { enabled } });
        return;
      }
      await route.fulfill({ json: { enabled, telegramConnected: false, connectionAvailable: true } });
    });
    await page.goto('/cabinet');
    const dismiss = page.getByRole('button', { name: messages['notification.promo.close'] });
    await expect(dismiss).toBeVisible();
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/notifications-main-${width}.png`, fullPage: true });
    const promo = page.getByRole('link', { name: messages['notification.promo.title'], exact: true });
    await promo.focus();
    await expect(promo).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/cabinet\/profile$/);
    await page.goto('/cabinet');
    await dismiss.click();
    await expect(dismiss).toHaveCount(0);
    expect(enabled).toBe(false);
    await page.reload();
    await expect(
      page.getByRole('link', { name: messages['notification.promo.title'], exact: true }),
    ).toHaveCount(0);
    await page.goto('/cabinet/profile');
    const toggle = page.getByLabel(messages['cabinet.profile.events']);
    await expect(toggle).not.toBeChecked();
    await expect(
      page.getByRole('button', { name: messages['notification.connect'], exact: true }),
    ).toBeEnabled();
    await page.screenshot({
      path: `artifacts/screenshots/notifications-profile-${width}.png`,
      fullPage: true,
    });
    await toggle.click();
    await expect(toggle).toBeChecked();
    expect(enabled).toBe(true);
    await page.goto('/cabinet');
    await expect(dismiss).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}
