import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  test(`profile KYC collection at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    let saved: Record<string, unknown> | undefined;
    await page.route('**/v1/kyc/level', async (route) => {
      await route.fulfill({ json: { level: 'KYC_LEVEL_UNVERIFIED' } });
    });
    await page.route('**/v1/kyc', async (route) => {
      if (route.request().method() === 'PUT') saved = route.request().postDataJSON().data;
      expect(route.request().method()).toBe('PUT');
      await route.fulfill({ json: { level: 'KYC_LEVEL_UNVERIFIED' } });
    });
    await page.goto('/cabinet/profile');
    await expect(page.getByText('Не подтверждён', { exact: true })).toBeVisible();
    const start = page.getByRole('button', { name: 'Начать верификацию' });
    await start.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(start).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Телефон', { exact: false })).toHaveCount(0);
    for (const [label, value] of [
      ['Электронная почта', 'test@example.com'],
      ['Имя', 'Иван'],
      ['Фамилия', 'Тестов'],
      ['Дата рождения', '1990-01-01'],
      ['Номер паспорта', '1234567890'],
      ['Дата выдачи паспорта', '2020-01-01'],
    ])
      await page.getByLabel(label, { exact: false }).fill(value);
    await page.getByLabel('Страна выдачи паспорта', { exact: false }).selectOption('RU');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/screenshots/profile-kyc-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Направить на проверку' }).click();
    await expect(page.getByRole('status')).toContainText('Данные для проверки сохранены');
    await page.reload();
    await expect(page.getByText('Не подтверждён', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    expect(saved).toMatchObject({ email: 'test@example.com' });
    expect(saved).not.toHaveProperty('phone');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Начать верификацию' })).toBeVisible();
    await expect(page.getByLabel('Электронная почта', { exact: false })).toHaveCount(0);
    expect(
      await page.evaluate(
        () => Object.values(localStorage).join('') + Object.values(sessionStorage).join(''),
      ),
    ).not.toContain('test@example.com');
  });
}
