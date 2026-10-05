const path = require('path');

const SLICED_LAYERS = ['views', 'widgets', 'features', 'entities', 'shared'];
const SUPPORTED_LAYERS = ['app', ...SLICED_LAYERS];

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function getSliceInfoFromFilename(filename) {
  const normalizedPath = normalizePath(filename);
  const match = normalizedPath.match(/\/src\/([^/]+)(?:\/([^/]+))?/);

  if (!match) {
    return null;
  }

  const [, layer, slice] = match;

  if (!SUPPORTED_LAYERS.includes(layer)) {
    return null;
  }

  if (layer === 'app') {
    return { layer, slice: null };
  }

  if (!slice) {
    return null;
  }

  return { layer, slice };
}

function getSliceInfoFromAlias(importPath) {
  const match = importPath.match(/^~\/([^/]+)(?:\/([^/]+))?/);

  if (!match) {
    return null;
  }

  const [, layer, slice] = match;

  if (!SUPPORTED_LAYERS.includes(layer)) {
    return null;
  }

  if (layer === 'app') {
    return { layer, slice: null };
  }

  if (!slice) {
    return null;
  }

  return { layer, slice };
}

function isSameSlice(currentSliceInfo, importSliceInfo) {
  return (
    currentSliceInfo &&
    importSliceInfo &&
    currentSliceInfo.layer === importSliceInfo.layer &&
    currentSliceInfo.slice === importSliceInfo.slice
  );
}

function isSameLayerDifferentSlice(currentSliceInfo, importSliceInfo) {
  return (
    currentSliceInfo &&
    importSliceInfo &&
    currentSliceInfo.layer === importSliceInfo.layer &&
    currentSliceInfo.slice !== importSliceInfo.slice
  );
}

function createSourceVisitors(check) {
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
}

module.exports = {
  createSourceVisitors,
  getSliceInfoFromAlias,
  getSliceInfoFromFilename,
  isSameLayerDifferentSlice,
  isSameSlice,
};
