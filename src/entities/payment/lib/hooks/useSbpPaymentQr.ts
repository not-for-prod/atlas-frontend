import { useQuery } from '@tanstack/react-query';
import { getSbpPaymentQr } from '../sbpApi';
export function useSbpPaymentQr(id: string) {
  return useQuery({
    queryKey: ['payment', 'sbp-qr', id],
    queryFn: ({ signal }) => getSbpPaymentQr(id, signal),
    retry: false,
    gcTime: 0,
    refetchInterval: (query) =>
      query.state.status === 'error' || query.state.data?.status === 'SBP_QR_STATUS_PENDING' ? 5000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
