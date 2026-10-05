import { expect, test } from '@playwright/test';
test('tariff failure has no fixture fallback, retry supports empty then live categories', async ({
  page,
}) => {
  let body: unknown = {};
  let status = 503;
  await page.route('**/v1/cards/tariff', (route) => route.fulfill({ status, json: body }));
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Повторить/ })).toBeVisible();
  status = 200;
  body = { tariffId: 'cards', currency: 'USD' };
  await page.getByRole('button', { name: /Повторить/ }).click();
  await expect(page.getByRole('article')).toHaveCount(0);
  body = {
    tariffId: 'cards',
    currency: 'USD',
    categories: {
      'Custom.Card/ABC': {
        name: 'Особая карта',
        palette: { background: '#123456', foreground: '#ffffff' },
        description: '<b>Live description</b>',
        fees: { issue: { fixed: '20' }, deposit: { percent: '1.5' } },
      },
    },
  };
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByText('<b>Live description</b>', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Посмотреть вариант «Особая карта»', exact: true }).click();
  await expect(page).toHaveURL(/tariff=Custom.Card%2FABC$/);
  await expect(page.getByText('Вы рассматриваете вариант «Особая карта»')).toBeVisible();
  body = { tariffId: 'cards', currency: 'USD' };
  await page.reload();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('Вы рассматриваете вариант', { exact: false })).toHaveCount(0);
});
