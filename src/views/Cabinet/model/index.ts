import { type DashboardSnapshot } from '~/views/Dashboard';
export const cabinetSections = [
  'overview',
  'cards',
  'card',
  'history',
  'support',
  'profile',
  'deposit',
  'issue',
] as const;
export type CabinetSection = (typeof cabinetSections)[number];
// Standalone demonstration data, never used as a fallback for a backend request.
export const cabinetDemo: Extract<DashboardSnapshot, { state: 'ready' }> = {
  state: 'ready',
  availableAmount: '845.00',
  reservedAmount: '15.00',
  cardBalanceAmount: '128.00',
  activity: [
    { id: 'cabinet-example-deposit', kind: 'deposit', when: 'today', amount: '250.00', status: 'success' },
    { id: 'cabinet-example-topup', kind: 'topup', when: 'yesterday', amount: '-50.00', status: 'pending' },
    { id: 'cabinet-example-issue', kind: 'issue', when: 'earlier', amount: '-15.00', status: 'reserved' },
  ],
};
