import styles from './CardLoading.module.css';
export function CardLoading() {
  return (
    <div className={styles.card} aria-hidden="true">
      <span className={styles.chip} />
      <span className={styles.name} />
      <div className={styles.number}>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className={styles.bottom}>
        <span />
        <span />
      </div>
    </div>
  );
}
