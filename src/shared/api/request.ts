import ky from 'ky';
// Same-origin transport only. Session behavior must be agreed before live integration.
export const request = ky.create({ timeout: 15000, retry: 0, credentials: 'same-origin' });
