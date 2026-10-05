import { mkdir } from 'node:fs/promises';
import { expect, test } from './fixtures/cabinet';
import jsQR from 'jsqr';
for (const width of [375, 1440]) {
  test(`deposit QR decodes to the returned address at ${width}px`, async ({ page }) => {
    const address =
      width === 375 ? 'TNsDDtXigxcNbicsG7C5c1EiCah9vfHAcs' : 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8';
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/v1/payments/crypto-deposit-addresses', (route) =>
      route.fulfill({
        json: { walletId: 'test-wallet', requisite: { currency: 'USDT', network: 'tron', address } },
      }),
    );
    await page.goto(width === 375 ? '/cabinet/deposit' : '/cabinet');
    const topup = page.getByRole('button', { name: 'Пополнить баланс', exact: true });
    if (width === 1440) await topup.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('img', { name: 'QR-код адреса для перевода' })).toHaveCount(0);
    await page.getByLabel('Сколько хотите получить на баланс, USD').fill('100');
    await page.getByRole('button', { name: 'Посмотреть способы оплаты' }).click();
    await dialog.getByRole('button', { name: /Получить адрес/ }).click();
    const qr = dialog.getByRole('img', { name: 'QR-код адреса для перевода' });
    await expect(qr).toBeVisible();
    await expect(dialog.getByLabel('Адрес для перевода')).toHaveValue(address);
    await expect(dialog.getByText('Адрес готов', { exact: true })).toHaveCount(0);
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
    expect(jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data).toBe(address);
    const copy = dialog.getByRole('button', { name: 'Скопировать адрес' });
    await copy.focus();
    await expect(copy).toBeFocused();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('button', { name: 'Адрес скопирован' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(address);
    await expect(
      dialog.getByText('Отправляйте только USDT в сети TRON (TRC20). Memo не требуется.'),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('artifacts/screenshots', { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/crypto-qr-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await dialog.getByRole('button', { name: 'Я отправил', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL('/cabinet');
    if (width === 1440) await expect(topup).toBeFocused();
  });
}
