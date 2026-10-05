import { Box, Group, Stack, Text } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import styles from './OperationProgress.module.css';

export type OperationStep = {
  id: string;
  label: string;
  status: 'upcoming' | 'current' | 'completed' | 'failed';
  completedAt?: string;
};
export function OperationProgress({
  steps,
  label,
  unknownStageMessage,
  compact = false,
}: {
  steps: OperationStep[];
  label: string;
  unknownStageMessage?: string;
  compact?: boolean;
}) {
  const intl = useIntl();
  const completed = steps.filter((step) => step.status === 'completed').length;
  return (
    <Stack gap={compact ? 4 : 'sm'}>
      <Text size={compact ? 'xs' : 'sm'} fw={500} c={compact ? 'inherit' : undefined}>
        <FormattedMessage id="issuance.progress" values={{ completed, total: steps.length }} />
      </Text>
      <Box
        className={styles.progress}
        data-compact={compact || undefined}
        role="progressbar"
        aria-valuenow={Math.round((completed / steps.length) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={intl.formatMessage({ id: label })}
      >
        {steps.map((step) => (
          <Box
            key={step.id}
            className={styles.segment}
            data-completed={step.status === 'completed' || undefined}
          />
        ))}
      </Box>
      {!compact && (
        <Stack
          component="ol"
          gap={0}
          m={0}
          p={0}
          className={styles.steps}
          aria-label={intl.formatMessage({ id: label })}
        >
          {steps.map((step, index) => {
            const done = step.status === 'completed';
            const error = step.status === 'failed';
            const current = step.status === 'current';
            return (
              <Group
                component="li"
                key={step.id}
                wrap="nowrap"
                align="flex-start"
                gap="sm"
                className={styles.step}
                data-status={step.status}
                aria-current={current || error ? 'step' : undefined}
              >
                <Box component="span" className={styles.marker} aria-hidden="true">
                  {done ? <IconCheck size={16} /> : error ? <IconX size={16} /> : index + 1}
                </Box>
                <Stack gap={2}>
                  <Text size="sm" fw={current ? 500 : 400} className={styles.stepTitle}>
                    <FormattedMessage id={step.label} />
                  </Text>
                  <Text size="xs" c={error ? 'red' : 'dimmed'}>
                    <FormattedMessage id={`operation.step.${step.status}`} />
                    {step.completedAt && (
                      <>
                        {' '}
                        ·{' '}
                        <FormattedDate
                          value={step.completedAt}
                          day="2-digit"
                          month="2-digit"
                          hour="2-digit"
                          minute="2-digit"
                        />
                      </>
                    )}
                  </Text>
                </Stack>
              </Group>
            );
          })}
        </Stack>
      )}
      {unknownStageMessage && (
        <Text size="sm" c="dimmed">
          <FormattedMessage id={unknownStageMessage} />
        </Text>
      )}
    </Stack>
  );
}
