const ruleTester = require('./rule-tester');
const rule = require('../no-query-invalidation-in-ui');

ruleTester.run('no-query-invalidation-in-ui', rule, {
  valid: [
    {
      code: `
                import { useQueryClient } from '@tanstack/react-query';
                export const usePaymentAction = () => {
                    const queryClient = useQueryClient();
                    return () => queryClient.invalidateQueries({ queryKey: ['profile'] });
                };
            `,
      filename: '/project/src/features/PaymentAction/lib/hooks/usePaymentAction.ts',
    },
  ],
  invalid: [
    {
      code: `
                import { useQueryClient } from '@tanstack/react-query';
                export const PaymentActionForm = () => {
                    const queryClient = useQueryClient();
                    return <button onClick={() => queryClient.invalidateQueries({ queryKey: ['profile'] })} />;
                };
            `,
      filename: '/project/src/features/PaymentAction/components/PaymentActionForm.tsx',
      errors: [{ messageId: 'queryInvalidationInUi' }, { messageId: 'queryInvalidationInUi' }],
    },
  ],
});
