import { type KYCState } from '../../model';
export function isKYCActive(state?: KYCState) {
  return (
    !!state &&
    [
      'VERIFICATION_STATUS_STARTING',
      'VERIFICATION_STATUS_AWAITING_USER',
      'VERIFICATION_STATUS_IN_PROGRESS',
      'VERIFICATION_STATUS_IN_REVIEW',
    ].includes(state.status)
  );
}
