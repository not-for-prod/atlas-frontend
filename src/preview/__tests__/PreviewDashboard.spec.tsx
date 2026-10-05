import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { IntlProvider } from 'react-intl';
import messages from '../../../dictionaries/ru.json';
import { BalanceVisibilityProvider } from '~/shared/ui/BalanceVisibilityProvider';
import { PreviewDashboard } from '../PreviewDashboard';
describe('PreviewDashboard', () => {
  it('hides account amounts until requested and opens an honest preview action dialog', async () => {
    const user = userEvent.setup();
    render(
      <IntlProvider locale="ru" messages={messages}>
        <MantineProvider env="test">
          <BalanceVisibilityProvider>
            <PreviewDashboard />
          </BalanceVisibilityProvider>
        </MantineProvider>
      </IntlProvider>,
    );
    expect(screen.queryByText(/1\s250,50 \$/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Показать баланс' }));
    expect(screen.getByText(/1\s250,50 \$/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скрыть баланс' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Пополнить баланс' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Деньги не списываются');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('shows unavailable data rather than fake zeroes on error, then supports the demo retry', async () => {
    const user = userEvent.setup();
    render(
      <IntlProvider locale="ru" messages={messages}>
        <MantineProvider env="test">
          <BalanceVisibilityProvider>
            <PreviewDashboard />
          </BalanceVisibilityProvider>
        </MantineProvider>
      </IntlProvider>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Сценарий' }));
    await user.click(await screen.findByRole('option', { name: 'Ошибка' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Баланс недоступен');
    expect(screen.queryByRole('button', { name: 'Показать баланс' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(screen.getByRole('button', { name: 'Показать баланс' })).toBeInTheDocument();
  });
});
