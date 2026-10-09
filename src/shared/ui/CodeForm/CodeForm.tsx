import { Button, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FormattedMessage, useIntl } from 'react-intl';
export function CodeForm({
  pending,
  onSubmit,
  onRestart,
}: {
  pending: boolean;
  onSubmit: (code: string) => void;
  onRestart: () => void;
}) {
  const intl = useIntl();
  const form = useForm({
    initialValues: { code: '' },
    validate: {
      code: (value) => (/^\d{6}$/.test(value) ? null : intl.formatMessage({ id: 'auth.code.invalid' })),
    },
  });
  return (
    <form onSubmit={form.onSubmit(({ code }) => onSubmit(code))}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          <FormattedMessage id="auth.code.help" />
        </Text>
        <TextInput
          label={intl.formatMessage({ id: 'auth.code' })}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          disabled={pending}
          {...form.getInputProps('code')}
        />
        <Button type="submit" color="dark" loading={pending}>
          <FormattedMessage id="auth.verify" />
        </Button>
        <Button variant="subtle" color="dark" disabled={pending} onClick={onRestart}>
          <FormattedMessage id="auth.restart" />
        </Button>
      </Stack>
    </form>
  );
}
