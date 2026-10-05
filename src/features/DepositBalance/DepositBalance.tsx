'use client';
import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconArrowLeft } from '@tabler/icons-react';
import Image from 'next/image';
import { FormattedMessage, useIntl } from 'react-intl';
import { CryptoDeposit } from '~/features/CryptoDeposit';
import { formatUsd } from '~/entities/client-asset';
import { PaymentMethodRow } from '~/shared/ui/PaymentMethodRow';
import { PaymentPreview } from './components/PaymentPreview';
import { parseDepositAmount } from './lib/utils/parseDepositAmount';
import styles from './DepositBalance.module.css';

export function DepositBalance({ onClose }: { onClose: () => void }) {
  const intl = useIntl();
  const [amount, setAmount] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    (amount ? previewRef.current : inputRef.current)?.focus();
  }, [amount]);
  const form = useForm({
    initialValues: { amount: '' },
    validate: {
      amount: (value) =>
        parseDepositAmount(value) ? null : intl.formatMessage({ id: 'deposit.invalidAmount' }),
    },
  });

  if (!amount)
    return (
      <form onSubmit={form.onSubmit(({ amount: input }) => setAmount(parseDepositAmount(input)))}>
        <Stack>
          <TextInput
            ref={inputRef}
            data-autofocus
            label={intl.formatMessage({ id: 'deposit.amount' })}
            description={intl.formatMessage({ id: 'deposit.amountHint' })}
            inputMode="decimal"
            autoComplete="off"
            maxLength={256}
            placeholder="100,00"
            {...form.getInputProps('amount')}
          />
          <Button type="submit">
            <FormattedMessage id="deposit.continue" />
          </Button>
        </Stack>
      </form>
    );

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            <FormattedMessage id="deposit.received" />
          </Text>
          <Text fw={700} size="xl" className={styles.amount}>
            {formatUsd(amount)}
          </Text>
        </Stack>
        <Button
          variant="subtle"
          color="dark"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => setAmount(undefined)}
        >
          <FormattedMessage id="deposit.editAmount" />
        </Button>
      </Group>
      <Title ref={previewRef} tabIndex={-1} order={2} size="h4">
        <FormattedMessage id="deposit.preview" />
      </Title>
      <ul className={styles.methods}>
        <CryptoDeposit onClose={onClose} preview={<PaymentPreview amount={amount} />} />
        <PaymentMethodRow
          icon={<Image src="/payment-methods/sbp.svg" width={28} height={32} alt="" />}
          title={<FormattedMessage id="cabinet.deposit.bank" />}
          description={<FormattedMessage id="crypto.bankUnavailable" />}
          action={
            <Badge color="gray" variant="light" size="lg">
              <FormattedMessage id="cabinet.deposit.unavailable" />
            </Badge>
          }
        />
      </ul>
    </Stack>
  );
}
