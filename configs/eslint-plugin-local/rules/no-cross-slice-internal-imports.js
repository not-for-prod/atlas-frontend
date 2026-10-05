const { getFilename, isSameSlice, parseAlias, parseFilenameSlice } = require('./lib/architecture');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Requires cross-slice imports to go through public FSD index files.',
    },
    messages: {
      forbiddenInternalImport:
        'Cross-slice import "{{source}}" must use the public API "~/{{layer}}/{{slice}}" instead of an internal subpath.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          ignoredLayers: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
  },
  create(context) {
    const filename = getFilename(context);
    const current = parseFilenameSlice(filename);
    const [{ ignoredLayers = ['shared'] } = {}] = context.options;

    function check(sourceNode) {
      if (!sourceNode || typeof sourceNode.value !== 'string') {
        return;
      }

      const imported = parseAlias(sourceNode.value);

      if (!imported || !imported.rest || ignoredLayers.includes(imported.layer)) {
        return;
      }

      if (isSameSlice(current, imported)) {
        return;
      }

      context.report({
        node: sourceNode,
        messageId: 'forbiddenInternalImport',
        data: {
          source: sourceNode.value,
          layer: imported.layer,
          slice: imported.slice,
        },
      });
    }

    return {
      ImportDeclaration(node) {
        check(node.source);
      },
      ExportNamedDeclaration(node) {
        check(node.source);
      },
      ExportAllDeclaration(node) {
        check(node.source);
      },
      ImportExpression(node) {
        if (node.source?.type === 'Literal') {
          check(node.source);
        }
      },
      CallExpression(node) {
        if (
          node.callee.name === 'require' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal'
        ) {
          check(node.arguments[0]);
        }
      },
    };
  },
};
