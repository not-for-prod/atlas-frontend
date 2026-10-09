import jsQR from 'jsqr';
import { expect, test } from './fixtures/cabinet';
for (const width of [375, 1440]) {
  test(`SBP quote, Checkout and server confirmation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const preview = {
      id: 'quote',
      amount: { amount: '1000.01', currency: 'RUB' },
      fee: { amount: '10', currency: 'RUB' },
      credit: { amount: '9.9', currency: 'USD' },
      exchangeRate: '0.01',
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };
    const payment = {
      ...preview,
      id: 'payment',
      previewId: 'quote',
      status: 'pending',
      paymentLink: 'https://app.pay.hot/checkout#private-token',
      createdAt: '2026-10-07T00:00:00Z',
      updatedAt: '2026-10-07T00:00:00Z',
    };
    let creates = 0;
    let qrReads = 0;
    const qrUrl = 'https://qr.nspk.ru/ATLAS1234?type=02&sum=100001&cur=RUB';
    let completed = false;
    await page.route('**/v1/payments/sbp/previews', (route) => {
      expect(route.request().postDataJSON()).toEqual({ usdAmount: '9.90' });
      preview.expiresAt = new Date(Date.now() + 30000).toISOString();
      return route.fulfill({ json: { preview } });
    });
    await page.route('**/v1/payments/sbp', (route) => {
      creates++;
      expect(route.request().postDataJSON()).toEqual({ previewId: 'quote' });
      return route.fulfill({ json: { payment } });
    });
    await page.route('**/v1/payments/sbp/payment', (route) =>
      route.fulfill({ json: { payment: { ...payment, status: completed ? 'completed' : 'pending' } } }),
    );
    await page.route('**/v1/payments/sbp/payment/qr', (route) => {
      qrReads++;
      return route.fulfill({
        json: {
          qr:
            qrReads === 1
              ? { status: 'SBP_QR_STATUS_PENDING' }
              : {
                  status: 'SBP_QR_STATUS_AVAILABLE',
                  url: qrUrl,
                  expiresAt: new Date(Date.now() + 60000).toISOString(),
                },
        },
      });
    });
    await page.goto('/cabinet');
    const trigger = page.getByRole('button', { name: 'Пополнить баланс', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Сколько хотите получить на баланс, USD').fill('9,90');
    await dialog.getByRole('button', { name: 'Посмотреть способы оплаты' }).click();
    const sbp = dialog.getByRole('button', { name: 'СБП', exact: true });
    await sbp.focus();
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('heading', { name: 'СБП', exact: true })).toBeFocused();
    await expect(dialog.getByRole('textbox')).toHaveCount(0);
    await expect(dialog.getByText('9,90 USD')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Создать платёж' })).toHaveCount(0);
    await expect(dialog.getByText('Комиссия Atlas')).toHaveCount(0);
    await expect(dialog.getByText('1 USD ≈ 101,01 RUB')).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Открыть оплату СБП' })).toHaveAttribute(
      'href',
      payment.paymentLink,
    );
    await expect(dialog.getByText('Ожидаем оплату')).toBeVisible();
    await expect(dialog.getByRole('timer')).toHaveCount(0);
    const qr = dialog.getByRole('img', { name: 'QR-код для оплаты СБП' });
    await expect(qr).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByRole('link', { name: 'Оплатить в приложении банка' })).toHaveAttribute(
      'href',
      qrUrl,
    );
    const pixels = await qr.evaluate(async (svg) => {
      const url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }),
      );
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return {
          data: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data),
          width: canvas.width,
          height: canvas.height,
        };
      } finally {
        URL.revokeObjectURL(url);
      }
    });
    expect(jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data).toBe(qrUrl);
    expect(creates).toBe(1);
    await page.screenshot({ path: `artifacts/screenshots/sbp-quote-${width}.png`, animations: 'disabled' });
    completed = true;
    await expect(dialog.getByText('Платёж подтверждён')).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByRole('link', { name: 'Открыть оплату СБП' })).toHaveCount(0);
    await expect(qr).toHaveCount(0);
    expect(creates).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({
      path: `artifacts/screenshots/sbp-confirmed-${width}.png`,
      animations: 'disabled',
    });
    await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await expect(trigger).toBeFocused();
  });
}
