'use client';

import { type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { type CardDesign } from '../../model';
import { type CardPalette } from '../../model/tariff';
import styles from './CardVisual.module.css';
export function CardVisual({
  design = 'premium',
  palette,
  presentation = 'preview',
  balance,
  label,
  status,
  typeName,
  actions,
}: {
  design?: CardDesign | 'neutral';
  palette?: CardPalette;
  presentation?: 'preview' | 'artwork' | 'owned';
  label?: string;
  status?: ReactNode;
  typeName?: string;
  actions?: ReactNode;
  balance?: ReactNode;
}) {
  const intl = useIntl();
  const name = label || intl.formatMessage({ id: `cardDesign.${design}.label` });
  function resetTilt({ currentTarget: card }: PointerEvent<HTMLDivElement>) {
    delete card.dataset.tilting;
    for (const property of ['--tilt-x', '--tilt-y', '--glare-x', '--glare-y']) {
      card.style.removeProperty(property);
    }
  }

  function moveTilt(event: PointerEvent<HTMLDivElement>) {
    if (balance || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      resetTilt(event);
      return;
    }

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    card.dataset.tilting = 'true';
    card.style.setProperty('--tilt-y', `${((x - 0.5) * 20).toFixed(2)}deg`);
    card.style.setProperty('--tilt-x', `${((0.5 - y) * 20).toFixed(2)}deg`);
    card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
  }

  return (
    <div
      className={`${styles.card} ${styles[design]}`}
      style={
        palette
          ? ({
              '--visual-bg': palette.background,
              '--visual-ink': palette.foreground,
              '--visual-sub': palette.foreground,
              '--visual-dot': palette.foreground,
              '--visual-orb': 'currentColor',
            } as CSSProperties)
          : undefined
      }
      data-presentation={presentation}
      data-palette={palette ? 'configured' : undefined}
      onPointerMove={moveTilt}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
      role={balance ? 'group' : 'img'}
      aria-label={
        presentation === 'preview'
          ? intl.formatMessage({ id: 'a11y.card' })
          : presentation === 'owned'
            ? name
            : intl.formatMessage({ id: 'cardDesign.artwork' }, { name })
      }
    >
      <div className={styles.top}>
        {presentation === 'owned' ? (
          <span className={styles.ownedBrand}>
            <FormattedMessage id="brand" />
            <b>.</b>
          </span>
        ) : (
          name
        )}
        {actions || <span className={styles.symbol} aria-hidden="true" />}
      </div>
      {presentation === 'owned' && (
        <div className={styles.cardName} title={name}>
          {name}
        </div>
      )}
      {balance ? (
        <div className={styles.balance}>{balance}</div>
      ) : (
        <>
          <div className={styles.chip} aria-hidden="true" />
          {presentation === 'preview' && <span className={styles.number}>•• ••••</span>}
        </>
      )}
      <div className={styles.bottom}>
        {presentation === 'owned' ? (
          <span className={styles.typeName}>{typeName}</span>
        ) : (
          <span className={styles.brand}>
            <FormattedMessage id="brand" />
            <b>.</b>
          </span>
        )}
        {presentation === 'owned' && <span className={styles.demo}>{status}</span>}
        {presentation === 'preview' && (
          <span className={styles.demo}>
            <FormattedMessage id="cards.demo" />
          </span>
        )}
      </div>
    </div>
  );
}
