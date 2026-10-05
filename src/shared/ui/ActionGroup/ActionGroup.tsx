import { type ReactNode } from 'react';
import styles from './ActionGroup.module.css';
export function ActionGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.group} ${className}`}>{children}</div>;
}
