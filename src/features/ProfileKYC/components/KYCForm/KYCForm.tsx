import { Alert, Button, NativeSelect, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FormattedMessage, useIntl } from 'react-intl';
import { KYCRequestError, useSaveKYC, getPassportCountries, type PassportCountry } from '~/entities/kyc';
export function KYCForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const intl = useIntl();
  const save = useSaveKYC();
  const form = useForm({
    validate: {
      passport: {
        issuingCountry: (value) => (value ? null : intl.formatMessage({ id: 'kyc.countryRequired' })),
      },
    },
    initialValues: {
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      middleName: '',
      birthDate: '',
      passport: {
        issuingCountry: undefined as PassportCountry | undefined,
        number: '',
        issueDate: '',
        expiryDate: '',
      },
    },
  });
  const label = (field: string) => intl.formatMessage({ id: `kyc.${field}` });
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form
      autoComplete="off"
      onSubmit={form.onSubmit((values) => save.mutate(values, { onSuccess: onSaved }))}
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label={label('email')}
            data-autofocus
            type="email"
            required
            maxLength={254}
            {...form.getInputProps('email')}
          />
          <TextInput
            label={label('phone')}
            type="tel"
            placeholder="+79991234567"
            required
            pattern="\+[1-9][0-9]{6,14}"
            {...form.getInputProps('phone')}
          />
          <TextInput
            label={label('firstName')}
            required
            maxLength={100}
            {...form.getInputProps('firstName')}
          />
          <TextInput label={label('lastName')} required maxLength={100} {...form.getInputProps('lastName')} />
          <TextInput label={label('middleName')} maxLength={100} {...form.getInputProps('middleName')} />
          <TextInput
            label={label('birthDate')}
            type="date"
            required
            max={today}
            {...form.getInputProps('birthDate')}
          />
          <NativeSelect
            size="md"
            radius="md"
            label={label('country')}
            required
            data={[
              { value: '', label: intl.formatMessage({ id: 'kyc.chooseCountry' }), disabled: true },
              ...getPassportCountries(intl.locale),
            ]}
            {...form.getInputProps('passport.issuingCountry')}
            value={form.values.passport.issuingCountry ?? ''}
          />
          <TextInput
            label={label('number')}
            required
            maxLength={50}
            {...form.getInputProps('passport.number')}
          />
          <TextInput
            label={label('issueDate')}
            type="date"
            required
            max={today}
            {...form.getInputProps('passport.issueDate')}
          />
          <TextInput label={label('expiryDate')} type="date" {...form.getInputProps('passport.expiryDate')} />
        </SimpleGrid>
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
