const ruleTester = require('./rule-tester');
const rule = require('../no-business-helper-export-from-tsx');

ruleTester.run('no-business-helper-export-from-tsx', rule, {
  valid: [
    {
      code: `
                export interface HomeProps {
                    title: string;
                }
                export const Home = ({ title }) => <main>{title}</main>;
            `,
      filename: '/project/src/views/Home/Home.tsx',
    },
  ],
  invalid: [
    {
      code: 'export const createPaymentRequest = () => ({});',
      filename: '/project/src/features/PaymentAction/components/PaymentActionForm.tsx',
      errors: [{ messageId: 'businessHelperExport' }],
    },
    {
      code: 'export function serializePaymentForm() { return {}; }',
      filename: '/project/src/features/PaymentAction/components/PaymentActionForm.tsx',
      errors: [{ messageId: 'businessHelperExport' }],
    },
  ],
});
