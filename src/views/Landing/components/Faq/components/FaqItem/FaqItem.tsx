import { FormattedMessage } from 'react-intl';
import styles from './FaqItem.module.css';
export function FaqItem({ topic }: { topic: 'launch' | 'price' | 'balance' | 'wallet' | 'methods' }) {
  return (
    <details className={styles.item}>
      <summary>
        <FormattedMessage id={`landing.faq.${topic}.question`} />
        <span aria-hidden="true">+</span>
      </summary>
      <p>
        <FormattedMessage id={`landing.faq.${topic}.answer`} />
      </p>
    </details>
  );
}
