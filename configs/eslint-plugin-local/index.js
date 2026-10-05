const fs = require('fs');
const path = require('path');
const { name, version } = require('./package.json');

const rulesDir = path.join(__dirname, 'rules');

const rules = fs
  .readdirSync(rulesDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
  .reduce((acc, entry) => {
    const ruleName = path.basename(entry.name, '.js');

    acc[ruleName] = require(path.join(rulesDir, entry.name));

    return acc;
  }, {});

module.exports = {
  meta: { name, version },
  rules,
};
