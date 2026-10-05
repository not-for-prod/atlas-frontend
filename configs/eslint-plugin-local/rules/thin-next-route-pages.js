const {
  getComponentNameFromNode,
  getFilename,
  isGeneratedSource,
  isNextRoutePageFile,
} = require('./lib/architecture');

const FORBIDDEN_IMPORTS = new Set(['@tanstack/react-query', 'effector-react']);

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keeps Next page.tsx route files as thin delegates to views/guards.',
    },
    messages: {
      forbiddenRouteImport:
        'Next route page files must not import generated API, React Query, or Effector hooks.',
      routeHasExtraComponents: 'Next route page files must declare only the page delegate component.',
    },
    schema: [],
  },
  create(context) {
    const filename = getFilename(context);

    if (!isNextRoutePageFile(filename)) {
      return {};
    }

    const components = [];

    function record(node) {
      const name = getComponentNameFromNode(node);

      if (name) {
        components.push({ node, name });
      }
    }

    return {
      ImportDeclaration(node) {
        if (isGeneratedSource(node.source.value) || FORBIDDEN_IMPORTS.has(node.source.value)) {
          context.report({
            node: node.source,
            messageId: 'forbiddenRouteImport',
          });
        }
      },
      FunctionDeclaration: record,
      VariableDeclarator: record,
      'Program:exit'(node) {
        if (components.length <= 1) {
          return;
        }

        context.report({
          node,
          messageId: 'routeHasExtraComponents',
        });
      },
    };
  },
};
