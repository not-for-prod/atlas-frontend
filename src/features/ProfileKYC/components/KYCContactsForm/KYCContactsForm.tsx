import { Alert, Button, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FormattedMessage, useIntl } from 'react-intl';
import { KYCRequestError, useSaveKYCContacts } from '~/entities/kyc';
export function KYCContactsForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const intl = useIntl();
  const save = useSaveKYCContacts();
  const form = useForm({
    initialValues: { email: '' },
    validate: {
      email: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : intl.formatMessage({ id: 'kyc.invalidEmail' }),
    },
  });
  return (
    <form onSubmit={form.onSubmit((values) => save.mutate(values, { onSuccess: onSaved }))}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          <FormattedMessage id="kyc.contactsHelp" />
        </Text>
        <TextInput
          label={intl.formatMessage({ id: 'kyc.email' })}
          data-autofocus
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          disabled={save.isPending}
          {...form.getInputProps('email')}
        />
        {save.isError && (
          <Alert color="red" role="alert">
            <FormattedMessage
              id={
                save.error instanceof KYCRequestError && save.error.status === 400
                  ? 'kyc.invalid'
                  : 'kyc.saveError'
              }
            />
          </Alert>
        )}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Button type="submit" loading={save.isPending}>
            <FormattedMessage id="kyc.save" />
          </Button>
          <Button variant="default" disabled={save.isPending} onClick={onCancel}>
            <FormattedMessage id="kyc.cancel" />
          </Button>
        </SimpleGrid>
      </Stack>
    </form>
  );
}
