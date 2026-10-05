import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../../dictionaries/ru.json';
import { type CardIssue } from '~/entities/card';
import { IssueProgress } from './IssueProgress';

const stages = [
  'CARD_ISSUE_STAGE_RESERVING_FUNDS',
  'CARD_ISSUE_STAGE_REGISTERING_CLIENT',
  'CARD_ISSUE_STAGE_VERIFYING_IDENTITY',
  'CARD_ISSUE_STAGE_FUNDING_ACCOUNT',
  'CARD_ISSUE_STAGE_ISSUING_CARD',
] as const;
function show(issue: CardIssue) {
  return render(
    <MantineProvider>
      <IntlProvider locale="ru" messages={messages}>
        <IssueProgress issue={issue} />
      </IntlProvider>
    </MantineProvider>,
  );
}
describe('issuance journey', () => {
  it('shows earlier completion, failed funding and upcoming issuance from server facts', () => {
    show({
      status: 'CARD_ISSUE_STATUS_FAILED',
      stage: stages[3],
      steps: stages.map((stage, index) => ({
        stage,
        status:
          index < 3
            ? 'CARD_ISSUE_STEP_STATUS_COMPLETED'
            : index === 3
              ? 'CARD_ISSUE_STEP_STATUS_FAILED'
              : 'CARD_ISSUE_STEP_STATUS_UPCOMING',
      })),
    });
    expect(screen.getAllByText('Выполнено')).toHaveLength(3);
    expect(screen.getByText('Ошибка на этом этапе')).toBeVisible();
    expect(screen.getByText('Ожидает выполнения')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  });
  it('distinguishes registration from identity verification', () => {
    show({
      status: 'CARD_ISSUE_STATUS_VERIFYING',
      stage: stages[1],
      steps: stages.map((stage, index) => ({
        stage,
        status:
          index < 1
            ? 'CARD_ISSUE_STEP_STATUS_COMPLETED'
            : index === 1
              ? 'CARD_ISSUE_STEP_STATUS_CURRENT'
              : 'CARD_ISSUE_STEP_STATUS_UPCOMING',
      })),
    });
    expect(screen.getByText('Регистрация у провайдера').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.getByText('Проверка личности').closest('li')).not.toHaveAttribute('aria-current');
  });
  it('does not invent the failed stage of a historical order', () => {
    show({
      status: 'CARD_ISSUE_STATUS_FAILED',
      stage: 'CARD_ISSUE_STAGE_UNSPECIFIED',
      steps: stages.map((stage) => ({ stage, status: 'CARD_ISSUE_STEP_STATUS_UPCOMING' })),
    });
    expect(screen.getByText('Точный этап ошибки для этой заявки не сохранён.')).toBeVisible();
    expect(screen.queryByText('Ошибка на этом этапе')).not.toBeInTheDocument();
  });
  it('hides progress once issuance is complete', () => {
    show({
      status: 'CARD_ISSUE_STATUS_COMPLETED',
      stage: stages[4],
      steps: stages.map((stage) => ({ stage, status: 'CARD_ISSUE_STEP_STATUS_COMPLETED' })),
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
