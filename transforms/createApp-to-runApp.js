const nodePath = require('path');

module.exports = (fileInfo, api, options) => {
  const { jscodeshift } = api;
  const printOptions = options.printOptions || { quote: 'single' };
  const basename = nodePath.basename(fileInfo.path);

  let localCreateAppName = 'createApp';
  const localRunAppName = 'runApp';

  function replaceCreateAppImport(j, root) {
    let hasModification = false;

    root
      .find(j.Identifier)
      .filter(
        (path) =>
          path.node.name === 'createApp' &&
          path.parent.node.type === 'ImportSpecifier' &&
          path.parent.parent.node.source.value === 'ice',
      )
      .forEach((path) => {
        hasModification = true;
        localCreateAppName = path.parent.node.local.name;
        j(path).replaceWith(j.identifier(localRunAppName));
      });
    return hasModification;
  }

  function replaceCreateAppReferences(j, root) {
    let hasModification = false;

    root
      .find(j.Identifier)
      .filter(
        (path) =>
          path.node.name === localCreateAppName &&
          path.parent.node.type === 'CallExpression' &&
          path.parent.parent.node.type === 'ExpressionStatement' &&
          path.parent.parent.parent.node.type === 'Program',
      )
      .forEach((path) => {
        hasModification = true;
        j(path).replaceWith(j.identifier(localRunAppName));
      });
    return hasModification;
  }

  if (basename === 'app.ts' || basename === 'app.js') {
    const root = jscodeshift(fileInfo.source);
    let hasModifications = false;
    hasModifications = replaceCreateAppImport(jscodeshift, root) || hasModifications;
    hasModifications = replaceCreateAppReferences(jscodeshift, root) || hasModifications;

    return hasModifications ? root.toSource(printOptions) : null;
  }
};

module.exports.title = 'createApp to runApp';
module.exports.description = 'Convert createApp(...) calls to runApp(...)';
