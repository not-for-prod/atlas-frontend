import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setNotificationsEnabled } from '../api';
export function useSetNotificationsEnabled() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: setNotificationsEnabled,
    retry: false,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['notification', 'settings'] });
    },
  });
}
