import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getCardRequisites, type CardRequisites } from '~/entities/card';

export function useCardRequisites(id: string) {
  const [requisites, setRequisites] = useState<CardRequisites>();
  const pending = useRef<AbortController | undefined>(undefined);
  const { mutate, isPending, isError } = useMutation({
    mutationKey: ['card', 'reveal', id],
    gcTime: 0,
    retry: false,
    mutationFn: async () => {
      pending.current?.abort();
      const controller = new AbortController();
      pending.current = controller;
      setRequisites(undefined);
      try {
        const data = await getCardRequisites(id, controller.signal);
        if (!controller.signal.aborted) setRequisites(data);
      } catch (error) {
        if (!controller.signal.aborted) throw error;
      }
      // Never return credentials into the mutation cache.
    },
  });
  useEffect(() => {
    mutate();
    return () => pending.current?.abort();
  }, [id, mutate]);
  return { requisites, isPending, isError, retry: () => mutate() };
}
