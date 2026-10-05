import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures/cabinet';

for (const width of [375, 1440]) {
  test(`cabinet menu logs out with keyboard and clears the browser session at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/cabinet');
    await expect(page.getByRole('heading', { name: 'Мои карты' })).toBeVisible();
    await page.getByRole('button', { name: 'Меню пользователя' }).click();
    const logout = page.getByRole('menuitem', { name: 'Выйти на этом устройстве', exact: true });
    await expect(logout).toBeVisible();
    await logout.focus();
    await expect(logout).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/logout-menu-${width}.png`, fullPage: true });
    const response = page.waitForResponse((response) => response.url().endsWith('/auth/logout'));
    await page.keyboard.press('Enter');
    expect((await response).status()).toBe(204);
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
    expect((await context.cookies()).some((cookie) => cookie.name === 'atlas_session')).toBe(false);
    await page.goto('/cabinet');
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole('heading', { name: 'Мои карты' })).toHaveCount(0);
  });
}

test('failed menu logout shows an error and allows retry', async ({ page }) => {
  let attempts = 0;
  await page.route('**/auth/logout', (route) => {
    attempts++;
    return attempts === 1 ? route.fulfill({ status: 503, body: 'unavailable' }) : route.continue();
  });
  await page.goto('/cabinet');
  await expect(page.getByRole('heading', { name: 'Мои карты' })).toBeVisible();
  await page.getByRole('button', { name: 'Меню пользователя' }).click();
  const logout = page.getByRole('menuitem', { name: 'Выйти на этом устройстве', exact: true });
  await logout.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Сервис временно недоступен' })).toBeVisible();
  await expect(page).toHaveURL(/\/cabinet$/);
  await logout.click();
  await expect(page).toHaveURL(/\/account$/);
  expect(attempts).toBe(2);
});
