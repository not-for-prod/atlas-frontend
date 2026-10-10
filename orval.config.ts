import { defineConfig } from 'orval';
const target = process.env.ATLAS_OPENAPI_FILE;
if (!target)
  throw new Error(
    'Set ATLAS_OPENAPI_FILE to an agreed Atlas OpenAPI snapshot. No API schema is bundled yet.',
  );
export default defineConfig({
  atlas: {
    input: target,
    output: {
      mode: 'tags-split',
      clean: true,
      target: 'src/generated/atlas/client.ts',
      schemas: 'src/generated/atlas/model',
      client: 'react-query',
      override: {
        mutator: { path: './src/shared/api/kyMutator.ts', name: 'kyMutator' },
        query: { useQuery: true, useMutation: false },
      },
    },
  },
});
