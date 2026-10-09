import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
for (const width of [375, 1440]) {
  test(`account deletion confirmation and verification at ${width}px`, async ({ page, context, request }) => {
    await request.get('http://127.0.0.1:3112/__test/reset');
    await context.addCookies([
      { name: 'atlas_auth_caller', value: 'test-caller', domain: '127.0.0.1', path: '/', httpOnly: true },
      { name: 'atlas_session', value: 'test-issued-bearer', domain: '127.0.0.1', path: '/', httpOnly: true },
    ]);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/cabinet/profile');
    const trigger = page.getByRole('button', { name: 'Удалить аккаунт', exact: true });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('нулевым балансом');
    await expect(dialog).toHaveCSS('opacity', '1');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/delete-confirm-${width}.png`, fullPage: true });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog.getByRole('button', { name: 'Продолжить', exact: true }).click();
    await expect(page).toHaveURL(/intent=delete/);
    await expect(page.getByRole('heading', { name: 'Удаление аккаунта', exact: true })).toBeVisible();
    await page.getByLabel('Электронная почта').fill('person@example.com');
    await page.getByRole('button', { name: 'Продолжить с email' }).click();
    await expect(page.getByLabel('Код из письма')).toBeVisible();
    await page.reload();
    await page.getByLabel('Код из письма').fill('000000');
    await page.getByRole('button', { name: 'Подтвердить код' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/intent=delete/);
    await page.getByLabel('Код из письма').fill('123456');
    await page.screenshot({ path: `artifacts/screenshots/delete-verify-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Подтвердить код' }).click();
    await expect(page).toHaveURL(/\/account\?deleted=1$/);
    await expect(page.getByText('Аккаунт удалён.', { exact: false })).toBeVisible();
    expect((await context.cookies()).some((c) => c.name === 'atlas_session')).toBe(false);
    expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage }))).not.toContain('transactionId');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
