const ruleTester = require('./rule-tester');
const rule = require('../thin-next-route-pages');

ruleTester.run('thin-next-route-pages', rule, {
  valid: [
    {
      code: `
                import { EventDetails } from '~/views/EventDetails';
                export default async function EventPage({ params }) {
                    const { slug } = await params;
                    return <EventDetails slug={slug} />;
                }
            `,
      filename: '/project/src/app/[locale]/events/[slug]/page.tsx',
    },
  ],
  invalid: [
    {
      code: "import { useClientEventServiceGetEvent } from '~/generated/atlas/event';",
      filename: '/project/src/app/[locale]/events/[slug]/page.tsx',
      errors: [{ messageId: 'forbiddenRouteImport' }],
    },
    {
      code: "import { useQuery } from '@tanstack/react-query';",
      filename: '/project/src/app/[locale]/events/[slug]/page.tsx',
      errors: [{ messageId: 'forbiddenRouteImport' }],
    },
    {
      code: `
                const EventDetails = () => <section />;
                export default function Page() {
                    return <EventDetails />;
                }
            `,
      filename: '/project/src/app/[locale]/events/[slug]/page.tsx',
      errors: [{ messageId: 'routeHasExtraComponents' }],
    },
  ],
});
