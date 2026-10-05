import { FormattedMessage } from 'react-intl';
import styles from './Step.module.css';
export function Step({ kind, number }: { kind: 'balance' | 'issue' | 'pay'; number: number }) {
  return (
    <li className={styles.step}>
      <span className={styles.number} aria-hidden="true">
        {number}
      </span>
      <h3>
        <FormattedMessage id={`landing.step.${kind}.title`} />
      </h3>
      <p>
        <FormattedMessage id={`landing.step.${kind}.description`} />
      </p>
    </li>
  );
}
