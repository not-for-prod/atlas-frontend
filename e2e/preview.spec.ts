import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
const production = process.env.TEST_PRODUCTION === '1';
test('production does not expose preview routes or demo content', async ({ request }) => {
  test.skip(!production);
  for (const path of ['/preview', '/preview/gallery']) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('deposit-demo');
  }
  const files = await readdir('.next/static', { recursive: true });
  for (const file of files.filter((name) => name.endsWith('.js'))) {
    const content = await readFile(join('.next/static', file), 'utf8');
    expect(content.includes('deposit-demo'), `No fixture data in ${file}`).toBe(false);
    expect(content.includes('cardBalanceAmount:"320"'), `No fixture data in ${file}`).toBe(false);
  }
  const home = await request.get('/');
  expect(home.status()).toBe(200);
  expect(await home.text()).toContain('Карта для оплаты сервисов по всему миру');
});
for (const width of [375, 1440]) {
  test(`dashboard and gallery render at ${width}px and support keyboard dialogs`, async ({ page }) => {
    test.skip(production);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (/\/(api|auth|client|v1)(\/|$)/.test(new URL(request.url()).pathname)) apiCalls.push(request.url());
    });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/preview');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Обзор аккаунта');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const toggle = page.getByRole('button', { name: 'Показать баланс' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Баланс аккаунта' })).toContainText('1 250,50 $');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/dashboard-${width}.png`, fullPage: true });
    const action = page.getByRole('button', { name: 'Пополнить баланс' });
    await action.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toContainText('Деньги не списываются');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(action).toBeFocused();
    await page.getByRole('link', { name: 'Компоненты', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Основа интерфейса');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/screenshots/gallery-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Открыть подтверждение' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    expect(errors).toEqual([]);
    expect(apiCalls).toEqual([]);
  });
}
test('all dashboard scenarios are distinct and retry is an explicit preview transition', async ({ page }) => {
  test.skip(production);
  await page.goto('/preview');
  for (const [option, message] of [
    ['Новый аккаунт', 'Здесь появятся ваши карты'],
    ['Загрузка', 'Загружаем кабинет'],
    ['Подготовка', 'Готовим ваш аккаунт'],
    ['Ошибка', 'Не удалось загрузить кабинет'],
  ]) {
    await page.getByRole('combobox', { name: 'Сценарий' }).click();
    await page.getByRole('option', { name: option, exact: true }).click();
    await expect(page.getByRole('heading', { name: message, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Показать баланс' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByRole('button', { name: 'Показать баланс' })).toBeVisible();
});
