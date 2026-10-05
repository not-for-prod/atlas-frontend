import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  for (const kind of ['issue', 'top-up']) {
    test(`${kind === 'issue' ? 'issuance progress' : 'silent top-up receipt'} is available from payments at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      const issuance = kind === 'issue';
      const prefix = issuance ? 'CARD_ISSUE' : 'CARD_TOP_UP';
      const stages = issuance
        ? [
            'RESERVING_FUNDS',
            'REGISTERING_CLIENT',
            'VERIFYING_IDENTITY',
            'FUNDING_ACCOUNT',
            'ISSUING_CARD',
            'FINALIZING_CARD',
          ]
        : ['RESERVING_FUNDS', 'FUNDING_ACCOUNT', 'TOPPING_UP_CARD'];
      let current = issuance ? 3 : 1;
      let requests = 0;
      let unavailable = false;
      const payment = {
        id: `card-${kind}:journey-1`,
        type: issuance ? 'PAYMENT_TYPE_CARD_ISSUE' : 'PAYMENT_TYPE_CARD_TOP_UP',
        status: 'PAYMENT_STATUS_PENDING',
        createdAt: '2026-10-03T17:41:39Z',
        cardId: 'card-1',
        amount: { amount: '6', currency: 'USD' },
        fee: { amount: '1', currency: 'USD' },
        reservedAmount: { amount: '6', currency: 'USD' },
        releasedAmount: { amount: '0', currency: 'USD' },
      };
      await page.route('**/v1/payments?*', (route) => route.fulfill({ json: { payments: [payment] } }));
      await page.route('**/v1/payments/card-*', (route) => route.fulfill({ json: { payment } }));
      await page.route(`**/v1/card-${issuance ? 'issues' : 'top-ups'}/journey-1`, (route) => {
        requests++;
        if (unavailable) return route.fulfill({ status: 503, json: {} });
        const order = {
          id: 'journey-1',
          cardTypeId: 'apple_google_pay',
          cardId: 'card-1',
          name: 'bru',
          status: `${prefix}_STATUS_${current === stages.length ? 'COMPLETED' : current === (issuance ? 3 : 1) ? 'FUNDING' : issuance ? 'ISSUING' : 'TOPPING_UP'}`,
          stage: `${prefix}_STAGE_${stages[Math.min(current, stages.length - 1)]}`,
          price: { amount: '5', currency: 'USD' },
          amount: { amount: '5', currency: 'USD' },
          fee: { amount: '1', currency: 'USD' },
          steps: stages.map((stage, index) => ({
            stage: `${prefix}_STAGE_${stage}`,
            status: `${prefix}_STEP_STATUS_${index < current ? 'COMPLETED' : index === current ? 'CURRENT' : 'UPCOMING'}`,
            completedAt: index < current ? '2026-10-03T17:41:49Z' : null,
          })),
        };
        return route.fulfill({ json: issuance ? { issue: order } : { topUp: order } });
      });
      await page.goto('/cabinet');
      const row = page.getByRole('button', { name: /Открыть платёж/ });
      await row.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Детали платежа' });
      if (!issuance) {
        await expect(dialog.getByRole('tab', { name: 'Прогресс' })).toHaveCount(0);
        await expect(dialog.getByRole('progressbar')).toHaveCount(0);
        expect(requests).toBe(0);
        await page.keyboard.press('Escape');
        await expect(row).toBeFocused();
        return;
      }
      await expect(dialog.getByRole('tab', { name: 'Прогресс' })).toBeVisible();
      expect(requests).toBe(0);
      await dialog.getByRole('tab', { name: 'Прогресс' }).click();
      await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', issuance ? '50' : '33');
      current = issuance ? 4 : 2;
      await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
      unavailable = true;
      await expect(
        dialog.getByText('Не удалось обновить статус. Заявка сохранена; не создавайте новую.'),
      ).toBeVisible();
      await expect(dialog.getByRole('progressbar')).toBeVisible();
      unavailable = false;
      await dialog.getByRole('button', { name: 'Обновить', exact: true }).last().click();
      await expect(
        dialog.getByText('Не удалось обновить статус. Заявка сохранена; не создавайте новую.'),
      ).toHaveCount(0);
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await mkdir('artifacts/screenshots', { recursive: true });
      await dialog.screenshot({ path: `artifacts/screenshots/payment-${kind}-progress-${width}.png` });
      current = stages.length;
      await expect(dialog.getByText('Карта выпущена.', { exact: false })).toBeVisible();
      await expect(dialog.getByRole('progressbar')).toHaveCount(0);
      const terminalRequests = requests;
      await page.waitForTimeout(3500);
      expect(requests).toBe(terminalRequests);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(row).toBeFocused();
    });
  }
}
