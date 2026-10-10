import { Badge, Group, Stack, Text } from '@mantine/core';
import { FormattedMessage } from 'react-intl';
import { type KYCState } from '~/entities/kyc';
export function KYCStatus({ state }: { state: KYCState }) {
  return (
    <Stack gap="sm" aria-live="polite">
      <Group>
        <Text size="sm">
          <FormattedMessage id="kyc.status" />
        </Text>
        <Badge
          color={
            state.status === 'VERIFICATION_STATUS_APPROVED'
              ? 'green'
              : state.status === 'VERIFICATION_STATUS_DECLINED'
                ? 'red'
                : 'gray'
          }
          variant="light"
        >
          <FormattedMessage id={`kyc.${state.status}`} />
        </Badge>
      </Group>
      {state.requiredChecks.length > 0 && (
        <Stack gap={4}>
          {state.requiredChecks.map((check) => (
            <Group key={check} justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
              <Text size="sm">
                <FormattedMessage id={`kyc.${check}`} />
              </Text>
              <Text flex="0 0 auto" size="sm" c={state.passedChecks.includes(check) ? 'green' : 'dimmed'}>
                <FormattedMessage
                  id={state.passedChecks.includes(check) ? 'kyc.checkPassed' : 'kyc.checkMissing'}
                />
              </Text>
            </Group>
          ))}
        </Stack>
      )}
      <Text size="sm" c="dimmed">
        <FormattedMessage id={state.contactsComplete ? 'kyc.contactsSaved' : 'kyc.contactsMissing'} />
      </Text>
    </Stack>
  );
}
