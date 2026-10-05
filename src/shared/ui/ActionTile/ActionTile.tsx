import { type ReactNode, type Ref } from 'react';
import { IconArrowUpRight } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';
import styles from './ActionTile.module.css';
export function ActionTile({
  ref,
  label,
  icon,
  accent = false,
  inline = false,
  disabled = false,
  onSelect,
}: {
  ref?: Ref<HTMLButtonElement>;
  label: string;
  icon: ReactNode;
  accent?: boolean;
  inline?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`${styles.tile} ${accent ? styles.accent : ''} ${inline ? styles.inline : ''}`}
      onClick={onSelect}
    >
      <span className={styles.icons} aria-hidden="true">
        {icon}
        {!inline && <IconArrowUpRight size={16} />}
      </span>
      <span className={styles.label}>
        <FormattedMessage id={label} />
      </span>
    </button>
  );
}
