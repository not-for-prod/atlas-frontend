import { type DisplayStatus } from '~/shared/ui/StatusBadge';
// Presentation data only; these are not proposed Atlas API DTOs.
export interface ActivityItem {
  id: string;
  kind: 'deposit' | 'issue' | 'topup';
  when: 'today' | 'yesterday' | 'earlier';
  amount: string;
  status: DisplayStatus;
}
export type DashboardSnapshot =
  | { state: 'loading' | 'provisioning' | 'error' }
  | {
      state: 'ready';
      availableAmount: string;
      reservedAmount: string;
      cardBalanceAmount: string | null;
      activity: ActivityItem[];
    };
