import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveKYCContacts } from '../api';
import { type KYCContacts } from '../../model';
export function useSaveKYCContacts() {
  const client = useQueryClient();
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  return useMutation({
    mutationKey: ['kyc', 'contacts'],
    retry: false,
    gcTime: 0,
    mutationFn: (contacts: KYCContacts) => {
      pending.current?.abort();
      pending.current = new AbortController();
      return saveKYCContacts(contacts, pending.current.signal);
    },
    // Contacts response is generic; each card must re-read its own eligibility.
    onSuccess: () => client.invalidateQueries({ queryKey: ['kyc'] }),
  });
}
