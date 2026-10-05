'use client';
import { Accordion, Button, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import styles from '../../Cabinet.module.css';
export function CabinetSupport() {
  const intl = useIntl();
  const [reviewed, setReviewed] = useState(false);
  const form = useForm({
    initialValues: { question: '' },
    validate: {
      question: (value) =>
        value.trim().length < 10 ? intl.formatMessage({ id: 'cabinet.support.validation' }) : null,
    },
  });
  return (
    <Stack>
      <form className={styles.panel} onSubmit={form.onSubmit(() => setReviewed(true))}>
        <Stack>
          <Textarea
            label={intl.formatMessage({ id: 'cabinet.support.question' })}
            placeholder={intl.formatMessage({ id: 'cabinet.support.placeholder' })}
            minRows={4}
            maxLength={2000}
            {...form.getInputProps('question')}
          />
          <Text size="xs" c="dimmed">
            <FormattedMessage id="cabinet.support.local" />
          </Text>
          <Button type="submit" color="dark">
            <FormattedMessage id="cabinet.support.review" />
          </Button>
          {reviewed && (
            <Text role="status" size="sm">
              <FormattedMessage id="cabinet.support.result" />
            </Text>
          )}
        </Stack>
      </form>
      <Accordion variant="separated">
        {['balance', 'price', 'wallet'].map((id) => (
          <Accordion.Item value={id} key={id}>
            <Accordion.Control>
              <FormattedMessage id={`landing.faq.${id}.question`} />
            </Accordion.Control>
            <Accordion.Panel>
              <FormattedMessage id={`landing.faq.${id}.answer`} />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}
