import { FormattedMessage } from 'react-intl';
import { Principle } from './components';
import styles from './Principles.module.css';
export function Principles() {
  return (
    <section className={styles.section} aria-labelledby="principles-title">
      <h2 id="principles-title">
        <FormattedMessage id="landing.facts.title" />
      </h2>
      <ul className={styles.facts}>
        {(['cost', 'balance', 'status', 'support'] as const).map((kind) => (
          <Principle key={kind} kind={kind} />
        ))}
      </ul>
    </section>
  );
}
