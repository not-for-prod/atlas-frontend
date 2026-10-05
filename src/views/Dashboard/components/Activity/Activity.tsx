import { FormattedMessage } from 'react-intl';
import { type ActivityItem } from '../../model';
import { ActivityRow } from './components';
import styles from './Activity.module.css';
export function Activity({ items }: { items: ActivityItem[] }) {
  return (
    <section className={styles.section}>
      <h2>
        <FormattedMessage id="activity.title" />
      </h2>
      <p>
        <FormattedMessage id="activity.note" />
      </p>
      {items.length ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <FormattedMessage id="state.emptyActivity" />
        </div>
      )}
    </section>
  );
}
