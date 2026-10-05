import { type Metadata } from 'next';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { type ReactNode } from 'react';
import { Providers } from './providers/Providers';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';
export const metadata: Metadata = { title: 'Атлас — личный кабинет', description: 'Карты и баланс Атласа' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript forceColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
