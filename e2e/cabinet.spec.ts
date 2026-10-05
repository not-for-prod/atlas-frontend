import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  test(`single-page cabinet and keyboard dialogs at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/v1/balances', (route) =>
      route.fulfill({
        json: {
          balances: [
            {
              available: { currency: 'USD', amount: '845' },
              reserved: { currency: 'USD', amount: '15' },
            },
          ],
        },
      }),
    );
    await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [] } }));
    const storedCard = {
      id: 'test-card',
      cardTypeId: 'CATEGORY_TRAVEL',
      currency: 'USD',
      status: 'CARD_STATUS_ACTIVE',
      balance: { currency: 'USD', amount: '128' },
    };
    await page.route('**/v1/cards?*', (route) => route.fulfill({ json: { cards: [storedCard] } }));
    await page.route('**/v1/cards/test-card', (route) => route.fulfill({ json: { card: storedCard } }));
    await page.goto('/cabinet?tariff=CATEGORY_TRAVEL');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мои карты');
    const carousel = page.getByRole('region', { name: 'Мои карты' });
    await expect(carousel.getByText('128,00 $', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Показать баланс', exact: true }).click();
    await expect(carousel.getByText('128,00 $', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Баланс аккаунта' })).toContainText('845,00 $');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/cabinet-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const card = page.getByRole('link', { name: 'Открыть карту test-card' });
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/cabinet/card?tariff=CATEGORY_TRAVEL&id=test-card');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Карта');
    await expect(page.getByText('128,00 $', { exact: true })).toBeVisible();
    await page.screenshot({
      path: `artifacts/screenshots/cabinet-card-front-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Скрыть баланс', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Показать баланс', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Вернуться в кабинет' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мои карты');
    await expect(page.getByText('128,00 $', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Баланс аккаунта' })).not.toContainText('845,00 $');
    await page.getByRole('button', { name: 'Показать баланс', exact: true }).click();
    await page.getByRole('link', { name: 'Открыть карту test-card' }).click();
    await expect(page.getByText('128,00 $', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Операции по карте' })).toBeVisible();
    await page.getByRole('button', { name: 'Реквизиты карты', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Реквизиты недоступны');
    await page.screenshot({
      path: `artifacts/screenshots/cabinet-card-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.reload();
    await expect(page.getByText('128,00 $', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Показать баланс', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Реквизиты карты', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    const info = page.getByRole('button', { name: 'Информация', exact: true });
    await expect(info).toHaveCount(0);
    const dialog = page.getByRole('dialog');
    await page.getByRole('button', { name: 'Меню пользователя' }).click();
    await page.getByRole('menuitem', { name: 'Профиль', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Профиль');
    await expect(page).toHaveURL('/cabinet/profile?tariff=CATEGORY_TRAVEL');
    await page.getByRole('link', { name: 'Вернуться в кабинет' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мои карты');
    await page.getByRole('button', { name: 'Выпустить карту', exact: true }).click();
    await expect(dialog.getByText('Ваш выбор', { exact: true })).toBeVisible();
    await page.screenshot({
      path: `artifacts/screenshots/cabinet-issue-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.keyboard.press('Escape');
    const deposit = page.getByRole('button', { name: 'Пополнить баланс', exact: true });
    await deposit.click();
    await expect(dialog.getByLabel('Сколько хотите получить на баланс, USD')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(deposit).toBeFocused();
    const avatar = page.getByRole('button', { name: 'Меню пользователя' });
    await avatar.click();
    await page.getByRole('menuitem', { name: 'Профиль', exact: true }).click();
    await expect(page.getByRole('switch')).toBeChecked();
    await page.getByRole('switch').uncheck();
    await expect(page.getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('button', { name: 'Поддержка в Telegram' })).toBeDisabled();
    await page.screenshot({
      path: `artifacts/screenshots/cabinet-profile-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('link', { name: 'Вернуться в кабинет' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мои карты');
    await avatar.click();
    await page.getByRole('menuitem', { name: 'Поддержка в Telegram' }).click();
    await expect(dialog).toContainText('Контакт поддержки пока не указан');
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL('/cabinet?tariff=CATEGORY_TRAVEL');
    expect(errors).toEqual([]);
  });
}

test('payment history auto-loads cursors, stops on error and allows manual recovery', async ({ page }) => {
  let nextRequests = 0;
  await page.route('**/v1/balances', (route) =>
    route.fulfill({
      json: {
        balances: [
          { available: { currency: 'USD', amount: '0' }, reserved: { currency: 'USD', amount: '0' } },
        ],
      },
    }),
  );
  await page.route('**/v1/payments?*', (route) => {
    const cursor = new URL(route.request().url()).searchParams.get('page_token');
    if (cursor && ++nextRequests === 1) return route.fulfill({ status: 503, json: {} });
    return route.fulfill({
      json: {
        payments: [
          {
            id: cursor || 'first',
            createdAt: '2026-09-27T10:00:00Z',
            type: 'PAYMENT_TYPE_DEPOSIT',
            status: 'PAYMENT_STATUS_COMPLETED',
            amount: { currency: 'USDT', amount: cursor ? '2' : '1' },
          },
        ],
        nextPageToken: cursor ? '' : 'second',
      },
    });
  });
  await page.goto('/cabinet');
  const more = page.getByRole('button', { name: 'Показать ещё' });
  await more.scrollIntoViewIfNeeded();
  await expect(page.getByRole('alert').filter({ hasText: 'Не удалось обновить историю' })).toBeVisible();
  await expect.poll(() => nextRequests).toBe(1);
  await more.click();
  await expect(more).toHaveCount(0);
  expect(nextRequests).toBe(2);
  await expect(page.getByText('+2 USDT', { exact: true })).toBeVisible();
  await mkdir('artifacts/screenshots', { recursive: true });
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.screenshot({
      path: `artifacts/screenshots/payment-history-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
});

test('legacy section links open cabinet dialogs; unknown sections return 404', async ({ page, request }) => {
  await page.goto('/cabinet/profile');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Профиль');
  await page.getByRole('link', { name: 'Вернуться в кабинет' }).click();
  await expect(page).toHaveURL('/cabinet');
  for (const path of ['/cabinet/unknown', '/cabinet/cards/unknown'])
    expect((await request.get(path)).status()).toBe(404);
});
