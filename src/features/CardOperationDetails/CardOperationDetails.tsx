'use client';
import { Badge, Modal, Stack, Table, Text } from '@mantine/core';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { cardOperationTime, formatCardOperationMoney, type CardOperation } from '~/entities/card';
import styles from './CardOperationDetails.module.css';

export function CardOperationDetails({
  operation,
  onClose,
}: {
  operation: CardOperation | null;
  onClose: () => void;
}) {
  const intl = useIntl();
  const type = operation?.type?.replace('CARD_OPERATION_TYPE_', '').toLowerCase() ?? 'unspecified';
  const status = operation?.status?.replace('CARD_OPERATION_STATUS_', '').toLowerCase() ?? 'unspecified';
  const date = cardOperationTime(operation?.transactionTime);
  const unavailable = intl.formatMessage({ id: 'payment.notProvided' });
  return (
    <Modal
      opened={!!operation}
      onClose={onClose}
      title={intl.formatMessage({ id: 'cardOperation.details' })}
      closeButtonProps={{ 'aria-label': intl.formatMessage({ id: 'preview.dialog.close' }) }}
      centered
      size="md"
      radius="xl"
      padding="lg"
    >
      {operation && (
        <Stack>
          <Text ta="center" size="xl" fw={700} className={styles.amount}>
            {formatCardOperationMoney(operation.amount) ||
              intl.formatMessage({ id: 'cardOperation.amountUnavailable' })}
          </Text>
          <Table verticalSpacing="sm" layout="fixed">
            <Table.Tbody>
              <Table.Tr>
                <Table.Th scope="row">
                  <FormattedMessage id="payment.status" />
                </Table.Th>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={
                      status === 'completed'
                        ? 'green'
                        : ['declined', 'canceled'].includes(status)
                          ? 'red'
                          : 'gray'
                    }
                    className={styles.status}
                    classNames={{ label: styles.statusLabel }}
                  >
                    <FormattedMessage id={`cardOperation.status.${status}`} />
                  </Badge>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th scope="row">
                  <FormattedMessage id="payment.operation" />
                </Table.Th>
                <Table.Td>
                  <FormattedMessage id={`cardOperation.type.${type}`} />
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th scope="row">
                  <FormattedMessage id="cardOperation.merchant" />
                </Table.Th>
                <Table.Td className={styles.value}>{operation.merchantName || unavailable}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th scope="row">
                  <FormattedMessage id="cardOperation.fee" />
                </Table.Th>
                <Table.Td className={styles.value}>
                  {formatCardOperationMoney(operation.fee) || unavailable}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th scope="row">
                  <FormattedMessage id="cardOperation.settlement" />
                </Table.Th>
                <Table.Td className={styles.value}>
                  {formatCardOperationMoney(operation.settlement) || unavailable}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th scope="row">
                  <FormattedMessage id="cardOperation.time" />
                </Table.Th>
                <Table.Td className={styles.value}>
                  {date ? (
                    <FormattedDate
                      value={date}
                      year="numeric"
                      month="short"
                      day="numeric"
                      hour="2-digit"
                      minute="2-digit"
                      second="2-digit"
                    />
                  ) : (
                    operation.transactionTime || intl.formatMessage({ id: 'cardOperation.dateUnavailable' })
                  )}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th scope="row">
                  <FormattedMessage id="cardOperation.id" />
                </Table.Th>
                <Table.Td className={styles.value}>{operation.id}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>
      )}
    </Modal>
  );
}
