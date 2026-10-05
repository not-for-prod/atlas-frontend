import { Tooltip, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { FormattedMessage, useIntl } from 'react-intl';
import styles from './RequisiteField.module.css';

export function RequisiteField({
  label,
  copyLabel,
  value,
  copyValue = value,
  prominent = false,
  multiline = false,
}: {
  label: string;
  copyLabel: string;
  value?: string;
  copyValue?: string;
  prominent?: boolean;
  multiline?: boolean;
}) {
  const clipboard = useClipboard({ timeout: 2000 });
  const intl = useIntl();
  return (
    <Tooltip label={intl.formatMessage({ id: clipboard.copied ? 'cabinet.card.copied' : copyLabel })}>
      <UnstyledButton
        className={`${styles.field} ${prominent ? styles.prominent : ''} ${multiline ? styles.multiline : ''}`}
        disabled={!copyValue}
        aria-label={intl.formatMessage({ id: copyLabel })}
        onClick={() => copyValue && clipboard.copy(copyValue)}
      >
        <span className={styles.label}>
          <FormattedMessage id={label} />
        </span>
        <span className={styles.row}>
          <span className={styles.value}>{value || '—'}</span>
          {clipboard.copied ? (
            <IconCheck className={styles.icon} size={14} aria-hidden="true" />
          ) : (
            <IconCopy className={styles.icon} size={14} aria-hidden="true" />
          )}
        </span>
        <VisuallyHidden aria-live="polite">
          {clipboard.error ? (
            <FormattedMessage id="cabinet.card.copyError" />
          ) : clipboard.copied ? (
            <FormattedMessage id="cabinet.card.copied" />
          ) : null}
        </VisuallyHidden>
      </UnstyledButton>
    </Tooltip>
  );
}
