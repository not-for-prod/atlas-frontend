import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSbpPayment } from '../sbpApi';
export function useCreateSbpPayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createSbpPayment,
    retry: false,
    gcTime: 0,
    onSuccess: (payment) => client.setQueryData(['payment', 'sbp', payment.id], payment),
  });
}
