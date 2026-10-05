const path = require('path');

const FSD_LAYERS = ['app', 'views', 'widgets', 'features', 'entities', 'shared'];
const SLICED_LAYERS = ['views', 'widgets', 'features', 'entities', 'shared'];
const GENERATED_PREFIX = '~/generated/';
const BUSINESS_HELPER_PATTERN =
  /^(build[A-Z]|create[A-Z].*Request$|serialize[A-Z]|deserialize[A-Z]|validate[A-Z]|to[A-Z].*ViewModel$|prepare[A-Z].*Data$|get[A-Z].*QueryKey$)/;

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function getFilename(context) {
  return normalizePath(context.filename || context.getFilename());
}

function getProjectPath(filename) {
  const normalized = normalizePath(filename);
  const srcIndex = normalized.indexOf('/src/');

  if (srcIndex !== -1) {
    return normalized.slice(srcIndex + 1);
  }

  if (normalized.startsWith('src/')) {
    return normalized;
  }

  return normalized;
}

function isTestFile(filename) {
  const normalized = normalizePath(filename);

  return (
    normalized.includes('/__tests__/') ||
    normalized.includes('.spec.') ||
    normalized.includes('.test.') ||
    normalized.includes('.stories.')
  );
}

function isTsxFile(filename) {
  return normalizePath(filename).endsWith('.tsx');
}

function isNextRoutePageFile(filename) {
  const projectPath = getProjectPath(filename);

  return /^src\/app\/.+\/page\.tsx$/.test(projectPath);
}

function isViewRootFile(filename) {
  const projectPath = getProjectPath(filename);

  return /^src\/views\/[^/]+\/[^/]+\.tsx$/.test(projectPath) && !projectPath.includes('/components/');
}

function isUiFile(filename) {
  const projectPath = getProjectPath(filename);

  if (!isTsxFile(projectPath) || isTestFile(projectPath)) {
    return false;
  }

  return (
    /^src\/app\/.+\.tsx$/.test(projectPath) ||
    /^src\/views\/.+\.tsx$/.test(projectPath) ||
    /^src\/widgets\/.+\.tsx$/.test(projectPath) ||
    /^src\/features\/[^/]+\/components\/.+\.tsx$/.test(projectPath) ||
    /^src\/features\/[^/]+\/ui\/.+\.tsx$/.test(projectPath) ||
    /^src\/shared\/ui\/.+\.tsx$/.test(projectPath) ||
    /^src\/pages\/.+\.tsx$/.test(projectPath)
  );
}

function isGeneratedSource(source) {
  return typeof source === 'string' && source.startsWith(GENERATED_PREFIX);
}

function isGeneratedModelSource(source) {
  return isGeneratedSource(source) && /\/model(?:\/|$)/.test(source);
}

function isGeneratedApiName(name) {
  return (
    /^use[A-Z0-9_]/.test(name) ||
    /^client[A-Z0-9_]/.test(name) ||
    name.includes('Service') ||
    /^get[A-Z].*(QueryKey|QueryOptions|Url)$/.test(name)
  );
}

function getImportSpecifierName(specifier) {
  if (!specifier) {
    return null;
  }

  if (specifier.type === 'ImportNamespaceSpecifier') {
    return '*';
  }

  if (specifier.type === 'ImportDefaultSpecifier') {
    return specifier.local?.name ?? null;
  }

  return specifier.imported?.name ?? specifier.imported?.value ?? specifier.local?.name ?? null;
}

function isTypeOnlySpecifier(importNode, specifier) {
  return importNode.importKind === 'type' || specifier.importKind === 'type';
}

function hasGeneratedApiImport(importNode) {
  if (
    !importNode.source ||
    !isGeneratedSource(importNode.source.value) ||
    isGeneratedModelSource(importNode.source.value)
  ) {
    return false;
  }

  return importNode.specifiers.some((specifier) => {
    if (isTypeOnlySpecifier(importNode, specifier)) {
      return false;
    }

    const name = getImportSpecifierName(specifier);

    return name === '*' || (typeof name === 'string' && isGeneratedApiName(name));
  });
}

function hasValueImport(importNode) {
  if (importNode.importKind === 'type') {
    return false;
  }

  return importNode.specifiers.some((specifier) => specifier.importKind !== 'type');
}

function isAllowedGeneratedApiUseFile(filename) {
  const projectPath = getProjectPath(filename);

  if (isTestFile(projectPath)) {
    return true;
  }

  return (
    /^src\/entities\/[^/]+\/lib\/.+\.ts$/.test(projectPath) ||
    /^src\/entities\/[^/]+\/effects\.ts$/.test(projectPath) ||
    /^src\/entities\/[^/]+\/model\/.+\.ts$/.test(projectPath) ||
    /^src\/features\/[^/]+\/lib\/hooks\.ts$/.test(projectPath) ||
    /^src\/features\/[^/]+\/lib\/hooks\/[^/]+\.ts$/.test(projectPath) ||
    /^src\/features\/[^/]+\/model\/.+\.ts$/.test(projectPath)
  );
}

function isGeneratedApiWrapperFile(filename) {
  const projectPath = getProjectPath(filename);

  return (
    /^src\/entities\/[^/]+\/lib\/hooks\.ts$/.test(projectPath) ||
    /^src\/entities\/[^/]+\/lib\/hooks\/[^/]+\.ts$/.test(projectPath) ||
    /^src\/entities\/[^/]+\/effects\.ts$/.test(projectPath) ||
    /^src\/features\/[^/]+\/lib\/hooks\.ts$/.test(projectPath) ||
    /^src\/features\/[^/]+\/lib\/hooks\/[^/]+\.ts$/.test(projectPath) ||
    /^src\/features\/[^/]+\/model\/.+\.ts$/.test(projectPath)
  );
}

function isGeneratedApiInfrastructureFile(filename) {
  const projectPath = getProjectPath(filename);

  return /^src\/shared\/api\/.+\.ts$/.test(projectPath);
}

function isGeneratedModelAllowedFile(filename) {
  const projectPath = getProjectPath(filename);

  return (
    isTestFile(projectPath) ||
    /^src\/entities\/[^/]+\/(lib|model)\/.+\.ts$/.test(projectPath) ||
    /^src\/entities\/[^/]+\/effects\.ts$/.test(projectPath) ||
    /^src\/features\/[^/]+\/(lib|model)\/.+\.ts$/.test(projectPath)
  );
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegExp(pattern) {
  const normalized = normalizePath(pattern);
  let escaped = '';

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];

    if (character !== '*') {
      escaped += escapeRegExp(character);
      continue;
    }

    if (normalized[index + 1] === '*') {
      escaped += '.*';
      index += 1;
    } else {
      escaped += '[^/]*';
    }
  }

  return new RegExp(`^${escaped}$`);
}

function matchesPathPattern(filename, pattern) {
  const projectPath = getProjectPath(filename);
  const normalizedPattern = normalizePath(pattern);
  const matcher = globToRegExp(normalizedPattern);

  return matcher.test(projectPath) || matcher.test(normalizePath(filename));
}

function isPascalCase(name) {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

function getCallName(callee) {
  if (!callee) {
    return null;
  }

  if (callee.type === 'Identifier') {
    return callee.name;
  }

  if (callee.type === 'MemberExpression') {
    return callee.property?.name ?? callee.property?.value ?? null;
  }

  return null;
}

function isComponentVariableDeclarator(node) {
  if (!node.id || node.id.type !== 'Identifier' || !isPascalCase(node.id.name) || !node.init) {
    return false;
  }

  if (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression') {
    return true;
  }

  if (node.init.type === 'CallExpression') {
    const callName = getCallName(node.init.callee);

    return ['memo', 'forwardRef'].includes(callName);
  }

  return false;
}

function getComponentNameFromNode(node) {
  if (node.type === 'FunctionDeclaration' && node.id && isPascalCase(node.id.name)) {
    return node.id.name;
  }

  if (node.type === 'VariableDeclarator' && isComponentVariableDeclarator(node)) {
    return node.id.name;
  }

  return null;
}

function getFileBaseName(filename) {
  return path.basename(normalizePath(filename), path.extname(filename));
}

function getNameFromExportDeclaration(node) {
  const declaration = node.declaration;

  if (!declaration) {
    return null;
  }

  if (declaration.type === 'FunctionDeclaration') {
    return declaration.id?.name ?? null;
  }

  if (declaration.type === 'VariableDeclaration') {
    const declarator = declaration.declarations[0];

    return declarator?.id?.name ?? null;
  }

  if (
    declaration.type === 'TSInterfaceDeclaration' ||
    declaration.type === 'TSTypeAliasDeclaration' ||
    declaration.type === 'ClassDeclaration'
  ) {
    return declaration.id?.name ?? null;
  }

  return null;
}

function isBusinessHelperName(name) {
  return typeof name === 'string' && BUSINESS_HELPER_PATTERN.test(name);
}

function parseAlias(source) {
  const match = typeof source === 'string' ? source.match(/^~\/([^/]+)(?:\/([^/]+))?(?:\/(.*))?$/) : null;

  if (!match) {
    return null;
  }

  const [, layer, slice, rest = ''] = match;

  if (!FSD_LAYERS.includes(layer)) {
    return null;
  }

  if (layer === 'app') {
    return {
      layer,
      slice: null,
      rest: slice ? [slice, rest].filter(Boolean).join('/') : rest,
    };
  }

  if (!slice) {
    return null;
  }

  return { layer, slice, rest };
}

function parseFilenameSlice(filename) {
  const projectPath = getProjectPath(filename);
  const match = projectPath.match(/^src\/([^/]+)(?:\/([^/]+))?/);

  if (!match) {
    return null;
  }

  const [, layer, slice] = match;

  if (!FSD_LAYERS.includes(layer)) {
    return null;
  }

  if (layer === 'app') {
    return { layer, slice: null };
  }

  if (!SLICED_LAYERS.includes(layer) || !slice) {
    return null;
  }

  return { layer, slice };
}

function isSameSlice(current, imported) {
  return Boolean(current && imported && current.layer === imported.layer && current.slice === imported.slice);
}

module.exports = {
  getCallName,
  getComponentNameFromNode,
  getFileBaseName,
  getFilename,
  getImportSpecifierName,
  getNameFromExportDeclaration,
  getProjectPath,
  hasGeneratedApiImport,
  hasValueImport,
  isAllowedGeneratedApiUseFile,
  isBusinessHelperName,
  isGeneratedApiName,
  isGeneratedApiInfrastructureFile,
  isGeneratedApiWrapperFile,
  isGeneratedModelAllowedFile,
  isGeneratedModelSource,
  isGeneratedSource,
  isNextRoutePageFile,
  isPascalCase,
  isSameSlice,
  isTestFile,
  isTypeOnlySpecifier,
  isTsxFile,
  isUiFile,
  isViewRootFile,
  matchesPathPattern,
  parseAlias,
  parseFilenameSlice,
};
