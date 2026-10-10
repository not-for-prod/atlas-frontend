import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startKYCVerification } from '../api';
export function useStartKYCVerification(cardTypeId?: string) {
  const client = useQueryClient();
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  return useMutation({
    mutationKey: ['kyc', 'verification'],
    retry: false,
    gcTime: 0,
    mutationFn: () => {
      if (!cardTypeId) throw new Error('A card type is required');
      pending.current?.abort();
      pending.current = new AbortController();
      return startKYCVerification(cardTypeId, pending.current.signal);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['kyc'] }),
  });
}
