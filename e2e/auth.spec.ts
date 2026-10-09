import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
const production = process.env.TEST_PRODUCTION === '1';
test.beforeEach(async ({ request }) => {
  await request.get('http://127.0.0.1:3112/__test/reset');
});
for (const width of [375, 1440]) {
  test(`email login at ${width}px survives reload and calls the backend directly`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/account?tariff=CATEGORY_TRAVEL');
    await expect(page.getByLabel('Электронная почта')).toBeVisible();
    expect(requests).toContain('http://127.0.0.1:3112/v1/tenants/atlas/auth/policy');
    expect(requests.some((url) => url.includes('/api/auth/'))).toBe(false);
    await expect(page.getByRole('button', { name: 'Продолжить с Google' })).toHaveCount(0);
    await page.getByLabel('Электронная почта').fill('person@example.com');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/auth-${production ? 'production' : 'development'}-${width}.png`,
      fullPage: true,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Продолжить с email' }).click();
    await expect(page.getByLabel('Код из письма')).toBeVisible();
    await page.reload();
    await page.getByLabel('Код из письма').fill('000000');
    await page.getByRole('button', { name: 'Подтвердить код' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Не удалось подтвердить данные');
    await page.getByLabel('Код из письма').fill('123456');
    await page.getByRole('button', { name: 'Подтвердить код' }).click();
    await expect(page).toHaveURL(/\/cabinet(?:\?tariff=CATEGORY_TRAVEL)?$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мои карты');
    expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage }))).not.toContain(
      'test-issued-bearer',
    );
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain(
      'test-issued-bearer',
    );
    expect((await context.cookies()).find((c) => c.name === 'atlas_auth_caller')?.httpOnly).toBe(true);
    expect((await context.cookies()).find((c) => c.name === 'atlas_session')?.httpOnly).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain('test-issued-bearer');
    await page.reload();
    await expect(page).toHaveURL(/\/cabinet(?:\?tariff=CATEGORY_TRAVEL)?$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мои карты');
    await page.getByRole('button', { name: 'Меню пользователя' }).click();
    await page.getByRole('menuitem', { name: 'Профиль', exact: true }).click();
    await page.getByRole('button', { name: 'Выйти на этом устройстве' }).click();
    await expect(page.getByLabel('Электронная почта')).toBeVisible();
    expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage }))).not.toContain(
      'test-issued-bearer',
    );
    expect((await context.cookies()).some((cookie) => cookie.name === 'atlas_session')).toBe(false);
  });
}
test('sign-up-only policy and empty or failed policy have no fabricated fallback methods', async ({
  page,
  request,
}) => {
  await request.get('http://127.0.0.1:3112/__test/reset?scenario=signup');
  await page.goto('/account');
  await expect(page.getByRole('button', { name: 'Регистрация', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти', exact: true })).toHaveCount(0);
  await request.get('http://127.0.0.1:3112/__test/reset?scenario=empty');
  await page.reload();
  await expect(page.getByText('Сейчас нет доступных способов входа для этого действия.')).toBeVisible();
  await request.get('http://127.0.0.1:3112/__test/reset?scenario=unavailable');
  await page.reload();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Сервис временно недоступен');
  await expect(page.getByLabel('Электронная почта')).toHaveCount(0);
});
test('rate limiting does not automatically repeat email dispatch', async ({ page, request }) => {
  await request.get('http://127.0.0.1:3112/__test/reset?scenario=rate');
  let starts = 0;
  page.on('request', (r) => {
    if (r.url().endsWith(':startMethod') && r.method() === 'POST') starts++;
  });
  await page.goto('/account');
  await page.getByLabel('Электронная почта').fill('person@example.com');
  await page.getByRole('button', { name: 'Продолжить с email' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Слишком много попыток');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('60 сек.');
  expect(starts).toBe(1);
});
test('partial verification requires another backend step instead of announcing success', async ({
  page,
  request,
}) => {
  await request.get('http://127.0.0.1:3112/__test/reset?scenario=partial');
  await page.goto('/account');
  await page.getByLabel('Электронная почта').fill('person@example.com');
  await page.getByRole('button', { name: 'Продолжить с email' }).click();
  await page.getByLabel('Код из письма').fill('123456');
  await page.getByRole('button', { name: 'Подтвердить код' }).click();
  await expect(page.getByText('Продолжите подтверждение, чтобы завершить вход.')).toBeVisible();
  await expect(page.getByText('Вы вошли в аккаунт', { exact: true })).toHaveCount(0);
});
test('account initialization polls only until the client becomes available', async ({ page, request }) => {
  await request.get('http://127.0.0.1:3112/__test/reset?scenario=initializing');
  await page.goto('/account');
  await page.getByLabel('Электронная почта').fill('person@example.com');
  await page.getByRole('button', { name: 'Продолжить с email' }).click();
  await page.getByLabel('Код из письма').fill('123456');
  await page.getByRole('button', { name: 'Подтвердить код' }).click();
  await expect(page.getByRole('status')).toHaveText('Готовим ваш аккаунт');
  await expect(page).toHaveURL(/\/cabinet$/, { timeout: 10000 });
  await request.get('http://127.0.0.1:3112/__test/reset?scenario=revoked');
  await page.goto('/account');
  await expect(page.getByLabel('Электронная почта')).toBeVisible();
});
test('OAuth uses configured providers and returns through the browser callback without a token URL', async ({
  page,
  request,
}) => {
  await request.get('http://127.0.0.1:3112/__test/reset?scenario=oauth');
  await page.goto('/account?tariff=CATEGORY_TRAVEL');
  await expect(page.getByLabel('Электронная почта')).toHaveCount(0);
  await page.route('https://accounts.google.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Test provider consent</p>' }),
  );
  await page.getByRole('button', { name: 'Продолжить с Google' }).click();
  await expect(page).toHaveURL(/accounts.google.com/);
  await page.goto('/auth/callback/google?state=test-state&code=test-code');
  await expect(page).toHaveURL(/\/cabinet\?tariff=CATEGORY_TRAVEL$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мои карты');
});

for (const width of [375, 1440]) {
  test(`OAuth provider buttons at ${width}px have icons and keyboard access`, async ({ page, request }) => {
    await request.get('http://127.0.0.1:3112/__test/reset?scenario=oauth');
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/account');
    const google = page.getByRole('button', { name: 'Продолжить с Google' });
    await expect(google).toBeVisible();
    await expect(google.locator('[data-provider="google"] svg')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Продолжить с Telegram' })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await google.focus();
    await expect(google).toBeFocused();
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/auth-oauth-${width}.png`, fullPage: true });
    await page.route('https://accounts.google.com/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<p>Test provider consent</p>' }),
    );
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/accounts.google.com/);
  });
}

test('unknown OAuth account offers explicit registration and starts a fresh signup', async ({
  page,
  request,
}) => {
  await request.get('http://127.0.0.1:3112/__test/reset?scenario=oauth-unregistered');
  const intents: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().endsWith('/auth/transactions'))
      intents.push(req.postDataJSON().intent);
  });
  await page.route('https://accounts.google.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Consent</p>' }),
  );
  await page.goto('/account?tariff=CATEGORY_TRAVEL');
  await page.getByRole('button', { name: 'Продолжить с Google' }).click();
  await expect(page).toHaveURL(/accounts.google.com/);
  await page.goto('/auth/callback/google?state=test-state&code=test-code');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Аккаунт для этого способа входа не найден',
  );
  expect(intents).toEqual(['INTENT_SIGN_IN']);
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByRole('button', { name: 'Перейти к регистрации' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/auth-account-not-found-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Перейти к регистрации' }).click();
  await expect(page.getByRole('button', { name: 'Регистрация', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  expect(intents).toEqual(['INTENT_SIGN_IN']);
  await page.getByRole('button', { name: 'Продолжить с Google' }).click();
  await expect(page).toHaveURL(/accounts.google.com/);
  expect(intents).toEqual(['INTENT_SIGN_IN', 'INTENT_SIGN_UP']);
  await page.goto('/auth/callback/google?state=test-state&code=signup-code');
  await expect(page).toHaveURL(/\/cabinet\?tariff=CATEGORY_TRAVEL$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мои карты');
});

for (const width of [375, 1440]) {
  test(`email-first login layout at ${width}px continues directly to code`, async ({ page, request }) => {
    await request.get('http://127.0.0.1:3112/__test/reset?scenario=mixed');
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/account');
    const email = page.getByLabel('Электронная почта');
    const submit = page.getByRole('button', { name: 'Продолжить с email' });
    const google = page.getByRole('button', { name: 'Продолжить с Google' });
    const telegram = page.getByRole('button', { name: 'Продолжить с Telegram' });
    await expect(email).toBeVisible();
    await expect(telegram).toBeVisible();
    const boxes = await Promise.all(
      [email, submit, google, telegram].map((control) => control.boundingBox()),
    );
    for (let index = 1; index < boxes.length; index++) {
      expect(boxes[index]!.y).toBeGreaterThanOrEqual(boxes[index - 1]!.y + boxes[index - 1]!.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await email.focus();
    await page.keyboard.press('Tab');
    await expect(submit).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(google).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(telegram).toBeFocused();
    await email.fill('person@example.com');
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/auth-email-first-${width}.png`, fullPage: true });
    await email.press('Enter');
    await expect(page.getByLabel('Код из письма')).toBeVisible();
    await expect(google).toHaveCount(0);
  });
}
