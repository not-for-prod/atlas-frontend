'use client';
import Link from 'next/link';
import { Button, Stack, Title, Text } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { PublicLayout } from '~/widgets/PublicLayout';
import { CardVisual, type CardDesign } from '~/entities/card';
import styles from './Launch.module.css';
export function Launch({ design, showPreview = false }: { design?: CardDesign; showPreview?: boolean }) {
  const intl = useIntl();
  return (
    <PublicLayout>
      <div className={styles.main}>
        <Stack gap="lg" align="center">
          <p className={styles.badge}>
            <FormattedMessage id="landing.hero.badge" />
          </p>
          <Title order={1}>
            <FormattedMessage id="account.title" />
          </Title>
          <Text c="dimmed" maw={500}>
            <FormattedMessage id="account.description" />
          </Text>
          {design && (
            <div className={styles.selection}>
              <CardVisual design={design} presentation="artwork" />
              <Text fw={600} mt="lg">
                <FormattedMessage
                  id="account.selection"
                  values={{ name: intl.formatMessage({ id: `cardDesign.${design}.label` }) }}
                />
              </Text>
              <Text size="sm" c="dimmed" mt="sm">
                <FormattedMessage id="account.selectionNote" />
              </Text>
            </div>
          )}
          <Button component={Link} href="/" color="dark">
            <FormattedMessage id="account.back" />
          </Button>
          {showPreview && (
            <Button component={Link} href="/preview" variant="subtle" color="dark">
              <FormattedMessage id="account.preview" />
            </Button>
          )}
        </Stack>
      </div>
    </PublicLayout>
  );
}
