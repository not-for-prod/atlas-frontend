import { test as base, expect } from '@playwright/test';
export { expect };
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.addCookies([
      { name: 'atlas_session', value: 'test-issued-bearer', url: 'http://127.0.0.1:3112', httpOnly: true },
    ]);
    await provide(context);
  },
});
