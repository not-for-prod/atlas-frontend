'use client';
import { useState, type ReactNode } from 'react';
import { BalanceVisibilityContext } from './model/context';
export function BalanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <BalanceVisibilityContext.Provider
      value={{ visible, toggle: () => setVisible((value) => !value), hide: () => setVisible(false) }}
    >
      {children}
    </BalanceVisibilityContext.Provider>
  );
}
