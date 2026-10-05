import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveKYC } from '../api';
export function useSaveKYC() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['kyc'],
    mutationFn: saveKYC,
    retry: false,
    gcTime: 0,
    onSuccess: (response) => {
      if (client.getQueryState(['kyc'])) client.setQueryData(['kyc'], { level: response.level });
    },
  });
}
