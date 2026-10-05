import { IconArrowUpRight } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';
import styles from './Principle.module.css';
export function Principle({ kind }: { kind: 'cost' | 'balance' | 'status' | 'support' }) {
  return (
    <li className={styles.fact}>
      <IconArrowUpRight size={20} aria-hidden="true" />
      <div>
        <h3>
          <FormattedMessage id={`landing.fact.${kind}.title`} />
        </h3>
        <p>
          <FormattedMessage id={`landing.fact.${kind}.description`} />
        </p>
      </div>
    </li>
  );
}
