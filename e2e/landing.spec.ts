import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
const production = process.env.TEST_PRODUCTION === '1';
for (const width of [375, 768, 1440]) {
  test(`public landing at ${width}px supports navigation, FAQ and selected card handoff`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const apiCalls: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (/\/(api|auth|client|v1)(\/|$)/.test(new URL(request.url()).pathname)) apiCalls.push(request.url());
    });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page).toHaveTitle('Атлас — виртуальные карты для оплаты сервисов');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Карта для оплаты сервисов по всему миру',
    );
    await expect(page.getByText('Условия действующего тарифа.', { exact: false })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(3);
    await expect(page.getByText('Минимальное пополнение:', { exact: false })).toHaveCount(3);
    await expect(page.getByText('Максимальное пополнение:', { exact: false })).toHaveCount(3);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Смотреть тарифы', exact: true }).click();
    await expect(page).toHaveURL(/#tariffs$/);
    const menu = page.locator('summary').filter({ hasText: 'Меню' });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole('link', { name: 'Вопросы', exact: true }).click();
    if (await menu.isVisible()) await menu.click();
    const faq = page.locator('summary').filter({ hasText: 'Можно ли уже выпустить карту?' });
    await faq.focus();
    await page.keyboard.press('Enter');
    await expect(faq.locator('..')).toHaveAttribute('open', '');
    await expect(page.getByText('Пока нет. Сервис готовится к запуску.', { exact: false })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(faq.locator('..')).not.toHaveAttribute('open', '');
    await page.evaluate(() => window.scrollTo(0, 0));
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/landing-${production ? 'production' : 'development'}-${width}.png`,
      fullPage: true,
    });
    await page.getByRole('link', { name: 'Посмотреть вариант «Для путешествий»', exact: true }).click();
    await expect(page).toHaveURL(/\/account\?tariff=CATEGORY_TRAVEL$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Вход в Атлас');
    await expect(page.getByText('Вы рассматриваете вариант «Для путешествий»')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Вы рассматриваете вариант «Для путешествий»')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Посмотреть демо кабинета' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Атлас', exact: true }).first().click();
    await page.getByRole('link', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    expect(errors).toEqual([]);
    expect(
      apiCalls.filter(
        (url) =>
          !['/auth/caller', '/client', '/v1/tenants/atlas/auth/policy', '/v1/cards/tariff'].includes(
            new URL(url).pathname,
          ),
      ),
    ).toEqual([]);
  });
}
test('unknown or ambiguous tariff input is not presented as a valid selection', async ({ page }) => {
  for (const query of ['?tariff=unknown', '?tariff=CATEGORY_TRAVEL&tariff=premium']) {
    await page.goto(`/account${query}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Вход в Атлас');
    await expect(page.getByText('Вы рассматриваете вариант', { exact: false })).toHaveCount(0);
  }
});
