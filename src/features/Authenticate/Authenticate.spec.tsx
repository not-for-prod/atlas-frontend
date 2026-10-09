import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { Authenticate } from './Authenticate';
const { act } = vi.hoisted(() => ({ act: vi.fn() }));
vi.mock('./lib', () => ({
  useAuthentication: () => ({
    error: 'account_not_found',
    intents: [{ intent: 'INTENT_SIGN_IN' }, { intent: 'INTENT_SIGN_UP' }],
    policy: {},
    session: {},
    retryAfter: 0,
    act,
    retry: vi.fn(),
  }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it('explains missing registration and offers explicit sign-up', () => {
  render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <Authenticate />
      </IntlProvider>
    </MantineProvider>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent(messages['auth.error.account_not_found']);
  expect(screen.queryByText(messages['auth.error.expired'])).not.toBeInTheDocument();
  expect(act).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: messages['auth.goToSignUp'] }));
  expect(act).toHaveBeenCalledWith({ kind: 'intent', intent: 'INTENT_SIGN_UP' }, expect.any(Object));
});
