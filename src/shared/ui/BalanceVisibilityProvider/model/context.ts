import { createContext } from 'react';
export const BalanceVisibilityContext = createContext<{
  visible: boolean;
  toggle: () => void;
  hide: () => void;
} | null>(null);
