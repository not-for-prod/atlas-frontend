const ruleTester = require('./rule-tester');
const rule = require('../one-component-per-file');

ruleTester.run('one-component-per-file', rule, {
  valid: [
    {
      code: 'export const Home = () => <main />;',
      filename: '/project/src/views/Home/Home.tsx',
    },
    {
      code: `
                const EmptyState = () => <div />;
                export const Home = () => <main />;
            `,
      filename: '/project/src/views/Home/__tests__/Home.spec.tsx',
    },
  ],
  invalid: [
    {
      code: `
                const EmptyState = () => <div />;
                export const Home = () => <main><EmptyState /></main>;
            `,
      filename: '/project/src/views/Home/Home.tsx',
      errors: [{ messageId: 'multipleComponents' }],
    },
    {
      code: `
                function EventsSection() {
                    return <section />;
                }
                export const Home = () => <EventsSection />;
            `,
      filename: '/project/src/views/Home/Home.tsx',
      errors: [{ messageId: 'multipleComponents' }],
    },
  ],
});
