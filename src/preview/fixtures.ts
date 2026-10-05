import { type DashboardSnapshot } from '~/views/Dashboard';
export type Scenario = 'ready' | 'empty' | 'loading' | 'provisioning' | 'error';
export const scenarios: Scenario[] = ['ready', 'empty', 'loading', 'provisioning', 'error'];
export const snapshots: Record<Scenario, DashboardSnapshot> = {
  ready: {
    state: 'ready',
    availableAmount: '1250.50',
    reservedAmount: '25.00',
    cardBalanceAmount: '320.00',
    activity: [
      { id: 'deposit-demo', kind: 'deposit', when: 'today', amount: '500.00', status: 'success' },
      { id: 'topup-demo', kind: 'topup', when: 'yesterday', amount: '-25.00', status: 'pending' },
      { id: 'issue-demo', kind: 'issue', when: 'earlier', amount: '-10.00', status: 'success' },
    ],
  },
  empty: {
    state: 'ready',
    availableAmount: '0.00',
    reservedAmount: '0.00',
    cardBalanceAmount: null,
    activity: [],
  },
  loading: { state: 'loading' },
  provisioning: { state: 'provisioning' },
  error: { state: 'error' },
};
