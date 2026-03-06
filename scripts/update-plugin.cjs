const fs = require('fs');
const path = require('path');

const uiDataPath = path.join(__dirname, 'ui-structure.json');
const templatePath = path.join(__dirname, '../figma-plugin/code.template.js');
const codePath = path.join(__dirname, '../figma-plugin/code.js');

const uiData = fs.readFileSync(uiDataPath, 'utf8');
let code = fs.readFileSync(templatePath, 'utf8');
code = code.replace('__CAPTURED_DATA__', uiData);

fs.writeFileSync(codePath, code);
console.log('Figma Plugin code.js refreshed from template with latest UI data! 🚀');
