const path = require('path');

const FORBIDDEN_LAYERS = ['app', 'views', 'widgets', 'features'];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Слой entities не должен импортировать из вышестоящих слоёв (app, views, widgets, features)',
    },
    messages: {
      forbidden:
        'Импорт из слоя "{{layer}}" запрещён в entities. Entities может зависеть только от shared и других entities.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.split(path.sep).join('/');

    if (!normalizedPath.includes('/src/entities/')) {
      return {};
    }

    function check(source) {
      if (!source || typeof source.value !== 'string') {
        return;
      }

      const importPath = source.value;
      const matchAlias = importPath.match(/^~\/(\w+)/);

      if (matchAlias) {
        const layer = matchAlias[1];

        if (FORBIDDEN_LAYERS.includes(layer)) {
          context.report({
            node: source,
            messageId: 'forbidden',
            data: { layer },
          });
        }

        return;
      }

      if (!importPath.startsWith('.')) {
        return;
      }

      const absoluteImportPath = path.resolve(path.dirname(filename), importPath);
      const normalizedImportPath = absoluteImportPath.split(path.sep).join('/');
      const srcMatch = normalizedImportPath.match(/\/src\/(\w+)/);

      if (!srcMatch) {
        return;
      }

      const layer = srcMatch[1];

      if (FORBIDDEN_LAYERS.includes(layer)) {
        context.report({
          node: source,
          messageId: 'forbidden',
          data: { layer },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        check(node.source);
      },
      ImportExpression(node) {
        if (node.source && node.source.type === 'Literal') {
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
