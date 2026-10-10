import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
const issue = {
  id: 'request-1',
  cardTypeId: 'Custom.Card/ABC',
  name: 'Поездки',
  status: 'CARD_ISSUE_STATUS_ISSUING',
  price: { currency: 'USD', amount: '20' },
  fee: { currency: 'USD', amount: '5' },
};
const tariff = {
  tariffId: 'cards',
  currency: 'USD',
  categories: {
    'Custom.Card/ABC': {
      name: 'Особая карта',
      requiresKyc: false,
      palette: { background: '#123456', foreground: '#ffffff' },
      description: 'Карта для поездок',
      fees: { issue_price: { fixed: '20' }, issue_commission: { fixed: '5' } },
    },
  },
};
for (const width of [375, 1440]) {
  test(`issuance reuses request after lost response and shows completion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/v1/cards/tariff', (route) => route.fulfill({ json: tariff }));
    await page.route('**/v1/card-issues/current', (route) => route.fulfill({ json: {} }));
    let status = issue.status;
    await page.route('**/v1/card-issues/request-1', (route) =>
      route.fulfill({ json: { issue: { ...issue, status } } }),
    );
    const requests: unknown[] = [];
    await page.route('**/v1/cards', (route) => {
      requests.push(route.request().postDataJSON());
      return route.fulfill(requests.length === 1 ? { status: 503, json: {} } : { json: { issue } });
    });
    await page.goto('/cabinet/issue');
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Особая карта' })).toBeVisible();
    const artwork = modal.locator('[data-palette="configured"]');
    await expect(artwork).toHaveCSS('background-color', 'rgb(18, 52, 86)');
    await expect(artwork).toHaveCSS('color', 'rgb(255, 255, 255)');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/card-types-${width}.png`, fullPage: true });
    await modal.getByRole('button', { name: 'Выбрать', exact: true }).focus();
    await page.keyboard.press('Enter');
    await modal.getByLabel('Название карты').fill('Поездки');
    await expect(modal.getByText('Будет зарезервировано: 25,00 $')).toBeVisible();
    await expect(
      modal.getByText('при ошибке на любом этапе выпуска комиссия списывается', { exact: false }),
    ).toBeVisible();
    await page.screenshot({ path: `artifacts/screenshots/issuance-policy-${width}.png`, fullPage: true });
    await modal.getByRole('button', { name: 'Выпустить карту', exact: true }).click();
    await expect(modal.getByText('Не удалось получить подтверждение.', { exact: false })).toBeVisible();
    await modal.getByRole('button', { name: 'Повторить ту же заявку' }).click();
    expect(requests).toHaveLength(2);
    expect(requests[0]).toEqual(requests[1]);
    expect(requests[0]).toMatchObject({
      cardTypeId: 'Custom.Card/ABC',
      expectedPrice: '20',
      expectedCommission: '5',
    });
    await expect(modal.getByText('Выпускаем карту.')).toBeVisible();
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/issuance-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    status = 'CARD_ISSUE_STATUS_COMPLETED';
    await expect(modal.getByText('Карта выпущена.', { exact: false })).toBeVisible();
  });
}
test('reload resumes an uncertain issuance without allowing another submission', async ({ page }) => {
  await page.route('**/v1/cards/tariff', (route) => route.fulfill({ status: 503, json: {} }));
  const unknown = { ...issue, status: 'CARD_ISSUE_STATUS_NEEDS_REVIEW' };
  await page.route('**/v1/card-issues/current', (route) => route.fulfill({ json: { issue: unknown } }));
  await page.route('**/v1/card-issues/request-1', (route) => route.fulfill({ json: { issue: unknown } }));
  await page.goto('/cabinet/issue');
  await expect(page.getByText('Обратитесь в поддержку', { exact: false })).toBeVisible();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Выпустить карту', exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Обратитесь в поддержку', { exact: false })).toBeVisible();
});
