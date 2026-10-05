import { useQuery } from '@tanstack/react-query';
import { getNotificationSettings } from '../api';
export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification', 'settings'],
    queryFn: ({ signal }) => getNotificationSettings(signal),
    retry: false,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
