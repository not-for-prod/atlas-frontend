module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Запрещает top-level import/export type для named specifiers, требуя inline type specifiers',
    },
    fixable: 'code',
    messages: {
      forbidden:
        'Top-level type import/export "{{imported}}" запрещён. Используй inline type specifier: { type ... }.',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;

    function getLocalName(specifier) {
      return specifier.local?.name || sourceCode.getText(specifier);
    }

    function fixToInlineTypeSpecifier(fixer, node, namedSpecifiers) {
      if (node.specifiers.length !== namedSpecifiers.length) {
        return null;
      }

      const firstToken = sourceCode.getFirstToken(node);
      const typeToken = sourceCode.getTokenAfter(firstToken);
      const afterTypeToken = sourceCode.getTokenAfter(typeToken, {
        includeComments: true,
      });

      if (!typeToken || typeToken.value !== 'type' || !afterTypeToken) {
        return null;
      }

      return [
        fixer.removeRange([typeToken.range[0], afterTypeToken.range[0]]),
        ...namedSpecifiers.map((specifier) => fixer.insertTextBefore(specifier, 'type ')),
      ];
    }

    return {
      ImportDeclaration(node) {
        if (node.importKind !== 'type') {
          return;
        }

        const namedSpecifiers = node.specifiers.filter((specifier) => specifier.type === 'ImportSpecifier');

        if (namedSpecifiers.length === 0) {
          return;
        }

        context.report({
          node,
          messageId: 'forbidden',
          data: {
            imported: namedSpecifiers.map(getLocalName).join(', '),
          },
          fix(fixer) {
            return fixToInlineTypeSpecifier(fixer, node, namedSpecifiers);
          },
        });
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind !== 'type') {
          return;
        }

        const namedSpecifiers = node.specifiers.filter((specifier) => specifier.type === 'ExportSpecifier');

        if (namedSpecifiers.length === 0) {
          return;
        }

        context.report({
          node,
          messageId: 'forbidden',
          data: {
            imported: namedSpecifiers.map(getLocalName).join(', '),
          },
          fix(fixer) {
            return fixToInlineTypeSpecifier(fixer, node, namedSpecifiers);
          },
        });
      },
    };
  },
};
