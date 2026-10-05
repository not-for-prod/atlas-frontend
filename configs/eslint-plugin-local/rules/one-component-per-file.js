const { getComponentNameFromNode, getFilename, isTestFile, isTsxFile } = require('./lib/architecture');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Allows only one PascalCase React component declaration per TSX file.',
    },
    messages: {
      multipleComponents:
        'TSX files must declare one React component. Move "{{name}}" into a colocated components/ file.',
    },
    schema: [],
  },
  create(context) {
    const filename = getFilename(context);

    if (!isTsxFile(filename) || isTestFile(filename)) {
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
      FunctionDeclaration: record,
      VariableDeclarator: record,
      'Program:exit'() {
        if (components.length <= 1) {
          return;
        }

        const extraComponent = components[0];

        context.report({
          node: extraComponent.node,
          messageId: 'multipleComponents',
          data: { name: extraComponent.name },
        });
      },
    };
  },
};
