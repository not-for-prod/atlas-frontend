import { useMutation } from '@tanstack/react-query';
import { requestCryptoAddress } from '../api';
export function useCryptoAddress() {
  return useMutation({ mutationFn: requestCryptoAddress, retry: false, gcTime: 0 });
}
