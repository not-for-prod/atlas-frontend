import { Button, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FormattedMessage, useIntl } from 'react-intl';
export function EmailForm({ pending, onSubmit }: { pending: boolean; onSubmit: (email: string) => void }) {
  const intl = useIntl();
  const form = useForm({
    initialValues: { email: '' },
    validate: {
      email: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? null
          : intl.formatMessage({ id: 'auth.email.invalid' }),
    },
  });
  return (
    <form onSubmit={form.onSubmit(({ email }) => onSubmit(email.trim()))}>
      <Stack gap="md">
        <TextInput
          label={intl.formatMessage({ id: 'auth.email' })}
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          disabled={pending}
          {...form.getInputProps('email')}
        />
        <Button type="submit" color="dark" loading={pending}>
          <FormattedMessage id="auth.send" />
        </Button>
      </Stack>
    </form>
  );
}
