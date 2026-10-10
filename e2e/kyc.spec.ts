import { mkdir } from 'node:fs/promises';
import { type Page } from '@playwright/test';
import { expect, test } from './fixtures/cabinet';
const checks = ['KYC_CHECK_IDENTITY_DOCUMENT', 'KYC_CHECK_LIVENESS', 'KYC_CHECK_FACE_MATCH'];
const initial = {
  status: 'VERIFICATION_STATUS_NOT_STARTED',
  requiredChecks: checks,
  passedChecks: [] as string[],
  missingChecks: checks,
  contactsComplete: false,
  eligible: false,
  verificationUrl: '',
};
const tariff = {
  tariffId: 'cards',
  currency: 'USD',
  categories: {
    travel: {
      name: 'Карта для поездок',
      description: 'Покупки и бронирования',
      requiresKyc: true,
      fees: { issue_price: { fixed: '20' }, issue_commission: { fixed: '5' } },
    },
  },
};
async function cabinet(page: Page) {
  await page.route('**/v1/cards/tariff', (route) => route.fulfill({ json: tariff }));
  await page.route('**/v1/cards?*', (route) => route.fulfill({ json: { cards: [] } }));
  await page.route('**/v1/card-issues/current', (route) => route.fulfill({ json: {} }));
  await page.route('**/v1/notifications/settings', (route) => route.fulfill({ json: { enabled: false } }));
  await page.route('**/v1/support', (route) => route.fulfill({ json: {} }));
  await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [] } }));
  await page.route('**/v1/balances', (route) =>
    route.fulfill({
      json: {
        balances: [
          { available: { currency: 'USD', amount: '100' }, reserved: { currency: 'USD', amount: '0' } },
        ],
      },
    }),
  );
}
for (const width of [375, 1440]) {
  test(`profile contacts, keyboard focus and private data at ${width}px`, async ({ page }) => {
    await cabinet(page);
    await page.setViewportSize({ width, height: 1000 });
    let contactsComplete = false;
    let saved: unknown;
    await page.route('**/v1/kyc', (route) =>
      route.fulfill({
        json: { state: { ...initial, requiredChecks: [], missingChecks: [], contactsComplete } },
      }),
    );
    await page.route('**/v1/kyc/contacts', (route) => {
      saved = route.request().postDataJSON();
      contactsComplete = true;
      return route.fulfill({ json: { state: { ...initial, contactsComplete } } });
    });
    await page.goto('/cabinet/profile');
    await expect(page).toHaveTitle('Атлас — личный кабинет');
    const contacts = page.getByRole('button', { name: 'Указать почту' });
    await contacts.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Электронная почта', { exact: false })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(contacts).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByLabel('Электронная почта', { exact: false }).fill('test@example.com');
    await expect(page.getByLabel('Телефон', { exact: false })).toHaveCount(0);
    await expect(page.getByLabel('Номер паспорта', { exact: false })).toHaveCount(0);
    await mkdir('/tmp/atlas-frontend-kyc-email-qa', { recursive: true });
    await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1');
    await page.screenshot({
      path: `/tmp/atlas-frontend-kyc-email-qa/contacts-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Сохранить почту' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Почта сохранена')).toBeVisible();
    expect(saved).toEqual({ email: 'test@example.com' });
    await page.reload();
    await expect(page.getByText('Почта сохранена')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Перейти к выбору карты' })).toBeVisible();
    expect(
      await page.evaluate(
        () => Object.values(localStorage).join('') + Object.values(sessionStorage).join(''),
      ),
    ).not.toContain('test@example.com');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`KYC before issuance, Didit return and explicit confirmation at ${width}px`, async ({ page }) => {
    await cabinet(page);
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    let state = { ...initial };
    let starts = 0;
    const issues: unknown[] = [];
    await page.route('**/v1/kyc?*', (route) => {
      expect(new URL(route.request().url()).searchParams.get('cardTypeId')).toBe('travel');
      return route.fulfill({ json: { state } });
    });
    await page.route('**/v1/kyc/contacts', (route) => {
      state = { ...state, contactsComplete: true };
      return route.fulfill({
        json: { state: { ...state, requiredChecks: [], missingChecks: [], eligible: false } },
      });
    });
    await page.route('**/v1/kyc/verification', (route) => {
      starts++;
      expect(route.request().postDataJSON()).toEqual({ cardTypeId: 'travel' });
      state = {
        ...state,
        status: 'VERIFICATION_STATUS_AWAITING_USER',
        verificationUrl: 'https://verify.didit.me/synthetic-session',
      };
      return route.fulfill({ json: { state } });
    });
    // The provider page is synthetic; no live Didit session or document upload occurs.
    await page.route('https://verify.didit.me/synthetic-session', (route) =>
      route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: '<html><head><title>Didit test fixture</title></head><body><a href="http://127.0.0.1:3100/kyc/return?status=Approved">Вернуться в Атлас</a></body></html>',
      }),
    );
    const issue = {
      id: 'kyc-issued',
      cardTypeId: 'travel',
      name: 'Поездки',
      status: 'CARD_ISSUE_STATUS_PENDING',
      price: { currency: 'USD', amount: '20' },
      fee: { currency: 'USD', amount: '5' },
    };
    await page.route('**/v1/cards', (route) => {
      issues.push(route.request().postDataJSON());
      return route.fulfill({ json: { issue } });
    });
    await page.route('**/v1/card-issues/kyc-issued', (route) => route.fulfill({ json: { issue } }));
    await page.goto('/cabinet/issue?tariff=travel');
    await expect(page).toHaveTitle('Атлас — личный кабинет');
    await expect(page.getByRole('heading', { name: 'Верификация личности' })).toBeVisible();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Выпустить карту', exact: true }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Указать почту' }).click();
    const contacts = page.getByRole('dialog', { name: 'Почта для выпуска карты' });
    await contacts.getByLabel('Электронная почта', { exact: false }).fill('test@example.com');
    await expect(contacts.getByLabel('Телефон', { exact: false })).toHaveCount(0);
    await contacts.getByRole('button', { name: 'Сохранить почту' }).click();
    await expect(contacts).toHaveCount(0);
    await expect(page.getByText('Почта сохранена')).toBeVisible();
    await mkdir('/tmp/atlas-frontend-kyc-email-qa', { recursive: true });
    await page.screenshot({
      path: `/tmp/atlas-frontend-kyc-email-qa/verification-${width}.png`,
      fullPage: true,
    });
    expect(issues).toHaveLength(0);
    await page.getByRole('button', { name: 'Начать проверку в Didit' }).click();
    await expect(page).toHaveURL('https://verify.didit.me/synthetic-session');
    expect(starts).toBe(1);
    state = { ...state, status: 'VERIFICATION_STATUS_IN_PROGRESS', verificationUrl: '' };
    await page.getByRole('link', { name: 'Вернуться в Атлас' }).click();
    await expect(page).toHaveURL('/cabinet/issue?tariff=travel');
    await expect(page.getByText('Проверяется', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Выпустить карту', exact: true }),
    ).toHaveCount(0);
    expect(issues).toHaveLength(0);
    state = {
      ...state,
      status: 'VERIFICATION_STATUS_APPROVED',
      passedChecks: checks,
      missingChecks: [],
      eligible: true,
    };
    // Active verification polls to backend approval without trusting callback parameters.
    await expect(page.getByLabel('Название карты')).toBeVisible();
    expect(issues).toHaveLength(0);
    expect(starts).toBe(1);
    const storage = await page.evaluate(
      () => Object.values(localStorage).join('') + Object.values(sessionStorage).join(''),
    );
    expect(storage).not.toContain('synthetic-session');
    expect(storage).not.toContain('test@example.com');
    await page.getByLabel('Название карты').fill('Поездки');
    await page.getByRole('dialog').getByRole('button', { name: 'Выпустить карту', exact: true }).click();
    await expect(page.getByText('Заявка принята. Резервируем сумму.')).toBeVisible();
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ cardTypeId: 'travel', expectedPrice: '20', expectedCommission: '5' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
test('a card without KYC needs no KYC requests and accepts the shorter progress', async ({ page }) => {
  await cabinet(page);
  await page.route('**/v1/cards/tariff', (route) =>
    route.fulfill({
      json: {
        ...tariff,
        categories: {
          travel: { ...tariff.categories.travel, requiresKyc: false },
        },
      },
    }),
  );
  const requests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/v1/kyc')) requests.push(request.url());
  });
  const stages = [
    'RESERVING_FUNDS',
    'REGISTERING_CLIENT',
    'FUNDING_ACCOUNT',
    'ISSUING_CARD',
    'FINALIZING_CARD',
  ];
  const issue = {
    id: 'no-kyc',
    cardTypeId: 'travel',
    name: 'Поездки',
    status: 'CARD_ISSUE_STATUS_FUNDING',
    price: { currency: 'USD', amount: '20' },
    fee: { currency: 'USD', amount: '5' },
    steps: stages.map((stage, index) => ({
      stage: `CARD_ISSUE_STAGE_${stage}`,
      status: `CARD_ISSUE_STEP_STATUS_${index < 2 ? 'COMPLETED' : index === 2 ? 'CURRENT' : 'UPCOMING'}`,
    })),
  };
  await page.route('**/v1/cards', (route) => route.fulfill({ json: { issue } }));
  await page.route('**/v1/card-issues/no-kyc', (route) => route.fulfill({ json: { issue } }));
  await page.goto('/cabinet/issue?tariff=travel');
  await expect(page.getByText('Верификация личности не требуется')).toBeVisible();
  await page.getByLabel('Название карты').fill('Поездки');
  await page.getByRole('dialog').getByRole('button', { name: 'Выпустить карту', exact: true }).click();
  await expect(page.getByText('Переводим средства для выпуска.')).toBeVisible();
  await expect(page.getByText('Проверка личности', { exact: true })).toHaveCount(0);
  expect(requests).toEqual([]);
});
test('read failure blocks issuance and retries without creating a session', async ({ page }) => {
  await cabinet(page);
  let fail = true,
    starts = 0;
  await page.route('**/v1/kyc?*', (route) =>
    route.fulfill(
      fail
        ? { status: 503, json: {} }
        : {
            json: {
              state: { ...initial, status: 'VERIFICATION_STATUS_DECLINED', reason: 'provider_rejected' },
            },
          },
    ),
  );
  await page.route('**/v1/kyc/verification', (route) => {
    starts++;
    return route.fulfill({ status: 503, json: {} });
  });
  await page.goto('/cabinet/issue?tariff=travel');
  await expect(page.getByText('Не удалось получить статус проверки.', { exact: false })).toBeVisible();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Выпустить карту', exact: true }),
  ).toHaveCount(0);
  fail = false;
  await page.getByRole('dialog').getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(page.getByText('Проверка не пройдена', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Начать проверку в Didit' }).click();
  await expect(page.getByText('Не удалось открыть проверку.', { exact: false })).toBeVisible();
  expect(starts).toBe(1);
});
test('an uncertain start recovers the active session without a second POST', async ({ page }) => {
  await cabinet(page);
  let state = { ...initial };
  let starts = 0;
  await page.route('**/v1/kyc?*', (route) => route.fulfill({ json: { state } }));
  await page.route('**/v1/kyc/verification', (route) => {
    starts++;
    state = {
      ...state,
      status: 'VERIFICATION_STATUS_AWAITING_USER',
      verificationUrl: 'https://verify.didit.me/recovered',
    };
    return route.fulfill({ status: 503, json: {} });
  });
  await page.route('https://verify.didit.me/recovered', (route) =>
    route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1>Recovered fixture</h1>' }),
  );
  await page.goto('/cabinet/issue?tariff=travel');
  await page.getByRole('button', { name: 'Начать проверку в Didit' }).click();
  await page.getByRole('button', { name: 'Продолжить в Didit' }).click();
  await expect(page).toHaveURL('https://verify.didit.me/recovered');
  expect(starts).toBe(1);
});
