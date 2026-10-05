const ruleTester = require('./rule-tester');
const rule = require('../no-cross-slice-internal-imports');

ruleTester.run('no-cross-slice-internal-imports', rule, {
  valid: [
    {
      code: "import { useDepositPayment } from '~/entities/payment';",
      filename: '/project/src/views/Portfolio/Portfolio.tsx',
    },
    {
      code: "import { helper } from '~/features/search/lib/helper';",
      filename: '/project/src/features/search/ui/Search.tsx',
    },
  ],
  invalid: [
    {
      code: "import { useDepositPayment } from '~/entities/payment/lib/hooks';",
      filename: '/project/src/views/Portfolio/Portfolio.tsx',
      errors: [{ messageId: 'forbiddenInternalImport' }],
    },
    {
      code: "import { PaymentActionForm } from '~/features/PaymentAction/components/PaymentActionForm';",
      filename: '/project/src/views/Portfolio/Portfolio.tsx',
      errors: [{ messageId: 'forbiddenInternalImport' }],
    },
  ],
});
