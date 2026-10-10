import { useKYC, useStartKYCVerification, isKYCActive } from '~/entities/kyc';
export function useVerification(cardTypeId?: string) {
  const query = useKYC(cardTypeId);
  const start = useStartKYCVerification(cardTypeId);
  const state = query.data;
  const active = isKYCActive(state);
  const identityReady = state?.status === 'VERIFICATION_STATUS_APPROVED' && !state.missingChecks.length;
  function continueVerification(url: string) {
    // Retain only the public card selection across Didit's redirect, never its bearer URL or contacts.
    try {
      if (cardTypeId) sessionStorage.setItem('atlas.kyc.cardTypeId', cardTypeId);
      else sessionStorage.removeItem('atlas.kyc.cardTypeId');
    } catch {
      /* Verification still works with browser storage disabled. */
    }
    window.location.assign(url);
  }
  function verify() {
    if (start.isPending || query.isFetching || !state) return;
    if (active && state.verificationUrl) {
      continueVerification(state.verificationUrl);
      return;
    }
    if (active || identityReady || !cardTypeId) return;
    start.mutate(undefined, {
      onSuccess: (result) => {
        if (result.verificationUrl && isKYCActive(result)) continueVerification(result.verificationUrl);
      },
    });
  }
  return {
    query,
    start,
    active,
    identityReady,
    verify,
    canVerify:
      !!state && ((active && !!state.verificationUrl) || (!!cardTypeId && !active && !identityReady)),
  };
}
