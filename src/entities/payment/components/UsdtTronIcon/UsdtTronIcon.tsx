import Image from 'next/image';
import styles from './UsdtTronIcon.module.css';

export function UsdtTronIcon({ size = 44 }: { size?: number }) {
  const networkSize = Math.round((size * 13) / 44);
  return (
    <span className={styles.icon} style={{ width: size, height: size }} role="img" aria-label="USDT · TRON">
      <Image src="/payment-methods/usdt.svg" width={size} height={size} alt="" />
      <span className={styles.network}>
        <Image src="/payment-methods/tron.svg" width={networkSize} height={networkSize} alt="" />
      </span>
    </span>
  );
}
