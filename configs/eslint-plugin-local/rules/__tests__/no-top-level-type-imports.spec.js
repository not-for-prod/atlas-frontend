const rule = require('../no-top-level-type-imports');
const ruleTester = require('./rule-tester');

ruleTester.run('no-top-level-type-imports', rule, {
  valid: [
    {
      name: 'Разрешает inline type import',
      code: "import { type EventViewModel } from '~/entities/event';",
    },
    {
      name: 'Разрешает смешанный value и inline type import',
      code: "import { createEvent, type EventViewModel } from '~/entities/event';",
    },
    {
      name: 'Разрешает обычный value import',
      code: "import { EventViewModel } from '~/entities/event';",
    },
    {
      name: 'Не трогает default type import',
      code: "import type EventViewModel from '~/entities/event';",
    },
    {
      name: 'Не трогает namespace type import',
      code: "import type * as EventTypes from '~/entities/event';",
    },
  ],
  invalid: [
    {
      name: 'Запрещает top-level type import для named specifier',
      code: "import type { EventViewModel } from '~/entities/event';",
      output: "import { type EventViewModel } from '~/entities/event';",
      errors: [
        {
          messageId: 'forbidden',
          data: { imported: 'EventViewModel' },
        },
      ],
    },
    {
      name: 'Запрещает top-level type import с несколькими named specifiers',
      code: "import type { EventViewModel, EventStatus } from '~/entities/event';",
      output: "import { type EventViewModel, type EventStatus } from '~/entities/event';",
      errors: [
        {
          messageId: 'forbidden',
          data: { imported: 'EventViewModel, EventStatus' },
        },
      ],
    },
    {
      name: 'Запрещает top-level type import с alias',
      code: "import type { EventViewModel as EventVM } from '~/entities/event';",
      output: "import { type EventViewModel as EventVM } from '~/entities/event';",
      errors: [
        {
          messageId: 'forbidden',
          data: { imported: 'EventVM' },
        },
      ],
    },
    {
      name: 'Запрещает top-level type re-export для named specifier',
      code: "export type { ResponsiveModalProps } from './ResponsiveModal';",
      output: "export { type ResponsiveModalProps } from './ResponsiveModal';",
      errors: [
        {
          messageId: 'forbidden',
          data: { imported: 'ResponsiveModalProps' },
        },
      ],
    },
  ],
});
