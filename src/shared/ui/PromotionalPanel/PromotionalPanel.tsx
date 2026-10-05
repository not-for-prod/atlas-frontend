import { type ComponentPropsWithoutRef } from 'react';
import styles from './PromotionalPanel.module.css';
export function PromotionalPanel({ className, ...props }: ComponentPropsWithoutRef<'section'>) {
  return <section {...props} className={[styles.panel, className].filter(Boolean).join(' ')} />;
}
