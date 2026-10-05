import { Text } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { type CardRequisites } from '~/entities/card';
import { RequisiteField } from '../RequisiteField';
import styles from './BillingAddressFields.module.css';

export function BillingAddressFields({
  address,
}: {
  address: NonNullable<CardRequisites['billingAddress']>;
}) {
  const intl = useIntl();
  const countryCode = address.countryCode;
  const country =
    countryCode && /^[A-Z]{2}$/.test(countryCode)
      ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode)
      : countryCode;
  return (
    <section
      className={styles.address}
      aria-label={intl.formatMessage({ id: 'cabinet.card.billingAddress' })}
    >
      <Text size="sm" fw={600} mb={12}>
        <FormattedMessage id="cabinet.card.billingAddress" />
      </Text>
      <div className={styles.fields}>
        <div className={styles.street}>
          <RequisiteField
            label="cabinet.card.billingStreet"
            copyLabel="cabinet.card.copyBillingAddress"
            value={address.addressLine1}
            multiline
          />
        </div>
        {address.addressLine2 && (
          <div className={styles.street}>
            <RequisiteField
              label="cabinet.card.billingStreet2"
              copyLabel="cabinet.card.copyBillingStreet2"
              value={address.addressLine2}
              multiline
            />
          </div>
        )}
        <RequisiteField
          label="cabinet.card.billingCity"
          copyLabel="cabinet.card.copyBillingCity"
          value={address.city}
          multiline
        />
        {address.region && (
          <RequisiteField
            label="cabinet.card.billingRegion"
            copyLabel="cabinet.card.copyBillingRegion"
            value={address.region}
            multiline
          />
        )}
        <RequisiteField
          label="cabinet.card.billingPostalCode"
          copyLabel="cabinet.card.copyBillingPostalCode"
          value={address.postalCode}
        />
        <RequisiteField
          label="cabinet.card.billingCountry"
          copyLabel="cabinet.card.copyBillingCountry"
          value={country}
          multiline
        />
      </div>
    </section>
  );
}
