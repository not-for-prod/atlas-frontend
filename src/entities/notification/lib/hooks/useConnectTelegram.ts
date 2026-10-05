import { useMutation } from '@tanstack/react-query';
import { startTelegramConnection } from '../api';
export function useConnectTelegram() {
  return useMutation({
    mutationFn: startTelegramConnection,
    retry: false,
    onSuccess: (target) => {
      window.location.assign(target);
    },
  });
}
