import { FormattedMessage } from 'react-intl';
import { Step } from './components';
import styles from './HowItWorks.module.css';
export function HowItWorks() {
  return (
    <section id="how" className={styles.section} aria-labelledby="how-title">
      <h2 id="how-title">
        <FormattedMessage id="landing.how.title" />
      </h2>
      <p>
        <FormattedMessage id="landing.how.description" />
      </p>
      <ol className={styles.steps}>
        {(['balance', 'issue', 'pay'] as const).map((kind, index) => (
          <Step key={kind} kind={kind} number={index + 1} />
        ))}
      </ol>
    </section>
  );
}
