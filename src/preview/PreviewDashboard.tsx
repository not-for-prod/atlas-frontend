'use client';
import { useState } from 'react';
import { Button, Modal, Select, Text, Stack } from '@mantine/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { Dashboard } from '~/views/Dashboard';
import { PreviewShell } from '~/widgets/PreviewShell';
import { scenarios, snapshots, type Scenario } from './fixtures';
import styles from './PreviewDashboard.module.css';
export function PreviewDashboard() {
  const [scenario, setScenario] = useState<Scenario>('ready');
  const [opened, setOpened] = useState(false);
  const intl = useIntl();
  return (
    <PreviewShell active="dashboard">
      <div className={styles.controls}>
        <Select
          label={intl.formatMessage({ id: 'preview.scenario' })}
          value={scenario}
          allowDeselect={false}
          data={scenarios.map((value) => ({ value, label: intl.formatMessage({ id: `scenario.${value}` }) }))}
          onChange={(value) => {
            if (scenarios.includes(value as Scenario)) setScenario(value as Scenario);
          }}
          size="xs"
          w={190}
        />
      </div>
      <Dashboard
        key={scenario}
        snapshot={snapshots[scenario]}
        onAction={() => setOpened(true)}
        onRetry={() => setScenario('ready')}
      />
      <Modal
        closeButtonProps={{ 'aria-label': intl.formatMessage({ id: 'preview.dialog.close' }) }}
        opened={opened}
        onClose={() => setOpened(false)}
        title={intl.formatMessage({ id: 'preview.dialog.title' })}
      >
        <Stack>
          <Text size="sm">
            <FormattedMessage id="preview.dialog.description" />
          </Text>
          <Button color="dark" onClick={() => setOpened(false)}>
            <FormattedMessage id="preview.dialog.close" />
          </Button>
        </Stack>
      </Modal>
    </PreviewShell>
  );
}
