import { IconAt, IconBrandTelegram, IconBrandYandex, IconLogin } from '@tabler/icons-react';
import styles from './ProviderIcon.module.css';
export function ProviderIcon({ provider }: { provider?: string }) {
  return (
    <span className={styles.icon} data-provider={provider} aria-hidden="true">
      {provider === 'google' ? (
        <svg width="24" height="24" viewBox="0 0 48 48" focusable="false">
          <path
            fill="#4285f4"
            d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11c-.48 2.5-1.92 4.62-4.08 6.04v5h6.6c3.86-3.56 6.09-8.8 6.09-14.54Z"
          />
          <path
            fill="#34a853"
            d="M24 44c5.5 0 10.12-1.82 13.49-4.96l-6.6-5c-1.83 1.22-4.17 1.96-6.89 1.96-5.31 0-9.82-3.58-11.43-8.4H5.75v5.16A20 20 0 0 0 24 44Z"
          />
          <path fill="#fbbc05" d="M12.57 27.6a12 12 0 0 1 0-7.2v-5.16H5.75a20 20 0 0 0 0 17.52l6.82-5.16Z" />
          <path
            fill="#ea4335"
            d="M24 12c3 0 5.69 1.03 7.81 3.04l5.85-5.85A19.5 19.5 0 0 0 24 4 20 20 0 0 0 5.75 15.24l6.82 5.16C14.18 15.58 18.69 12 24 12Z"
          />
        </svg>
      ) : provider === 'yandex' ? (
        <IconBrandYandex size={25} stroke={2.5} />
      ) : provider === 'telegram' ? (
        <IconBrandTelegram size={25} stroke={1.8} />
      ) : provider === 'mailru' ? (
        <IconAt size={25} stroke={2.4} />
      ) : (
        <IconLogin size={24} />
      )}
    </span>
  );
}
