import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  test(`profile email verification and reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    let linked = false;
    await page.route('**/auth/profile/email', async (route) =>
      route.fulfill({ json: { email: linked ? 'person@example.com' : '', verified: linked } }),
    );
    await page.route('**/v1/tenants/atlas/auth/transactions', async (route) => {
      expect(route.request().postDataJSON()).toEqual({ intent: 'INTENT_UPDATE' });
      await route.fulfill({
        json: {
          transaction: {
            id: 'email-link',
            status: 'active',
            availableMethods: [{ methodId: 'email_code', requirementId: 'primary' }],
          },
        },
      });
    });
    await page.route('**/*:startMethod', async (route) =>
      route.fulfill({
        json: {
          transaction: { pendingAttempt: { attemptId: 'attempt', challengeId: 'challenge' } },
          challenge: { expiresAt: new Date(Date.now() + 300000).toISOString() },
        },
      }),
    );
    await page.route('**/*:verifyMethod', async (route) => {
      expect(route.request().postDataJSON()).toMatchObject({
        attemptId: 'attempt',
        challengeId: 'challenge',
        input: { code: '123456' },
      });
      linked = true;
      await route.fulfill({
        json: { transaction: { status: 'completed' }, result: { principal: { userId: 'original' } } },
      });
    });
    await page.goto('/cabinet/profile');
    await page.getByRole('button', { name: 'Добавить email' }).focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Электронная почта' }).fill('person@example.com');
    await dialog.getByRole('button', { name: 'Продолжить с email' }).click();
    await dialog.getByRole('textbox', { name: 'Код из письма' }).fill('123456');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/profile-email-code-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await dialog.getByRole('button', { name: 'Подтвердить код' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('person@example.com', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Добавить email' })).toHaveCount(0);
    await page.screenshot({
      path: `artifacts/screenshots/profile-email-verified-${width}.png`,
      fullPage: true,
    });
    await page.reload();
    await expect(page.getByText('person@example.com', { exact: true })).toBeVisible();
  });
}

test('profile email session rejection closes the private view', async ({ page }) => {
  let expired = false;
  await page.route('**/client', async (route) => {
    if (expired) await route.fulfill({ status: 401, body: 'authentication required' });
    else await route.continue();
  });
  await page.route('**/auth/profile/email', async (route) => {
    expired = true;
    await route.fulfill({ status: 401, body: 'authentication required' });
  });
  await page.goto('/cabinet/profile');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('button', { name: 'Добавить email' })).toHaveCount(0);
});
