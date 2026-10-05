import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
const card = {
  id: 'stored-card',
  cardTypeId: 'Custom.Card/ABC',
  currency: 'USD',
  status: 'CARD_STATUS_ACTIVE',
};
for (const width of [375, 1440]) {
  test(`stored card list and reloadable details at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/v1/cards/stored-card/operations?*', (route) =>
      route.fulfill({ json: { operations: [] } }),
    );
    await page.route('**/v1/cards?*', (route) => route.fulfill({ json: { cards: [card] } }));
    await page.route('**/v1/cards/stored-card', (route) => route.fulfill({ json: { card } }));
    await page.route('**/v1/cards/tariff', (route) =>
      route.fulfill({
        json: {
          tariffId: 'cards',
          currency: 'USD',
          categories: {
            'Custom.Card/ABC': {
              name: 'Особая карта',
              palette: { background: '#123456', foreground: '#ffffff' },
              fees: { issue_price: { fixed: '20' }, issue_commission: { fixed: '5' } },
            },
          },
        },
      }),
    );
    await page.goto('/cabinet');
    const cards = page.getByRole('region', { name: 'Мои карты' });
    await expect(cards.locator('[data-palette="configured"]')).toHaveCSS(
      'background-color',
      'rgb(18, 52, 86)',
    );
    await expect(cards.getByText('Баланс недоступен')).toBeVisible();
    await expect(cards.getByText('Активна')).toBeVisible();
    await expect(cards.getByText('Демо', { exact: true })).toHaveCount(0);
    await expect(cards.getByText('128,00 $')).toHaveCount(0);
    expect(
      await cards
        .locator('a')
        .first()
        .evaluate((element) => element.getBoundingClientRect().left),
    ).toBeGreaterThanOrEqual(0);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/stored-cards-${width}.png`, fullPage: true });
    const open = cards.getByRole('link', { name: 'Открыть карту stored-card' });
    await open.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/cabinet/card?id=stored-card');
    await expect(page.getByText('Баланс недоступен')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Закрыть карту', exact: true })).toBeDisabled();
    await page.reload();
    await expect(page.getByText('Активна')).toBeVisible();
    await expect(page.locator('[data-palette="configured"]')).toHaveCSS(
      'background-color',
      'rgb(18, 52, 86)',
    );
    await page.screenshot({ path: `artifacts/screenshots/stored-card-detail-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('empty, failed and paginated card reads remain distinct', async ({ page }) => {
  let mode = 'empty';
  await page.route('**/v1/cards?*', (route) => {
    if (mode === 'error') return route.fulfill({ status: 503, json: {} });
    const token = new URL(route.request().url()).searchParams.get('page_token');
    return route.fulfill({
      json:
        mode === 'empty'
          ? { cards: [] }
          : { cards: [{ ...card, id: token ? 'second' : card.id }], nextPageToken: token ? '' : 'next' },
    });
  });
  await page.goto('/cabinet');
  const cards = page.getByRole('region', { name: 'Мои карты' });
  await expect(cards.getByText('У вас пока нет выпущенных карт.')).toBeVisible();
  mode = 'error';
  await cards.getByRole('button', { name: 'Обновить карты' }).click();
  await expect(cards.getByRole('alert')).toContainText('Не удалось загрузить карты.');
  await expect(cards.getByText('У вас пока нет выпущенных карт.')).toHaveCount(0);
  mode = 'cards';
  await cards.getByRole('button', { name: 'Повторить' }).click();
  await cards.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(cards.getByRole('link')).toHaveCount(2);
  await page.goto('/cabinet/card?id=foreign');
  await expect(page.getByRole('alert').filter({ hasText: 'Карта не найдена.' })).toBeVisible();
});
test('card authentication failure hides the cabinet and redirects to sign in', async ({ page }) => {
  let expired = false;
  await page.route('**/v1/cards?*', (route) =>
    expired ? route.fulfill({ status: 401, json: {} }) : route.fulfill({ json: { cards: [card] } }),
  );
  await page.goto('/cabinet');
  await expect(page.getByRole('link', { name: 'Открыть карту stored-card' })).toBeVisible();
  expired = true;
  await page.getByRole('button', { name: 'Обновить карты' }).click();
  await expect(page).toHaveURL('/account');
  await expect(page.getByText('Активна')).toHaveCount(0);
});
