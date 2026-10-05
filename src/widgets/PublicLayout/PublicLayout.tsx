import { type ReactNode } from 'react';
import { PageContainer } from '~/shared/ui/PageContainer';
import { PublicHeader } from '~/widgets/PublicHeader';
import { PublicFooter } from '~/widgets/PublicFooter';
import styles from './PublicLayout.module.css';
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer>
      <PublicHeader />
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <PublicFooter />
    </PageContainer>
  );
}
