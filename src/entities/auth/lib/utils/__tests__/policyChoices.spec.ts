import { describe, it, expect } from 'vitest';
import { policyChoices, supportedChoice } from '../policyChoices';
describe('policy choices', () => {
  it('inherits the nearest group scope and preserves configured provider choices', () => {
    const choices = policyChoices({
      id: 'primary',
      any: [
        { method: 'email_code' },
        {
          id: 'social',
          any: [
            { method: 'oauth', provider: 'yandex' },
            { method: 'oauth', provider: 'telegram' },
          ],
        },
      ],
    });
    expect(choices).toEqual([
      { requirementId: 'primary', methodId: 'email_code', providerId: '' },
      { requirementId: 'social', methodId: 'oauth', providerId: 'yandex' },
      { requirementId: 'social', methodId: 'oauth', providerId: 'telegram' },
    ]);
  });
  it('does not create fallback methods for empty or unknown policies', () => {
    expect(policyChoices()).toEqual([]);
    expect(supportedChoice({ requirementId: 'primary', methodId: 'password' })).toBe(false);
  });
});
