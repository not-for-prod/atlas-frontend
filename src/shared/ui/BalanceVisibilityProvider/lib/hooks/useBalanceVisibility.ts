'use client';
import { useContext } from 'react';
import { BalanceVisibilityContext } from '../../model/context';
export function useBalanceVisibility() {
  const context = useContext(BalanceVisibilityContext);
  if (!context) throw new Error('BalanceVisibilityProvider is required');
  return context;
}
