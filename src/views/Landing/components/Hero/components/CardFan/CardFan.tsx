import { CardVisual } from '~/entities/card';
import styles from './CardFan.module.css';
export function CardFan() {
  return (
    <div className={styles.fan} aria-hidden="true">
      <div className={styles.travel}>
        <CardVisual design="travel" presentation="artwork" />
      </div>
      <div className={styles.premium}>
        <CardVisual design="premium" presentation="artwork" />
      </div>
      <div className={styles.subscriptions}>
        <CardVisual design="subscriptions" presentation="artwork" />
      </div>
    </div>
  );
}
