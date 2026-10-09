'use client';
import { useEffect, useRef, useState } from 'react';
import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconArrowLeft, IconChevronRight } from '@tabler/icons-react';
import Image from 'next/image';
import { FormattedMessage, useIntl } from 'react-intl';
import { CryptoDeposit } from '~/features/CryptoDeposit';
import { formatUsd } from '~/entities/client-asset';
import { UsdtTronIcon } from '~/entities/payment';
import { PaymentMethodRow } from '~/shared/ui/PaymentMethodRow';
import { SbpDeposit } from './components/SbpDeposit';
import { PaymentPreview } from './components/PaymentPreview';
import { parseDepositAmount } from './lib/utils/parseDepositAmount';
import styles from './DepositBalance.module.css';

export function DepositBalance({ onClose }: { onClose: () => void }) {
  const intl = useIntl();
  const [method, setMethod] = useState<'sbp' | 'crypto'>();
  const [amount, setAmount] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const editAmountRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    (amount ? editAmountRef.current : inputRef.current)?.focus();
  }, [amount, method]);
  const form = useForm({
    initialValues: { amount: '' },
    validate: {
      amount: (value) =>
        parseDepositAmount(value) ? null : intl.formatMessage({ id: 'deposit.invalidAmount' }),
    },
  });

  if (method === 'sbp' && amount)
    return <SbpDeposit amount={amount} onBack={() => setMethod(undefined)} onClose={onClose} />;
  if (method === 'crypto' && amount)
    return (
      <CryptoDeposit
        onClose={onClose}
        onBack={() => setMethod(undefined)}
        preview={<PaymentPreview amount={amount} />}
      />
    );

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
          ref={editAmountRef}
          variant="subtle"
          color="dark"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => setAmount(undefined)}
        >
          <FormattedMessage id="deposit.editAmount" />
        </Button>
      </Group>
      <ul className={styles.methods}>
        <PaymentMethodRow
          icon={<UsdtTronIcon size={32} />}
          title={<FormattedMessage id="cabinet.deposit.crypto" />}
          description={<FormattedMessage id="crypto.methodNote" />}
          onSelect={() => setMethod('crypto')}
          selectionLabel={
            intl.formatMessage({ id: 'cabinet.deposit.crypto' }) +
            ' — ' +
            intl.formatMessage({ id: 'crypto.generate' })
          }
          action={<IconChevronRight size={22} aria-hidden="true" />}
        />
        <PaymentMethodRow
          icon={<Image src="/payment-methods/sbp.svg" width={28} height={32} alt="" />}
          title={<FormattedMessage id="cabinet.deposit.bank" />}
          description={<FormattedMessage id="sbp.methodNote" />}
          onSelect={() => setMethod('sbp')}
          selectionLabel={intl.formatMessage({ id: 'cabinet.deposit.bank' })}
          action={<IconChevronRight size={22} aria-hidden="true" />}
        />
      </ul>
    </Stack>
  );
}
