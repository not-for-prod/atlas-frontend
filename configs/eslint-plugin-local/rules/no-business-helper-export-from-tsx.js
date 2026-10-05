const {
  getFilename,
  getNameFromExportDeclaration,
  isBusinessHelperName,
  isTsxFile,
} = require('./lib/architecture');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbids exporting business/data helpers from TSX component files.',
    },
    messages: {
      businessHelperExport:
        'Business helper "{{name}}" must be exported from lib/model/utils .ts files, not TSX.',
    },
    schema: [],
  },
  create(context) {
    const filename = getFilename(context);

    if (!isTsxFile(filename)) {
      return {};
    }

    return {
      ExportNamedDeclaration(node) {
        const declarationName = getNameFromExportDeclaration(node);

        if (isBusinessHelperName(declarationName)) {
          context.report({
            node: node.declaration.id || node.declaration,
            messageId: 'businessHelperExport',
            data: { name: declarationName },
          });
        }

        for (const specifier of node.specifiers) {
          const name = specifier.exported?.name ?? specifier.exported?.value;

          if (isBusinessHelperName(name)) {
            context.report({
              node: specifier,
              messageId: 'businessHelperExport',
              data: { name },
            });
          }
        }
      },
    };
  },
};
