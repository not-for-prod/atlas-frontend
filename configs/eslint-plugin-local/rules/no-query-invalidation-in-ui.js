const { getFilename, isUiFile } = require('./lib/architecture');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbids React Query invalidation in UI component files.',
    },
    messages: {
      queryInvalidationInUi: 'React Query invalidation must live in entity/feature hooks or model effects.',
    },
    schema: [],
  },
  create(context) {
    const filename = getFilename(context);

    if (!isUiFile(filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@tanstack/react-query') {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.imported?.name === 'useQueryClient') {
            context.report({
              node: specifier,
              messageId: 'queryInvalidationInUi',
            });
          }
        }
      },
      MemberExpression(node) {
        const propertyName = node.property?.name ?? node.property?.value;

        if (propertyName === 'invalidateQueries') {
          context.report({
            node: node.property,
            messageId: 'queryInvalidationInUi',
          });
        }
      },
    };
  },
};
